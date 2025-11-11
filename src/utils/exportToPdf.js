// src/utils/exportToPdf.js
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportGostReport(resultsByScenario, inputs) {
  const doc = new jsPDF({ fontSize: 12 });
  const w = doc.internal.pageSize.width;
  const m = 20;

  // === Титульный лист (ГОСТ Р 7.0.97-2016) ===
  doc.setFont('times', 'normal');
  doc.text('Министерство природных ресурсов и экологии Российской Федерации', m, 30);
  doc.text('Федеральное государственное бюджетное учреждение', m, 37);
  doc.text('«Научно-исследовательский институт лесного хозяйства»', m, 44);
  doc.line(m, 50, w - m, 50);
  doc.setFontSize(16);
  doc.text('ОТЧЁТ', w / 2, 80, { align: 'center' });
  doc.text('о расчёте эффективности лесного климатического проекта', w / 2, 88, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Порода: ${inputs.treeType}`, m, 110);
  doc.text(`Площадь: ${inputs.areaHa} га`, m, 118);
  doc.text(`Срок реализации: ${inputs.projectYears} лет`, m, 126);
  doc.text(`Дата формирования: ${new Date().toLocaleDateString('ru-RU')}`, m, 140);

  // === Сравнение сценариев ===
  doc.addPage();
  doc.text('Таблица 1 — Сравнение финансовых показателей', m, 20);
  const tableData = [
    ['Показатель', 'Пессимистичный', 'Базовый', 'Оптимистичный'],
    ['NPV, ₽', format(resultsByScenario.pessimistic.npv), format(resultsByScenario.base.npv), format(resultsByScenario.optimistic.npv)],
    ['IRR, %', resultsByScenario.pessimistic.irr, resultsByScenario.base.irr, resultsByScenario.optimistic.irr],
    ['Срок окупаемости (простой), лет', resultsByScenario.pessimistic.simplePayback, resultsByScenario.base.simplePayback, resultsByScenario.optimistic.simplePayback],
    ['Себестоимость УЕ, ₽/т', resultsByScenario.pessimistic.cuCost, resultsByScenario.base.cuCost, resultsByScenario.optimistic.cuCost]
  ];

  autoTable(doc, {
    startY: 30,
    head: [tableData[0]],
    body: tableData.slice(1),
    theme: 'grid',
    headStyles: { font: 'times', fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0] },
    bodyStyles: { font: 'times', fontSize: 12 }
  });

  doc.save(`Отчёт_ЛКП_${inputs.treeType}_${inputs.areaHa}га.pdf`);
}

function format(num) {
  return num ? Number(num).toLocaleString('ru') : '—';
}
