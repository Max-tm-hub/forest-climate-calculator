// calculator.js
import { getCO2IncrementData, isTreeTypeSupported, getSupportedTreeTypes } from '../data/co2Increment';

// IRR (метод Ньютона)
export function calculateIRR(cashFlows, guess = 0.1) {
  const maxIter = 100;
  const tol = 1e-6;
  let rate = guess;
  for (let i = 0; i < maxIter; i++) {
    let npv = 0, dNpv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      npv += cashFlows[t] / Math.pow(1 + rate, t);
      dNpv -= t * cashFlows[t] / Math.pow(1 + rate, t + 1);
    }
    const newRate = rate - npv / dNpv;
    if (Math.abs(newRate - rate) < tol) return newRate;
    rate = newRate;
  }
  return NaN;
}

// Основной расчёт
export function calculateProject(params) {
  // Преобразование процентов в доли для расчетов
  const discountRate = (params.discountRate || 10) / 100;
  const inflation = (params.inflation || 3) / 100;
  const profitTaxRate = (params.profitTaxRate || 20) / 100;

  const {
    treeType, areaHa, projectYears = 80,
    landPrice = 500000, prepPerHa = 20000,
    seedlingsPerHa = 1300, seedlingCost = 120,
    plantingCostPerHa = 10000, pestsInitialPerHa = 8000,
    equipmentPerHa = 20000, designVerification = 600000,
    weedingCostPerHa = 5000, weedingFreq = 2,
    pruningCostPerHa = 1000, pruningFreq = 1,
    thinningCostPerHa = 120000,
    carbonUnitPrice = 1100, timberPrice = 1900,
    timberVolumePerHa = 200, timberHarvestCost = 50,
    transportCostPerKm = 10, transportDistance = 50,
  } = params;

  // Проверяем корректность параметров
  if (!treeType) {
    throw new Error('Не выбрана порода деревьев');
  }
  
  if (!isTreeTypeSupported(treeType)) {
    const supportedTypes = getSupportedTreeTypes();
    throw new Error(
      `Порода "${treeType}" не поддерживается. ` +
      `Доступные породы: ${supportedTypes.join(', ')}`
    );
  }

  if (projectYears < 1 || projectYears > 100) {
    throw new Error('Срок проекта должен быть от 1 до 100 лет');
  }

  // === 1. ИНВЕСТИЦИИ ===
  const landCost = landPrice;
  const prepCost = prepPerHa * areaHa;
  const seedlingsCost = seedlingsPerHa * seedlingCost * areaHa;
  const plantingCost = plantingCostPerHa * areaHa;
  const pestsCost = pestsInitialPerHa * areaHa;
  const equipmentCost = equipmentPerHa * areaHa;
  
  const totalInvestment = landCost + prepCost + seedlingsCost + plantingCost + 
                         pestsCost + equipmentCost + designVerification;
  
  const depreciableInvestment = totalInvestment - landCost;
  const annualDepreciation = projectYears > 0 ? depreciableInvestment / projectYears : 0;

  // === 2. ДАННЫЕ ПО ПОГЛОЩЕНИЮ CO₂ ===
  const requiredYears = projectYears + 1;
  const incrementProfile = getCO2IncrementData(treeType, requiredYears);

  const years = Array.from({ length: projectYears + 1 }, (_, i) => i);
  const inflationFactor = years.map(y => Math.pow(1 + inflation, y));

  // === 3. РАСЧЕТ ПО ГОДАМ ===
  const carbonUnits = [];
  const revenues = [];
  const opex = [];
  const cashFlows = [];
  const discountedCashFlows = [];

  let timberRevenue = 0;

  for (let y = 0; y <= projectYears; y++) {
    const inf = inflationFactor[y];
    
    // Поглощение CO₂
    const cu = (incrementProfile[y] * areaHa) / 1000; // тонн CO₂
    carbonUnits[y] = cu;

    // ВЫРУЧКА
    let totalRevenue = 0;
    
    // Выручка от углеродных единиц (ежегодно, кроме года 0)
    if (y > 0) {
      totalRevenue += cu * carbonUnitPrice * inf;
    }

    // Выручка от древесины (только в последний год)
    if (y === projectYears) {
      const volume = timberVolumePerHa * areaHa;
      const harvestCost = timberHarvestCost * volume;
      const transportCost = transportCostPerKm * transportDistance * volume;
      const netTimberRevenue = (volume * timberPrice - (harvestCost + transportCost)) * inf;
      totalRevenue += netTimberRevenue;
      timberRevenue = netTimberRevenue;
    }
    
    revenues[y] = totalRevenue;

    // ОПЕРАЦИОННЫЕ РАСХОДЫ
    let annualOpex = 0;
    
    if (y > 0) {
      // Ежегодные операционные расходы
      annualOpex += weedingCostPerHa * weedingFreq * areaHa * inf;
      annualOpex += pruningCostPerHa * pruningFreq * areaHa * inf;
      
      // Прореживание каждые 10 лет
      if (y % 10 === 0 && y > 0) {
        annualOpex += thinningCostPerHa * areaHa * inf;
      }
    }
    
    opex[y] = -annualOpex;

    // ФИНАНСОВЫЕ ПОКАЗАТЕЛИ
    const ebitda = totalRevenue + opex[y]; // EBITDA = Выручка - Операционные расходы
    const profitBeforeTax = ebitda - (y > 0 ? annualDepreciation : 0);
    const tax = Math.max(0, profitBeforeTax * profitTaxRate);

    // ДЕНЕЖНЫЙ ПОТОК
    let cf = 0;
    if (y === 0) {
      cf = -totalInvestment; // Инвестиции в год 0
    } else {
      // CF = EBITDA - Налоги + Амортизация
      cf = ebitda - tax + annualDepreciation;
    }
    
    cashFlows[y] = cf;
    discountedCashFlows[y] = cf / Math.pow(1 + discountRate, y);
  }

  // === 4. ФИНАНСОВЫЕ МЕТРИКИ ===
  const npv = discountedCashFlows.reduce((a, b) => a + b, 0);
  const irr = calculateIRR(cashFlows);
  
  // Срок окупаемости (простой)
  let cumulative = 0;
  let simplePayback = -1;
  for (let i = 0; i <= projectYears; i++) {
    cumulative += cashFlows[i];
    if (cumulative >= 0 && simplePayback === -1) {
      simplePayback = i;
    }
  }
  
  // Срок окупаемости (дисконтированный)
  cumulative = 0;
  let discountedPayback = -1;
  for (let i = 0; i <= projectYears; i++) {
    cumulative += discountedCashFlows[i];
    if (cumulative >= 0 && discountedPayback === -1) {
      discountedPayback = i;
    }
  }

  const totalCarbonUnits = carbonUnits.reduce((a, b) => a + b, 0);
  const totalInvestmentCost = Math.abs(cashFlows[0]);
  const totalOpexCost = opex.slice(1).reduce((a, b) => a + Math.abs(b), 0);
  const totalCosts = totalInvestmentCost + totalOpexCost;
  
  const cuCost = totalCarbonUnits > 0 ? totalCosts / totalCarbonUnits : Infinity;
  const totalRevenueSum = revenues.reduce((a, b) => a + b, 0);
  const totalProfit = totalRevenueSum - totalCosts;
  const roi = totalInvestmentCost > 0 ? (totalProfit / totalInvestmentCost) * 100 : 0;
  const profitabilityIndex = totalInvestmentCost > 0 ? (npv + totalInvestmentCost) / totalInvestmentCost : 0;

  return {
    carbonUnits,
    revenues,
    opex,
    cashFlows,
    discountedCashFlows,
    timberRevenue,
    financials: {
      npv: Math.round(npv),
      irr: isNaN(irr) ? '—' : (irr * 100).toFixed(1) + '%',
      simplePayback: simplePayback === -1 ? '—' : simplePayback,
      discountedPayback: discountedPayback === -1 ? '—' : discountedPayback,
      cuCost: Math.round(cuCost),
      roi: roi.toFixed(1) + '%',
      profitabilityIndex: parseFloat(profitabilityIndex.toFixed(3)),
    }
  };
}
