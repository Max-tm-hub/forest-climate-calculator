import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export function exportToExcel(results, inputs) {
  const years = Array.from({ length: inputs.projectYears + 1 }, (_, i) => i);
  const wsData = [
    ['Год', ...years],
    ['Количество УЕ', ...results.carbonUnits],
    ['Выручка от УЕ', ...results.revenues.map((r, i) => i === inputs.projectYears ? '' : r)],
    ['Выручка от древесины', ...results.revenues.map((_, i) => i === inputs.projectYears ? results.timberRevenue : '')],
    ['Операционные расходы', ...results.opex],
    ['Чистый денежный поток', ...results.cashFlows],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Результаты');

  const summary = [
    ['Показатель', 'Значение'],
    ['NPV', `${results.financials.npv.toLocaleString()} ₽`],
    ['IRR', results.financials.irr],
    ['Срок окупаемости (простой)', results.financials.simplePayback],
    ['Срок окупаемости (дисконтированный)', results.financials.discountedPayback],
    ['Себестоимость УЕ', `${results.financials.cuCost} ₽/т`],
    ['ROI', results.financials.roi],
    ['Индекс доходности', results.financials.profitabilityIndex],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(summary);
  XLSX.utils.book_append_sheet(wb, ws2, 'Сводка');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'Расчёт_лесного_проекта.xlsx');
}