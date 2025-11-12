import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Функция для создания данных графика в Excel
function createChartData(results, inputs) {
  const step = Math.max(1, Math.floor(inputs.projectYears / 20));
  const years = Array.from({ length: inputs.projectYears + 1 }, (_, i) => i);
  const filteredYears = years.filter((_, i) => i % step === 0 || i === 0 || i === inputs.projectYears);
  
  return {
    years: filteredYears,
    carbonData: filteredYears.map(i => results.carbonUnits[i]),
    cashFlows: filteredYears.map(i => results.cashFlows[i] / 1000),
    discountedFlows: filteredYears.map(i => results.discountedCashFlows[i] / 1000)
  };
}

export function exportToExcel(results, inputs) {
  const years = Array.from({ length: inputs.projectYears + 1 }, (_, i) => i);
  const chartData = createChartData(results, inputs);
  
  // Основная таблица с данными
  const wsData = [
    ['ГОДОВЫЕ ПОКАЗАТЕЛИ ПРОЕКТА'],
    [''],
    ['Год', 'УЕ (т CO₂)', 'Выручка от УЕ (₽)', 'Выручка от древесины (₽)', 'Операционные расходы (₽)', 'Чистый денежный поток (₽)', 'Дисконтированный ДП (₽)'],
    ...years.map(y => [
      y,
      results.carbonUnits[y],
      y === inputs.projectYears ? '' : results.revenues[y],
      y === inputs.projectYears ? results.timberRevenue : '',
      results.opex[y],
      results.cashFlows[y],
      results.discountedCashFlows[y]
    ])
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Сводная таблица с финансовыми показателями
  const summary = [
    ['ФИНАНСОВЫЕ ПОКАЗАТЕЛИ ПРОЕКТА'],
    [''],
    ['Показатель', 'Значение', 'Единица измерения'],
    ['NPV', results.financials.npv, 'руб.'],
    ['IRR', typeof results.financials.irr === 'string' ? results.financials.irr.replace('%', '') : results.financials.irr, '%'],
    ['Срок окупаемости (простой)', results.financials.simplePayback, 'лет'],
    ['Срок окупаемости (дисконтированный)', results.financials.discountedPayback, 'лет'],
    ['Себестоимость УЕ', results.financials.cuCost, 'руб./т'],
    ['ROI', typeof results.financials.roi === 'string' ? results.financials.roi.replace('%', '') : results.financials.roi, '%'],
    ['Индекс доходности', results.financials.profitabilityIndex, ''],
    [''],
    ['ПАРАМЕТРЫ РАСЧЕТА'],
    ['Порода деревьев', inputs.treeType],
    ['Площадь проекта', inputs.areaHa, 'га'],
    ['Срок проекта', inputs.projectYears, 'лет'],
    ['Ставка дисконтирования', (inputs.discountRate * 100).toFixed(1), '%']
  ];

  // Данные для графиков (упрощенные)
  const chartWsData = [
    ['ДАННЫЕ ДЛЯ ГРАФИКОВ'],
    [''],
    ['Год', 'УЕ (т CO₂)', 'Чистый ДП (тыс. ₽)', 'Дисконтированный ДП (тыс. ₽)'],
    ...chartData.years.map((year, index) => [
      year,
      chartData.carbonData[index],
      chartData.cashFlows[index],
      chartData.discountedFlows[index]
    ])
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(summary);
  const ws3 = XLSX.utils.aoa_to_sheet(chartWsData);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Детальные данные');
  XLSX.utils.book_append_sheet(wb, ws2, 'Сводка и параметры');
  XLSX.utils.book_append_sheet(wb, ws3, 'Данные графиков');

  // Настройка стилей колонок
  const wscols = [
    { wch: 8 }, { wch: 15 }, { wch: 20 }, { wch: 22 }, { wch: 20 }, { wch: 20 }, { wch: 22 }
  ];
  ws['!cols'] = wscols;

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  
  const fileName = `Лесной_климатический_проект_${inputs.treeType}_${inputs.areaHa}га_${new Date().toISOString().split('T')[0]}.xlsx`;
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), fileName);
}
