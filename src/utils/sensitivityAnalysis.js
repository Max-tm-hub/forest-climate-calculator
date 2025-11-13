// Анализ чувствительности
import { calculateProject } from './calculator';

export const SENSITIVITY_PARAMETERS = {
  carbonUnitPrice: { min: 500, max: 2000, step: 100, label: 'Цена УЕ (руб/т)' },
  discountRate: { min: 0.1, max: 0.4, step: 0.05, label: 'Ставка дисконтирования (%)' },
  areaHa: { min: 100, max: 5000, step: 100, label: 'Площадь (га)' },
  timberPrice: { min: 1000, max: 5000, step: 200, label: 'Цена древесины (руб/м³)' },
  projectYears: { min: 20, max: 100, step: 10, label: 'Срок проекта (лет)' }
};

export const calculateSensitivityAnalysis = (baseInputs, parameter, range = { min: -20, max: 20, step: 5 }) => {
  const results = [];
  
  for (let percent = range.min; percent <= range.max; percent += range.step) {
    const modifiedInputs = { ...baseInputs };
    const multiplier = 1 + (percent / 100);
    
    // Применяем изменение к выбранному параметру
    if (parameter === 'discountRate') {
      modifiedInputs[parameter] = baseInputs[parameter] * multiplier;
    } else {
      modifiedInputs[parameter] = Math.round(baseInputs[parameter] * multiplier);
    }
    
    try {
      const result = calculateProject(modifiedInputs);
      results.push({
        percentChange: percent,
        value: modifiedInputs[parameter],
        npv: result.financials.npv,
        irr: result.financials.irr,
        payback: result.financials.discountedPayback
      });
    } catch (error) {
      console.error(`Error calculating sensitivity for ${parameter} at ${percent}%:`, error);
    }
  }
  
  return results;
};

export const calculateMultiParameterSensitivity = (baseInputs, parameters) => {
  const scenarios = [];
  
  // Генерируем комбинации параметров
  parameters.forEach(param => {
    const analysis = calculateSensitivityAnalysis(baseInputs, param);
    scenarios.push({
      parameter: param,
      analysis,
      baseValue: baseInputs[param]
    });
  });
  
  return scenarios;
};

// Анализ точки безубыточности
export const calculateBreakEvenAnalysis = (baseInputs, targetNpv = 0) => {
  const carbonPriceAnalysis = calculateSensitivityAnalysis(
    baseInputs, 
    'carbonUnitPrice', 
    { min: -50, max: 100, step: 5 }
  );
  
  const breakEvenPoint = carbonPriceAnalysis.find(point => point.npv >= targetNpv);
  
  return {
    breakEvenPoint,
    fullAnalysis: carbonPriceAnalysis,
    currentNpv: calculateProject(baseInputs).financials.npv
  };
};