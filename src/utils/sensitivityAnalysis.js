// Анализ чувствительности
import { calculateProject } from './calculator';

export const SENSITIVITY_PARAMETERS = {
  carbonUnitPrice: { 
    min: 500, 
    max: 2000, 
    step: 100, 
    label: 'Цена УЕ (руб/т)',
    type: 'absolute' // абсолютное изменение
  },
  discountRate: { 
    min: 5, 
    max: 25, 
    step: 2, 
    label: 'Ставка дисконтирования (%)',
    type: 'absolute' // абсолютное изменение в процентах
  },
  areaHa: { 
    min: 100, 
    max: 5000, 
    step: 100, 
    label: 'Площадь (га)',
    type: 'absolute'
  },
  timberPrice: { 
    min: 1000, 
    max: 5000, 
    step: 200, 
    label: 'Цена древесины (руб/м³)',
    type: 'absolute'
  },
  projectYears: { 
    min: 20, 
    max: 100, 
    step: 10, 
    label: 'Срок проекта (лет)',
    type: 'absolute'
  }
};

export const calculateSensitivityAnalysis = (baseInputs, parameter, range = { min: -20, max: 20, step: 5 }) => {
  const results = [];
  
  for (let percent = range.min; percent <= range.max; percent += range.step) {
    const modifiedInputs = { ...baseInputs };
    const multiplier = 1 + (percent / 100);
    
    // Корректное применение изменения к выбранному параметру
    if (parameter === 'discountRate') {
      // Для ставки дисконтирования используем абсолютное изменение, а не относительное
      const baseValue = baseInputs[parameter] || 10;
      const change = (range.max - range.min) * (percent / 100);
      modifiedInputs[parameter] = Math.max(1, Math.min(50, baseValue + change));
    } else if (parameter === 'projectYears') {
      // Для срока проекта - абсолютное изменение с округлением
      const baseValue = baseInputs[parameter] || 80;
      const change = Math.round((range.max - range.min) * (percent / 100));
      modifiedInputs[parameter] = Math.max(10, Math.min(100, baseValue + change));
    } else {
      // Для остальных параметров - относительное изменение
      const baseValue = baseInputs[parameter] || 0;
      if (typeof baseValue === 'number') {
        modifiedInputs[parameter] = Math.round(baseValue * multiplier);
      }
    }
    
    try {
      const result = calculateProject(modifiedInputs);
      results.push({
        percentChange: percent,
        value: modifiedInputs[parameter],
        npv: result.financials.npv,
        irr: result.financials.irr,
        payback: result.financials.discountedPayback,
        parameterValue: modifiedInputs[parameter]
      });
    } catch (error) {
      console.error(`Error calculating sensitivity for ${parameter} at ${percent}%:`, error);
      // Продолжаем выполнение, пропуская ошибочные точки
      continue;
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
      baseValue: baseInputs[param],
      label: SENSITIVITY_PARAMETERS[param]?.label || param
    });
  });
  
  return scenarios;
};

// Улучшенный анализ точки безубыточности
export const calculateBreakEvenAnalysis = (baseInputs, targetNpv = 0) => {
  const carbonPriceAnalysis = calculateSensitivityAnalysis(
    baseInputs, 
    'carbonUnitPrice', 
    { min: -80, max: 200, step: 10 } // Более широкий диапазон для поиска точки безубыточности
  );
  
  // Находим точку, где NPV становится неотрицательной
  let breakEvenPoint = null;
  for (let i = 1; i < carbonPriceAnalysis.length; i++) {
    const current = carbonPriceAnalysis[i];
    const previous = carbonPriceAnalysis[i - 1];
    
    if (current.npv >= targetNpv && previous.npv < targetNpv) {
      // Интерполяция для более точного определения точки безубыточности
      const weight = (targetNpv - previous.npv) / (current.npv - previous.npv);
      breakEvenPoint = {
        percentChange: previous.percentChange + weight * (current.percentChange - previous.percentChange),
        value: previous.value + weight * (current.value - previous.value),
        npv: targetNpv
      };
      break;
    }
  }
  
  // Если не нашли точку пересечения, используем первую точку с положительным NPV
  if (!breakEvenPoint) {
    breakEvenPoint = carbonPriceAnalysis.find(point => point.npv >= targetNpv) || null;
  }
  
  return {
    breakEvenPoint,
    fullAnalysis: carbonPriceAnalysis,
    currentNpv: calculateProject(baseInputs).financials.npv,
    currentCarbonPrice: baseInputs.carbonUnitPrice
  };
};

// Новый метод для анализа эластичности
export const calculateParameterElasticity = (baseInputs, parameter) => {
  const analysis = calculateSensitivityAnalysis(baseInputs, parameter, { min: -10, max: 10, step: 5 });
  
  if (analysis.length < 2) return 0;
  
  const baseNpv = calculateProject(baseInputs).financials.npv;
  const baseValue = baseInputs[parameter];
  
  // Рассчитываем эластичность как процентное изменение NPV к процентному изменению параметра
  const positiveChange = analysis.find(a => a.percentChange === 10);
  const negativeChange = analysis.find(a => a.percentChange === -10);
  
  if (!positiveChange || !negativeChange) return 0;
  
  const npvChangePercent = ((positiveChange.npv - negativeChange.npv) / Math.abs(baseNpv)) * 100;
  const paramChangePercent = 20; // от -10% до +10% = 20% изменение
  
  return (npvChangePercent / paramChangePercent).toFixed(2);
};
