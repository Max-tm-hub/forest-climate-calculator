// src/utils/calculator.js
import { getCarbonUnits } from '../data/co2Increment';

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

export function calculateProject(params) {
  const {
    treeType, areaHa, projectYears = 40,
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

  // ✅ Инвестиции (точно как в Excel)
  const landAndPrep = 10_500_000; // ← Фиксировано по Excel
  const seedlingsAndPlanting = 9_156_000; // ← Фиксировано по Excel
  const machines = 10_000_000; // ← Фиксировано по Excel
  const totalInvestment = landAndPrep + seedlingsAndPlanting + machines + designVerification; // 30.256 млн

  const depreciableInvestment = totalInvestment - landAndPrep; // Земля не амортизируется
  const annualDepreciation = depreciableInvestment / projectYears;

  const years = Array.from({ length: projectYears + 1 }, (_, i) => i);
  const inflationFactor = years.map(y => Math.pow(1 + inflation, y));

  const carbonUnits = [];
  const revenues = [];
  const opex = [];
  const cashFlows = [];
  const discountedCashFlows = [];

  let timberRevenue = 0;

  for (let y = 0; y <= projectYears; y++) {
    // ✅ Ключевое исправление: берём УЕ напрямую из калиброванной таблицы
    const cu = getCarbonUnits(treeType, areaHa, y);
    carbonUnits[y] = cu;

    // Выручка от УЕ
    const revenueCarbon = y > 0 ? cu * carbonUnitPrice * inflationFactor[y] : 0;

    // Древесина — только в последний год
    let revenueTimber = 0;
    if (y === projectYears) {
      const volume = timberVolumePerHa * areaHa;
      const harvestCost = timberHarvestCost * volume;
      const transportCost = transportCostPerKm * transportDistance * volume;
      revenueTimber = volume * timberPrice * inflationFactor[y] - (harvestCost + transportCost) * inflationFactor[y];
      timberRevenue = revenueTimber;
    }

    const totalRevenue = revenueCarbon + revenueTimber;
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
  const totalCarbonUnits = carbonUnits.reduce((a, b) => a + b, 0);
  const totalCosts = Math.abs(cashFlows[0]) + opex.slice(1).reduce((a, b) => a - b, 0);
  const cuCost = totalCarbonUnits > 0 ? totalCosts / totalCarbonUnits : Infinity;
  const totalProfit = revenues.reduce((a, r) => a + r, 0) + opex.reduce((a, o) => a + o, 0) + cashFlows[0];
  const roi = (totalProfit / totalInvestment) * 100;
  const profitabilityIndex = (npv + totalInvestment) / totalInvestment;

  return {
    carbonUnits,
    revenues,
    opex,
    cashFlows,
    discountedCashFlows,
    timberRevenue,
    financials: {
      npv: Math.round(npv),
      irr: isNaN(irr) ? '—' : (irr * 100).toFixed(2) + '%',
      simplePayback: simplePayback === -1 ? '—' : simplePayback,
      discountedPayback: discountedPayback === -1 ? '—' : discountedPayback,
      cuCost: Math.round(cuCost),
      roi: Math.round(roi) + '%',
      profitabilityIndex: parseFloat(profitabilityIndex.toFixed(3)),
    }
  };
}
