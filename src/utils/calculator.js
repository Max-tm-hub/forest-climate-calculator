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

  // === 1. Инвестиции ===
  const landCost = landPrice;
  const prepCost = prepPerHa * areaHa;
  const seedlingsCost = seedlingsPerHa * seedlingCost * areaHa;
  const plantingCost = plantingCostPerHa * areaHa;
  const pestsCost = pestsInitialPerHa * areaHa;
  const equipmentCost = equipmentPerHa * areaHa;
  const totalInvestment = landCost + prepCost + seedlingsCost + plantingCost + pestsCost + equipmentCost + designVerification;
  const depreciableInvestment = totalInvestment - landCost;
  const annualDepreciation = projectYears > 0 ? depreciableInvestment / projectYears : 0;

  // === 2. Данные по приросту CO₂ ===
  const requiredYears = projectYears + 1;
  const cumulativeCarbonData = getCO2IncrementData(treeType, requiredYears);

  const years = Array.from({ length: projectYears + 1 }, (_, i) => i);
  const inflationFactor = years.map(y => Math.pow(1 + inflation, y));

  // === 3. Расчёт по годам ===
  const carbonUnits = [];
  const annualCarbonIncrement = []; // Прирост за год
  const revenues = [];
  const opex = [];
  const cashFlows = [];
  const discountedCashFlows = [];
  const cumulativeDiscountedCashFlows = []; // НАРАСТАЮЩИЙ ИТОГ дисконтированных потоков

  let timberRevenue = 0;

  for (let y = 0; y <= projectYears; y++) {
    const inf = inflationFactor[y];
    
    // Используем накопительные данные
    const cumulativeCarbon = cumulativeCarbonData[y] * areaHa; // тонн CO₂
    carbonUnits[y] = cumulativeCarbon;

    // Рассчитываем прирост за текущий год
    let annualCarbon = 0;
    if (y === 0) {
      annualCarbon = 0;
    } else {
      annualCarbon = cumulativeCarbon - carbonUnits[y - 1];
    }
    annualCarbonIncrement[y] = annualCarbon;

    // ВЫРУЧКА ОТ УЕ - продаем только ПРИРОСТ за текущий год, а не все накопленные!
    const revenueCarbon = y > 0 ? annualCarbon * carbonUnitPrice * inf : 0;

    // Выручка от древесины — только в последний год
    let revenueTimber = 0;
    if (y === projectYears) {
      const volume = timberVolumePerHa * areaHa;
      const harvestCost = timberHarvestCost * volume;
      const transportCost = transportCostPerKm * transportDistance * volume;
      revenueTimber = volume * timberPrice * inf - (harvestCost + transportCost) * inf;
      timberRevenue = revenueTimber;
    }

    const totalRevenue = revenueCarbon + revenueTimber;
    revenues[y] = totalRevenue;

    // Операционные расходы
    let annualOpex = 0;
    if (y > 0) {
      annualOpex += weedingCostPerHa * weedingFreq * areaHa * inf;
      annualOpex += pruningCostPerHa * pruningFreq * areaHa * inf;
      if (y % 10 === 0 && y > 0) {
        annualOpex += thinningCostPerHa * areaHa * inf;
      }
      // ФИКСИРОВАННЫЕ затраты на мониторинг и верификацию
      annualOpex += 50000 * inf; // мониторинг, отчетность, администрирование
    }
    opex[y] = -annualOpex;

    // EBITDA
    const ebitda = totalRevenue + opex[y];

    // Прибыль до налога
    const profitBeforeTax = ebitda - (y > 0 ? annualDepreciation : 0);

    // Налог на прибыль
    const tax = profitBeforeTax > 0 ? profitBeforeTax * profitTaxRate : 0;

    // Чистый денежный поток
    const cf = y === 0 ? -totalInvestment : ebitda - tax;
    cashFlows[y] = cf;
    discountedCashFlows[y] = cf / Math.pow(1 + discountRate, y);
  }

  // === 4. Расчет нарастающего итога дисконтированных денежных потоков ===
  let cumulativeDCF = 0;
  for (let y = 0; y <= projectYears; y++) {
    cumulativeDCF += discountedCashFlows[y];
    cumulativeDiscountedCashFlows[y] = cumulativeDCF;
  }

  // === 5. Финансовые метрики ===
  const npv = cumulativeDiscountedCashFlows[projectYears]; // NPV это конечное значение нарастающего итога
  
  // ПРАВИЛЬНЫЙ расчет ROI: (NPV + Инвестиции) / Инвестиции
  const roi = totalInvestment > 0 ? ((npv + totalInvestment) / totalInvestment) * 100 : 0;
  
  const irr = calculateIRR(cashFlows);
  
  // Срок окупаемости (простой)
  let simplePayback = -1;
  let cumulativeCF = 0;
  for (let y = 0; y <= projectYears; y++) {
    cumulativeCF += cashFlows[y];
    if (cumulativeCF >= 0 && simplePayback === -1) {
      simplePayback = y;
    }
  }
  
  // Дисконтированный срок окупаемости
  let discountedPayback = -1;
  for (let y = 0; y <= projectYears; y++) {
    if (cumulativeDiscountedCashFlows[y] >= 0 && discountedPayback === -1) {
      discountedPayback = y;
    }
  }
  
  // Общее количество УЕ за весь период - сумма годовых приростов
  const totalCarbonUnits = annualCarbonIncrement.reduce((sum, increment) => sum + increment, 0);
  const totalCosts = Math.abs(cashFlows[0]) + opex.slice(1).reduce((a, b) => a - b, 0);
  const cuCost = totalCarbonUnits > 0 ? totalCosts / totalCarbonUnits : Infinity;
  
  const profitabilityIndex = totalInvestment > 0 ? (npv + totalInvestment) / totalInvestment : 0;

  return {
    carbonUnits,
    annualCarbonIncrement,
    revenues,
    opex,
    cashFlows,
    discountedCashFlows,
    cumulativeDiscountedCashFlows, // Добавляем нарастающий итог
    timberRevenue,
    financials: {
      npv: Math.round(npv),
      irr: isNaN(irr) ? '—' : (irr * 100).toFixed(2) + '%',
      simplePayback: simplePayback === -1 ? '—' : simplePayback,
      discountedPayback: discountedPayback === -1 ? '—' : discountedPayback,
      cuCost: Math.round(cuCost),
      roi: Math.round(roi) + '%',
      profitabilityIndex: parseFloat(profitabilityIndex.toFixed(3)),
      totalCarbonUnits: Math.round(totalCarbonUnits),
      totalInvestment: Math.round(totalInvestment)
    }
  };
}
