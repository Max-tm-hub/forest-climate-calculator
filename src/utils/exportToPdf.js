import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export function exportToPdf(results, inputs) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Калькулятор лесных климатических проектов', 14, 20);
  doc.setFontSize(10);
  doc.text(`Порода: ${inputs.treeType} • Площадь: ${inputs.areaHa} га • Срок: ${inputs.projectYears} лет`, 14, 26);

  const summary = [
    ['Показатель', 'Значение'],
    ['NPV', `${results.financials.npv.toLocaleString()} ₽`],
    ['IRR', results.financials.irr],
    ['Простой срок окупаемости', `${results.financials.simplePayback} лет`],
    ['Дисконтированный срок окупаемости', `${results.financials.discountedPayback} лет`],
    ['Себестоимость УЕ', `${results.financials.cuCost} ₽/т`],
    ['ROI', results.financials.roi],
    ['Индекс доходности', String(results.financials.profitabilityIndex)],
  ];

  doc.autoTable({
    startY: 35,
    head: [summary[0]],
    body: summary.slice(1),
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [30, 100, 180] }
  });

  doc.save('Расчёт_лесного_проекта.pdf');
}