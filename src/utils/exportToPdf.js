// src/utils/exportToPdf.js
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Функция для безопасного текста
function safeText(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/[”“]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—]/g, '-')
    .replace(/[«»]/g, '"');
}

// Функция для форматирования чисел
function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  const rounded = Math.round(num);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Функция для получения даты
function getCurrentDate() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${day}.${month}.${year}`;
}

export async function exportGostReport(results, inputs, chartRefs = {}) {
  try {
    console.log('Starting GOST PDF export...', {
      hasCashFlowChart: !!chartRefs.cashFlowChart,
      hasCarbonChart: !!chartRefs.carbonChart
    });

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const textWidth = pageWidth - 2 * margin;

    // Устанавливаем шрифт по умолчанию
    doc.setFont('helvetica');
    doc.setFontSize(12);

    // === 1. ТИТУЛЬНЫЙ ЛИСТ ===
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    
    doc.text('МИНИСТЕРСТВО ПРИРОДНЫХ РЕСУРСОВ И ЭКОЛОГИИ РОССИЙСКОЙ ФЕДЕРАЦИИ', margin, 30);
    doc.text('ФЕДЕРАЛЬНОЕ ГОСУДАРСТВЕННОЕ БЮДЖЕТНОЕ УЧРЕЖДЕНИЕ', margin, 40);
    doc.text('«НАУЧНО-ИССЛЕДОВАТЕЛЬСКИЙ ИНСТИТУТ ЛЕСНОГО ХОЗЯЙСТВА»', margin, 50);
    
    doc.line(margin, 60, pageWidth - margin, 60);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ОТЧЁТ', pageWidth / 2, 90, { align: 'center' });
    doc.text('О РАСЧЁТЕ ЭФФЕКТИВНОСТИ ЛЕСНОГО КЛИМАТИЧЕСКОГО ПРОЕКТА', pageWidth / 2, 100, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`Порода: ${safeText(inputs.treeType)}`, margin, 120);
    doc.text(`Площадь: ${inputs.areaHa} га`, margin, 130);
    doc.text(`Срок реализации: ${inputs.projectYears} лет`, margin, 140);
    
    const currentDate = getCurrentDate();
    doc.text(`Дата формирования: ${currentDate}`, margin, 160);

    doc.addPage();

    // === 2. ОГЛАВЛЕНИЕ ===
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('СОДЕРЖАНИЕ', margin, 20);
    doc.setFont('helvetica', 'normal');
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

    // === 3. ВВЕДЕНИЕ ===
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('1   ВВЕДЕНИЕ', margin, 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    
    const introLines = [
      'В рамках реализации Стратегии развития углеродного рынка в РФ и поддержки',
      'лесных климатических проектов (ЛКП) выполнена оценка экономической эффективности',
      'проекта поглощения парниковых газов лесными насаждениями.',
      '',
      'Проект направлен на создание устойчивой экосистемы, способной к долгосрочному',
      'поглощению углекислого газа, с одновременным получением экономического эффекта',
      'от реализации углеродных единиц и лесной продукции.'
    ];
    
    let introY = 35;
    introLines.forEach(line => {
      doc.text(safeText(line), margin, introY, { maxWidth: textWidth });
      introY += 6;
    });

    // === 4. МЕТОДОЛОГИЯ ===
    doc.text('2   МЕТОДОЛОГИЯ РАСЧЁТА', margin, 80);
    
    const methodLines = [
      'Расчёт основан на методике, изложенной в Рекомендациях по разработке и',
      'реализации лесных климатических проектов (Минприроды России, 2023).',
      '',
      'Учитываются следующие факторы:',
      '• Поглощение CO₂ по данным таблицы «Накопленный CO₂» (с учётом прироста)',
      '• Выручка от продажи углеродных единиц и древесины',
      '• Инвестиционные и операционные затраты',
      '• Налог на прибыль организаций (25%)',
      '• Инфляция и ставка дисконтирования',
      '',
      `Дисконтирование денежных потоков выполняется по ставке ${(inputs.discountRate * 100).toFixed(1)}%.`
    ];
    
    let methodY = 90;
    methodLines.forEach(line => {
      doc.text(safeText(line), margin, methodY, { maxWidth: textWidth });
      methodY += 5;
    });

    doc.addPage();

    // === 5. РЕЗУЛЬТАТЫ РАСЧЁТА ===
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('3   РЕЗУЛЬТАТЫ РАСЧЁТА', margin, 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);

    const paramsData = [
      ['Параметр проекта', 'Значение'],
      ['Порода деревьев', safeText(inputs.treeType)],
      ['Площадь проекта', `${inputs.areaHa} га`],
      ['Срок реализации', `${inputs.projectYears} лет`],
      ['Ставка дисконтирования', `${(inputs.discountRate * 100).toFixed(1)}%`],
      ['Уровень инфляции', `${(inputs.inflation * 100).toFixed(1)}%`],
      ['Цена углеродной единицы', `${formatNumber(inputs.carbonUnitPrice)} руб/т`],
      ['Цена древесины', `${formatNumber(inputs.timberPrice)} руб/м³`]
    ];

    doc.autoTable({
      startY: 35,
      head: [paramsData[0]],
      body: paramsData.slice(1),
      theme: 'grid',
      headStyles: { 
        fillColor: [66, 66, 66], 
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11
      },
      bodyStyles: { 
        fontSize: 10
      },
      styles: {
        fontSize: 10,
        cellPadding: 4,
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      margin: { left: margin, right: margin }
    });

    // === 6. ФИНАНСОВЫЕ ПОКАЗАТЕЛИ ===
    doc.text('4   ФИНАНСОВЫЕ ПОКАЗАТЕЛИ', margin, doc.lastAutoTable.finalY + 20);

    const financialData = [
      ['Показатель', 'Значение'],
      ['NPV (чистая приведенная стоимость)', `${formatNumber(results.financials.npv)} руб`],
      ['IRR (внутренняя норма доходности)', safeText(results.financials.irr)],
      ['Срок окупаемости (простой)', `${safeText(results.financials.simplePayback)} лет`],
      ['Срок окупаемости (дисконтированный)', `${safeText(results.financials.discountedPayback)} лет`],
      ['Себестоимость УЕ', `${formatNumber(results.financials.cuCost)} руб/т`],
      ['ROI (рентабельность инвестиций)', safeText(results.financials.roi)],
      ['Индекс доходности', safeText(results.financials.profitabilityIndex)]
    ];

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 35,
      head: [financialData[0]],
      body: financialData.slice(1),
      theme: 'grid',
      headStyles: { 
        fillColor: [66, 66, 66], 
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11
      },
      bodyStyles: { 
        fontSize: 10
      },
      styles: {
        fontSize: 10,
        cellPadding: 4,
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      margin: { left: margin, right: margin }
    });

    // === 7. ГРАФИКИ ===
    let currentY = doc.lastAutoTable.finalY + 25;
    
    // Добавляем графики с улучшенной обработкой
    const chartsAdded = await addChartsToPDF(doc, chartRefs, margin, textWidth, currentY);
    
    if (chartsAdded) {
      currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : currentY + 120;
    }

    // === 8. ВЫВОДЫ И РЕКОМЕНДАЦИИ ===
    if (currentY > 120) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('5   ВЫВОДЫ И РЕКОМЕНДАЦИИ', margin, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    currentY += 15;

    const conclusion = generateConclusion(results, inputs);
    const conclusionLines = conclusion.split('\n');
    
    conclusionLines.forEach(line => {
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
      }
      doc.text(safeText(line), margin, currentY, { maxWidth: textWidth });
      currentY += 6;
    });

    // === СОХРАНЕНИЕ ===
    const fileName = `Отчет_ЛКП_${inputs.treeType}_${inputs.areaHa}га_${currentDate.replace(/\./g, '-')}.pdf`;
    doc.save(fileName);
    
    console.log('GOST PDF export completed successfully');

  } catch (error) {
    console.error('PDF generation error:', error);
    alert('Ошибка при создании PDF: ' + error.message);
  }
}

// Функция для добавления графиков в PDF
async function addChartsToPDF(doc, chartRefs, margin, textWidth, startY) {
  let chartsAdded = false;
  let currentY = startY;

  try {
    // График денежных потоков
    if (chartRefs.cashFlowChart && chartRefs.cashFlowChart.canvas) {
      console.log('Processing cash flow chart for PDF...');
      
      // Добавляем заголовок раздела
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('6   ГРАФИЧЕСКАЯ ВИЗУАЛИЗАЦИЯ', margin, currentY);
      currentY += 10;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Динамика денежных потоков', margin, currentY);
      doc.setFont('helvetica', 'normal');
      currentY += 8;

      // Ждем полной отрисовки графика
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = chartRefs.cashFlowChart.canvas;
      
      // Проверяем, что canvas имеет содержимое
      if (canvas.width > 0 && canvas.height > 0) {
        // Создаем временный canvas с увеличенным разрешением
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        
        const scale = 2;
        tempCanvas.width = canvas.width * scale;
        tempCanvas.height = canvas.height * scale;
        
        ctx.scale(scale, scale);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(canvas, 0, 0);
        
        const imgData = tempCanvas.toDataURL('image/png', 1.0);
        
        // Рассчитываем размеры для вставки
        const maxChartWidth = textWidth;
        const maxChartHeight = 80;
        const aspectRatio = canvas.width / canvas.height;
        
        let chartWidth = maxChartWidth;
        let chartHeight = chartWidth / aspectRatio;
        
        if (chartHeight > maxChartHeight) {
          chartHeight = maxChartHeight;
          chartWidth = chartHeight * aspectRatio;
        }
        
        // Центрируем график
        const x = margin + (textWidth - chartWidth) / 2;
        
        doc.addImage(imgData, 'PNG', x, currentY, chartWidth, chartHeight);
        currentY += chartHeight + 15;
        chartsAdded = true;
        
        console.log('Cash flow chart added successfully');
      } else {
        doc.text('График денежных потоков недоступен', margin, currentY);
        currentY += 20;
      }
    }

    // График углеродных единиц
    if (chartRefs.carbonChart && chartRefs.carbonChart.canvas) {
      console.log('Processing carbon chart for PDF...');
      
      // Проверяем место на странице
      if (currentY > 150) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Динамика накопленных углеродных единиц', margin, currentY);
      doc.setFont('helvetica', 'normal');
      currentY += 8;

      // Ждем полной отрисовки графика
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = chartRefs.carbonChart.canvas;
      
      if (canvas.width > 0 && canvas.height > 0) {
        // Создаем временный canvas с увеличенным разрешением
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        
        const scale = 2;
        tempCanvas.width = canvas.width * scale;
        tempCanvas.height = canvas.height * scale;
        
        ctx.scale(scale, scale);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(canvas, 0, 0);
        
        const imgData = tempCanvas.toDataURL('image/png', 1.0);
        
        // Рассчитываем размеры для вставки
        const maxChartWidth = textWidth;
        const maxChartHeight = 80;
        const aspectRatio = canvas.width / canvas.height;
        
        let chartWidth = maxChartWidth;
        let chartHeight = chartWidth / aspectRatio;
        
        if (chartHeight > maxChartHeight) {
          chartHeight = maxChartHeight;
          chartWidth = chartHeight * aspectRatio;
        }
        
        // Центрируем график
        const x = margin + (textWidth - chartWidth) / 2;
        
        doc.addImage(imgData, 'PNG', x, currentY, chartWidth, chartHeight);
        chartsAdded = true;
        
        console.log('Carbon chart added successfully');
      } else {
        doc.text('График углеродных единиц недоступен', margin, currentY);
      }
    }

  } catch (error) {
    console.error('Error adding charts to PDF:', error);
    doc.text('Ошибка при добавлении графиков', margin, currentY);
  }

  return chartsAdded;
}

// Функция для генерации выводов
function generateConclusion(results, inputs) {
  const npv = results.financials.npv;
  const irr = results.financials.irr;
  const cuCost = results.financials.cuCost;
  
  let conclusion = '';
  
  if (npv > 0) {
    conclusion += `Проект демонстрирует положительную экономическую эффективность с NPV ${formatNumber(npv)} руб. `;
    conclusion += `Внутренняя норма доходности составляет ${irr}. `;
  } else {
    conclusion += `Проект имеет отрицательный NPV (${formatNumber(npv)} руб), что свидетельствует `;
    conclusion += `о его экономической нецелесообразности в текущих условиях. `;
  }
  
  conclusion += `Себестоимость углеродной единицы составляет ${formatNumber(cuCost)} руб/т. `;
  
  if (cuCost < inputs.carbonUnitPrice) {
    conclusion += `При текущей цене УЕ ${formatNumber(inputs.carbonUnitPrice)} руб/т проект рентабелен. `;
  } else {
    conclusion += `Требуется повышение цены УЕ или снижение затрат для достижения рентабельности. `;
  }
  
  conclusion += `\n\nРекомендации:\n`;
  conclusion += `• Мониторинг рыночных цен на углеродные единицы\n`;
  conclusion += `• Оптимизация операционных затрат\n`;
  conclusion += `• Рассмотреть возможность получения государственной поддержки\n`;
  conclusion += `• Диверсификация источников дохода\n`;
  conclusion += `• Страхование климатических рисков`;
  
  return conclusion;
}
