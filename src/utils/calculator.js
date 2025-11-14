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
    thinningCostPerHa = 120000, thinningFreq = 10,
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
      `Порода "${treeType}" не поддерживается. Доступные породы: ${supportedTypes.join(', ')}`
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
  const incrementProfile = getCO2IncrementData(treeType, requiredYears);

  // Массивы для хранения результатов по годам
  const carbonUnits = Array(requiredYears).fill(0);
  const revenues = Array(requiredYears).fill(0);
  const opex = Array(requiredYears).fill(0);
  const cashFlows = Array(requiredYears).fill(0);
  const discountedCashFlows = Array(requiredYears).fill(0);
  const timberRevenue = Array(requiredYears).fill(0);

  // === 3. Расчёт денежных потоков по годам ===
  for (let y = 0; y < requiredYears; y++) {
    // Расчёт поглощения CO₂
    carbonUnits[y] = incrementProfile[y] * areaHa / 1000;

    // Расчёт доходов
    const carbonRevenue = carbonUnits[y] * carbonUnitPrice;
    timberRevenue[y] = (y === projectYears) ? timberPrice * timberVolumePerHa * areaHa : 0;
    revenues[y] = carbonRevenue + timberRevenue[y];

    // Расчёт операционных расходов
    if (y === 0) {
      opex[y] = -(prepCost + pestsCost + plantingCost + equipmentCost + designVerification);
    } else {
      opex[y] = -(weedingCostPerHa * weedingFreq + pruningCostPerHa * pruningFreq) * areaHa;
      if (y % thinningFreq === 0) {
        opex[y] -= thinningCostPerHa * areaHa;
      }
    }

    // EBITDA
    const ebitda = revenues[y] - Math.abs(opex[y]);

    // Прибыль до налога
    const profitBeforeTax = ebitda - (y > 0 ? annualDepreciation : 0);

    // Налог на прибыль
    const tax = profitBeforeTax > 0 ? profitBeforeTax * profitTaxRate : 0;

    // Чистый денежный поток
    cashFlows[y] = y === 0 ? -totalInvestment : ebitda - tax;
    discountedCashFlows[y] = cashFlows[y] / Math.pow(1 + discountRate, y);
  }

  // === 4. Финансовые метрики ===
  const npv = discountedCashFlows.reduce((a, b) => a + b, 0);
  const irr = calculateIRR(cashFlows);
  const simplePayback = cashFlows.reduce((cum, cf, i, arr) => cum < 0 ? cum + cf : cum, 0) < 0
    ? '—' : cashFlows.findIndex((_, i, arr) => arr.slice(0, i + 1).reduce((s, x) => s + x, 0) >= 0);
  const discountedPayback = discountedCashFlows.findIndex((_, i, arr) => arr.slice(0, i + 1).reduce((s, x) => s + x, 0) >= 0);
  const totalCarbonUnits = carbonUnits.reduce((a, b) => a + b, 0);
  const totalCosts = Math.abs(cashFlows[0]) + opex.slice(1).reduce((a, b) => a + b, 0);
  const cuCost = totalCarbonUnits > 0 ? totalCosts / totalCarbonUnits : Infinity;
  const totalProfit = revenues.reduce((a, r, i) => a + r, 0) +
    opex.reduce((a, o) => a + o, 0) -
    cashFlows[0] -
    cashFlows.slice(1).reduce((a, cf, i) => a + (revenues[i + 1] + opex[i + 1] - cf), 0);
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
