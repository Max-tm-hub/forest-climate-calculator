// src/utils/calculator.js
import { CO2_INCREMENT, TREE_TYPES } from '../data/co2Increment';

export function calculateProject(params) {
  const {
    treeType = 'Смешанный лес',
    areaHa = 500,
    projectYears = 40,
    discountRate = 0.23,
    inflation = 0.025,
    // ... остальные параметры
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
  const landPrep = 10_500_000;
  const seedlingsPlanting = 9_156_000;
  const machines = 10_000_000;
  const designVerification = 600_000;
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

    const revCarbon = y > 0 ? cu * 1100 * inflationFactor[y] : 0; // carbonUnitPrice = 1100
    let revTimber = 0;
    if (y === projectYears) {
      const volume = 200 * areaHa; // timberVolumePerHa = 200
      const harvestCost = 50 * volume;
      const transportCost = 10 * 50 * volume; // 10 ₽/м³/км * 50 км
      revTimber = volume * 1900 * inflationFactor[y] - (harvestCost + transportCost) * inflationFactor[y];
    }
    const totalRevenue = revCarbon + revTimber;
    revenues[y] = totalRevenue;

    let annualOpex = 0;
    if (y > 0) {
      annualOpex += 5000 * 2 * areaHa * inflationFactor[y]; // weeding
      annualOpex += 1000 * 1 * areaHa * inflationFactor[y]; // pruning
      if (y % 10 === 0) {
        annualOpex += 120000 * areaHa * inflationFactor[y]; // thinning
      }
      annualOpex += cu * 10 * inflationFactor[y]; // выпуск УЕ
    }
    opex[y] = -annualOpex;

    const ebitda = totalRevenue + opex[y];
    const profitBeforeTax = ebitda - (y > 0 ? annualDepreciation : 0);
    const tax = profitBeforeTax > 0 ? profitBeforeTax * 0.25 : 0; // profitTaxRate = 25%
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
