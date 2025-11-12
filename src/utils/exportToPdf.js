// src/utils/exportToPdf.js
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export async function exportGostReport(results, inputs, chartRefs = {}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const textWidth = pageWidth - 2 * margin;

  // === 1. Титульный лист (ГОСТ Р 7.0.97-2016) ===
  doc.setFont('times', 'normal');
  doc.setFontSize(14);

  doc.text('Министерство природных ресурсов и экологии Российской Федерации', margin, 30);
  doc.text('Федеральное государственное бюджетное учреждение', margin, 37);
  doc.text('«Научно-исследовательский институт лесного хозяйства»', margin, 44);
  doc.line(margin, 50, pageWidth - margin, 50);

  doc.setFontSize(16);
  doc.text('ОТЧЁТ', pageWidth / 2, 80, { align: 'center' });
  doc.text('о расчёте эффективности лесного климатического проекта', pageWidth / 2, 88, { align: 'center' });

  doc.setFontSize(14);
  doc.text(`Порода: ${inputs.treeType}`, margin, 110);
  doc.text(`Площадь: ${inputs.areaHa} га`, margin, 118);
  doc.text(`Срок реализации: ${inputs.projectYears} лет`, margin, 126);
  
  const currentDate = new Date().toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  doc.text(`Дата формирования: ${currentDate}`, margin, 140);

  doc.addPage();

  // === 2. Оглавление ===
  doc.setFontSize(14);
  doc.setFont('times', 'bold');
  doc.text('СОДЕРЖАНИЕ', margin, 20);
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  
  let contentY = 40;
  const contentLines = [
    '1   Введение ............................................................................ 3',
    '2   Методология расчёта .......................................................... 3',
    '3   Результаты расчёта ............................................................ 4',
    '4   Финансовые показатели ........................................................ 4',
    '5   Графическая визуализация .................................................... 5',
    '6   Выводы и рекомендации ...................................................... 6'
  ];
  
  contentLines.forEach(line => {
    doc.text(line, margin, contentY);
    contentY += 8;
  });

  doc.addPage();

  // === 3. Введение ===
  doc.setFontSize(14);
  doc.setFont('times', 'bold');
  doc.text('1   ВВЕДЕНИЕ', margin, 20);
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  
  const intro = `В рамках реализации Стратегии развития углеродного рынка в РФ и поддержки 
лесных климатических проектов (ЛКП) выполнена оценка экономической эффективности 
проекта поглощения парниковых газов лесными насаждениями. 

Проект направлен на создание устойчивой экосистемы, способной к долгосрочному 
поглощению углекислого газа, с одновременным получением экономического эффекта 
от реализации углеродных единиц и лесной продукции.`;
  
  doc.text(intro, margin, 30, { maxWidth: textWidth });

  // === 4. Методология ===
  doc.text('2   МЕТОДОЛОГИЯ РАСЧЁТА', margin, 80);
  const method = `Расчёт основан на методике, изложенной в Рекомендациях по разработке и 
реализации лесных климатических проектов (Минприроды России, 2023). 

Учитываются следующие факторы:
• Поглощение CO₂ по данным таблицы «Накопленный CO₂» (с учётом прироста)
• Выручка от продажи углеродных единиц и древесины
• Инвестиционные и операционные затраты
• Налог на прибыль организаций (25%)
• Инфляция и ставка дисконтирования

Дисконтирование денежных потоков выполняется по ставке ${(inputs.discountRate * 100).toFixed(1)}%.`;
  
  doc.text(method, margin, 90, { maxWidth: textWidth });

  doc.addPage();

  // === 5. Результаты расчёта ===
  doc.setFontSize(14);
  doc.setFont('times', 'bold');
  doc.text('3   РЕЗУЛЬТАТЫ РАСЧЁТА', margin, 20);
  doc.setFont('times', 'normal');
  doc.setFontSize(12);

  const paramsData = [
    ['Параметр проекта', 'Значение'],
    ['Порода деревьев', inputs.treeType],
    ['Площадь проекта', `${inputs.areaHa} га`],
    ['Срок реализации', `${inputs.projectYears} лет`],
    ['Ставка дисконтирования', `${(inputs.discountRate * 100).toFixed(1)}%`],
    ['Уровень инфляции', `${(inputs.inflation * 100).toFixed(1)}%`],
    ['Цена углеродной единицы', `${inputs.carbonUnitPrice.toLocaleString('ru-RU')} руб/т`],
    ['Цена древесины', `${inputs.timberPrice.toLocaleString('ru-RU')} руб/м³`]
  ];

  doc.autoTable({
    startY: 30,
    head: [paramsData[0]],
    body: paramsData.slice(1),
    theme: 'grid',
    headStyles: { 
      font: 'times', 
      fontStyle: 'bold', 
      fillColor: [240, 240, 240], 
      textColor: [0, 0, 0],
      halign: 'left'
    },
    bodyStyles: { 
      font: 'times', 
      fontSize: 11,
      halign: 'left'
    },
    styles: {
      fontSize: 11,
      cellPadding: 4,
      lineColor: [0, 0, 0],
      lineWidth: 0.1
    },
    margin: { left: margin, right: margin }
  });

  // === 6. Финансовые показатели ===
  doc.text('4   ФИНАНСОВЫЕ ПОКАЗАТЕЛИ', margin, doc.lastAutoTable.finalY + 20);

  const financialData = [
    ['Показатель', 'Значение'],
    ['NPV (чистая приведенная стоимость)', `${results.financials.npv.toLocaleString('ru-RU')} руб`],
    ['IRR (внутренняя норма доходности)', results.financials.irr],
    ['Срок окупаемости (простой)', `${results.financials.simplePayback} лет`],
    ['Срок окупаемости (дисконтированный)', `${results.financials.discountedPayback} лет`],
    ['Себестоимость УЕ', `${results.financials.cuCost.toLocaleString('ru-RU')} руб/т`],
    ['ROI (рентабельность инвестиций)', results.financials.roi],
    ['Индекс доходности', results.financials.profitabilityIndex.toString()],
    ['Суммарные инвестиции', `${results.financials.totalInvestment?.toLocaleString('ru-RU') || '0'} руб`],
    ['Общий объём поглощения CO₂', `${results.financials.totalCarbon?.toLocaleString('ru-RU') || '0'} т`]
  ];

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 30,
    head: [financialData[0]],
    body: financialData.slice(1),
    theme: 'grid',
    headStyles: { 
      font: 'times', 
      fontStyle: 'bold', 
      fillColor: [240, 240, 240], 
      textColor: [0, 0, 0],
      halign: 'left'
    },
    bodyStyles: { 
      font: 'times', 
      fontSize: 11,
      halign: 'left'
    },
    styles: {
      fontSize: 11,
      cellPadding: 4,
      lineColor: [0, 0, 0],
      lineWidth: 0.1
    },
    margin: { left: margin, right: margin }
  });

  // === 7. Графики ===
  let currentY = doc.lastAutoTable.finalY + 20;
  
  // График денежных потоков
  if (chartRefs.cashFlowChart && chartRefs.cashFlowChart.canvas) {
    try {
      if (currentY > 200) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.text('5   ГРАФИЧЕСКАЯ ВИЗУАЛИЗАЦИЯ', margin, currentY);
      currentY += 15;
      
      doc.setFontSize(12);
      doc.setFont('times', 'bold');
      doc.text('Динамика денежных потоков', margin, currentY);
      doc.setFont('times', 'normal');
      currentY += 8;
      
      const canvas = chartRefs.cashFlowChart.canvas;
      const imgData = canvas.toDataURL('image/png');
      const imgProps = doc.getImageProperties(imgData);
      
      const pdfWidth = textWidth;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // Ограничиваем высоту графика
      const maxChartHeight = 80;
      const finalHeight = Math.min(pdfHeight, maxChartHeight);
      const finalWidth = (pdfWidth * finalHeight) / pdfHeight;
      
      doc.addImage(imgData, 'PNG', margin + (textWidth - finalWidth) / 2, currentY, finalWidth, finalHeight);
      currentY += finalHeight + 15;
      
    } catch (error) {
      console.error('Ошибка при добавлении графика денежных потоков:', error);
      doc.text('График денежных потоков недоступен', margin, currentY);
      currentY += 20;
    }
  }

  // График углеродных единиц
  if (chartRefs.carbonChart && chartRefs.carbonChart.canvas) {
    try {
      if (currentY > 150) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont('times', 'bold');
      doc.text('Динамика накопленных углеродных единиц', margin, currentY);
      doc.setFont('times', 'normal');
      currentY += 8;
      
      const canvas = chartRefs.carbonChart.canvas;
      const imgData = canvas.toDataURL('image/png');
      const imgProps = doc.getImageProperties(imgData);
      
      const pdfWidth = textWidth;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // Ограничиваем высоту графика
      const maxChartHeight = 80;
      const finalHeight = Math.min(pdfHeight, maxChartHeight);
      const finalWidth = (pdfWidth * finalHeight) / pdfHeight;
      
      doc.addImage(imgData, 'PNG', margin + (textWidth - finalWidth) / 2, currentY, finalWidth, finalHeight);
      currentY += finalHeight + 20;
      
    } catch (error) {
      console.error('Ошибка при добавлении графика углеродных единиц:', error);
      doc.text('График углеродных единиц недоступен', margin, currentY);
      currentY += 20;
    }
  }

  // === 8. Выводы и рекомендации ===
  if (currentY > 120) {
    doc.addPage();
    currentY = 20;
  }
  
  doc.setFontSize(14);
  doc.setFont('times', 'bold');
  doc.text('6   ВЫВОДЫ И РЕКОМЕНДАЦИИ', margin, currentY);
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  currentY += 15;

  const conclusion = generateConclusion(results, inputs);
  doc.text(conclusion, margin, currentY, { maxWidth: textWidth });

  // === Сохранение ===
  const fileName = `Отчёт_ЛКП_${inputs.treeType}_${inputs.areaHa}га_${currentDate.replace(/\./g, '-')}.pdf`;
  doc.save(fileName);
}

// Функция для генерации выводов на основе результатов
function generateConclusion(results, inputs) {
  const npv = results.financials.npv;
  const irr = parseFloat(results.financials.irr) || 0;
  const cuCost = results.financials.cuCost;
  
  let conclusion = '';
  
  if (npv > 0) {
    conclusion += `Проект демонстрирует положительную экономическую эффективность с NPV ${npv.toLocaleString('ru-RU')} руб. `;
    conclusion += `Внутренняя норма доходности составляет ${results.financials.irr}. `;
  } else {
    conclusion += `Проект имеет отрицательный NPV (${npv.toLocaleString('ru-RU')} руб), что свидетельствует `;
    conclusion += `о его экономической нецелесообразности в текущих условиях. `;
  }
  
  conclusion += `Себестоимость углеродной единицы составляет ${cuCost.toLocaleString('ru-RU')} руб/т. `;
  
  if (cuCost < inputs.carbonUnitPrice) {
    conclusion += `При текущей цене УЕ ${inputs.carbonUnitPrice.toLocaleString('ru-RU')} руб/т проект рентабелен. `;
  } else {
    conclusion += `Требуется повышение цены УЕ или снижение затрат для достижения рентабельности. `;
  }
  
  conclusion += `\n\nРекомендации:\n`;
  conclusion += `• Мониторинг рыночных цен на углеродные единицы\n`;
  conclusion += `• Оптимизация операционных затрат\n`;
  conclusion += `• Рассмотреть возможность получения государственной поддержки\n`;
  conclusion += `• Диверсификация источников дохода (сертификаты устойчивости)\n`;
  conclusion += `• Страхование климатических рисков`;
  
  return conclusion;
}
