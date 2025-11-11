// src/utils/calculator.js
import { CARBON_INCREMENT } from '../data/co2Increment';

export function calculateProject(params) {
  const {
    treeType, areaHa = 500, projectYears = 40,
    discountRate = 0.23, inflation = 0.025,
    landPrice = 500000,
    prepPerHa = 20000,
    seedlingsPerHa = 1300, seedlingCost = 120,
    plantingCostPerHa = 10000,
    pestsInitialPerHa = 8000,
    equipmentPerHa = 20000,
    designVerification = 600000,
    weedingCostPerHa = 5000, weedingFreq = 2,
    pruningCostPerHa = 1000, pruningFreq = 1,
    thinningCostPerHa = 120000,
    carbonUnitPrice = 1100,
    timberPrice = 1900,
    timberVolumePerHa = 200,
    timberHarvestCost = 50,
    transportCostPerKm = 10, transportDistance = 50,
    profitTaxRate = 0.25
  } = params;

  // ✅ Инвестиции как в Excel: 30.256 млн ₽
  const landPrep = 10_500_000;
  const seedlingsPlanting = 9_156_000;
  const machines = 10_000_000;
  const totalInvestment = landPrep + seedlingsPlanting + machines + designVerification;
  const depreciable = totalInvestment - landPrep;
  const annualDepreciation = depreciable / projectYears;

  const years = Array.from({ length: projectYears + 1 }, (_, i) => i);
  const inflationFactor = years.map(y => Math.pow(1 + inflation, y));
  const increment = CARBON_INCREMENT[treeType];

  if (!increment || increment.length < projectYears + 1) {
    throw new Error(`Недостаточно данных для ${treeType} на ${projectYears} лет`);
  }

  const carbonUnits = [];
  const revenues = [];
  const opex = [];
  const cashFlows = [];
  const discountedCashFlows = [];

  for (let y = 0; y <= projectYears; y++) {
    // ✅ Ключ: углеродные единицы = прирост × площадь / 1000
    const cu = (increment[y] * areaHa) / 1000;
    carbonUnits[y] = cu;

    // Выручка от УЕ
    const revCarbon = y > 0 ? cu * carbonUnitPrice * inflationFactor[y] : 0;

    // Древесина — только в последний год
    let revTimber = 0;
    if (y === projectYears) {
      const vol = timberVolumePerHa * areaHa;
      const harvestCost = timberHarvestCost * vol;
      const transportCost = transportCostPerKm * transportDistance * vol;
      revTimber = vol * timberPrice * inflationFactor[y] - (harvestCost + transportCost) * inflationFactor[y];
    }
    const totalRevenue = revCarbon + revTimber;
    revenues[y] = totalRevenue;

    // Операционные расходы
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

    // EBITDA
    const ebitda = totalRevenue + opex[y];

    // Прибыль до налога
    const profitBeforeTax = ebitda - (y > 0 ? annualDepreciation : 0);

    // Налог
    const tax = profitBeforeTax > 0 ? profitBeforeTax * profitTaxRate : 0;

    // Чистый денежный поток
    const cf = y === 0 ? -totalInvestment : ebitda - tax;
    cashFlows[y] = cf;
    discountedCashFlows[y] = cf / Math.pow(1 + discountRate, y);
  }

  // Финансовые метрики
  const npv = discountedCashFlows.reduce((a, b) => a + b, 0);
  const irr = calculateIRR(cashFlows);
  const simplePayback = cashFlows.findIndex((_, i) => 
    cashFlows.slice(0, i + 1).reduce((s, x) => s + x, 0) >= 0
  );
  const discountedPayback = discountedCashFlows.findIndex((_, i) =>
    discountedCashFlows.slice(0, i + 1).reduce((s, x) => s + x, 0) >= 0
  );
  const totalCU = carbonUnits.reduce((a, b) => a + b, 0);
  const cuCost = totalCU > 0 ? Math.abs(cashFlows[0]) / totalCU : Infinity;
  const roi = (npv / totalInvestment) * 100;

  return {
    carbonUnits, revenues, opex, cashFlows, discountedCashFlows,
    financials: {
      npv: Math.round(npv),
      irr: isNaN(irr) ? '—' : (irr * 100).toFixed(2) + '%',
      simplePayback: simplePayback === -1 ? '—' : simplePayback,
      discountedPayback: discountedPayback === -1 ? '—' : discountedPayback,
      cuCost: Math.round(cuCost),
      roi: Math.round(roi) + '%',
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
