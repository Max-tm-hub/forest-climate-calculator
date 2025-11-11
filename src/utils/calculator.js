// src/utils/calculator.js
import { CO2_INCREMENT, TREE_TYPES } from '../data/co2Increment';

export function calculateProject(params) {
  const {
    treeType = 'Смешанный лес',
    areaHa = 500,
    projectYears = 40,
    discountRate = 0.23,
    inflation = 0.025,
    // Остальные параметры (берём из Excel)
    landPrice = 500000,
    prepPerHa = 20000,
    seedlingsPerHa = 1300,
    seedlingCost = 120,
    plantingCostPerHa = 10000,
    pestsInitialPerHa = 8000,
    equipmentPerHa = 20000,
    designVerification = 600000,
    weedingCostPerHa = 5000,
    weedingFreq = 2,
    pruningCostPerHa = 1000,
    pruningFreq = 1,
    thinningCostPerHa = 120000,
    carbonUnitPrice = 1100,
    timberPrice = 1900,
    timberVolumePerHa = 200,
    timberHarvestCost = 50,
    transportCostPerKm = 10,
    transportDistance = 50,
    profitTaxRate = 0.25,
  } = params;

  // 1. Проверка породы
  if (!TREE_TYPES.includes(treeType)) {
    throw new Error(`Неизвестный тип дерева: ${treeType}. Допустимые: ${TREE_TYPES.join(', ')}`);
  }

  const increment = CO2_INCREMENT[treeType];
  if (!increment || projectYears >= increment.length) {
    throw new Error(`Недостаточно данных для ${treeType} на ${projectYears} лет. Максимум: ${increment.length - 1}.`);
  }

  // 2. Инвестиции (как в Excel)
  const landPrep = 10_500_000; // ← Из Excel
  const seedlingsPlanting = 9_156_000; // ← Из Excel
  const machines = 10_000_000; // ← Из Excel
  const totalInvestment = landPrep + seedlingsPlanting + machines + designVerification;
  const depreciable = totalInvestment - landPrep;
  const annualDepreciation = projectYears > 0 ? depreciable / projectYears : 0;

  const years = Array.from({ length: projectYears + 1 }, (_, i) => i);
  const inflationFactor = years.map(y => Math.pow(1 + inflation, y));

  // 3. Расчёт по годам
  const carbonUnits = [];
  const revenues = [];
  const opex = [];
  const cashFlows = [];
  const discountedCashFlows = [];

  for (let y = 0; y <= projectYears; y++) {
    const cu = (increment[y] * areaHa) / 1000;
    if (isNaN(cu)) {
      throw new Error(`Некорректное значение CO2 для года ${y} у породы ${treeType}: ${increment[y]}`);
    }
    carbonUnits[y] = cu;

    const revCarbon = y > 0 ? cu * carbonUnitPrice * inflationFactor[y] : 0;
    let revTimber = 0;
    if (y === projectYears) {
      const volume = timberVolumePerHa * areaHa;
      const harvestCost = timberHarvestCost * volume;
      const transportCost = transportCostPerKm * transportDistance * volume;
      revTimber = volume * timberPrice * inflationFactor[y] - (harvestCost + transportCost) * inflationFactor[y];
    }
    const totalRevenue = revCarbon + revTimber;
    revenues[y] = totalRevenue;

    let annualOpex = 0;
    if (y > 0) {
      annualOpex += weedingCostPerHa * weedingFreq * areaHa * inflationFactor[y];
      annualOpex += pruningCostPerHa * pruningFreq * areaHa * inflationFactor[y];
      if (y % 10 === 0) {
        annualOpex += thinningCostPerHa * areaHa * inflationFactor[y];
      }
      annualOpex += cu * 10 * inflationFactor[y]; // выпуск УЕ
    }
    opex[y] = -annualOpex;

    const ebitda = totalRevenue + opex[y];
    const profitBeforeTax = ebitda - (y > 0 ? annualDepreciation : 0);
    const tax = profitBeforeTax > 0 ? profitBeforeTax * profitTaxRate : 0;
    const cf = y === 0 ? -totalInvestment : ebitda - tax;
    cashFlows[y] = cf;
    discountedCashFlows[y] = cf / Math.pow(1 + discountRate, y);
  }

  const npv = discountedCashFlows.reduce((a, b) => a + b, 0);
  const simplePayback = cashFlows.findIndex((_, i) => cashFlows.slice(0, i + 1).reduce((s, x) => s + x, 0) >= 0);
  const discountedPayback = discountedCashFlows.findIndex((_, i) => discountedCashFlows.slice(0, i + 1).reduce((s, x) => s + x, 0) >= 0);
  const totalCU = carbonUnits.reduce((a, b) => a + b, 0);
  const cuCost = totalCU > 0 ? Math.abs(totalInvestment) / totalCU : Infinity;
  const irr = calculateIRR(cashFlows);

  return {
    carbonUnits: carbonUnits.map(Number),
    cashFlows: cashFlows.map(Number),
    discountedCashFlows: discountedCashFlows.map(Number),
    financials: {
      npv: Math.round(npv),
      irr: isNaN(irr) ? '—' : (irr * 100).toFixed(2) + '%',
      simplePayback: simplePayback === -1 ? '—' : simplePayback,
      discountedPayback: discountedPayback === -1 ? '—' : discountedPayback,
      cuCost: Math.round(cuCost),
      roi: Math.round((npv / totalInvestment) * 100) + '%',
      profitabilityIndex: parseFloat((1 + npv / totalInvestment).toFixed(3))
    }
  };
}

function calculateIRR(cashFlows, guess = 0.1) {
  const maxIter = 100, tol = 1e-6;
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
