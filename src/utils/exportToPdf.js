import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Функция для форматирования даты по ГОСТ
function formatDateGOST() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${day}.${month}.${year}`;
}

// Функция для форматирования чисел по ГОСТ (с пробелами)
function formatNumberGOST(num) {
  if (num === null || num === undefined) return '0';
  const rounded = Math.round(num);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Функция для добавления графиков в PDF
function addChartToPDF(doc, chartImage, title, x, y, width = 180, height = 80) {
  try {
    if (chartImage) {
      // Добавляем заголовок графика
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(title, x + width / 2, y - 5, { align: 'center' });
      
      // Добавляем изображение графика
      doc.addImage(chartImage, 'PNG', x, y, width, height);
    }
  } catch (error) {
    console.error('Error adding chart to PDF:', error);
  }
}

export async function exportToPdf(results, inputs, chartRefs = {}) {
  try {
    // Создаем PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Устанавливаем шрифт
    doc.setFont('helvetica');
    
    // === ТИТУЛЬНЫЙ ЛИСТ ===
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('РАСЧЕТ ЭФФЕКТИВНОСТИ', pageWidth / 2, 60, { align: 'center' });
    doc.text('ЛЕСНОГО КЛИМАТИЧЕСКОГО ПРОЕКТА', pageWidth / 2, 75, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Порода деревьев: ${inputs.treeType}`, pageWidth / 2, 100, { align: 'center' });
    doc.text(`Площадь: ${inputs.areaHa} га`, pageWidth / 2, 110, { align: 'center' });
    doc.text(`Срок проекта: ${inputs.projectYears} лет`, pageWidth / 2, 120, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Дата составления: ${formatDateGOST()}`, pageWidth / 2, 140, { align: 'center' });
    doc.text(`Отчет сгенерирован системой расчета лесных климатических проектов`, pageWidth / 2, 150, { align: 'center' });
    
    // Новая страница для основных данных
    doc.addPage();
    
    let currentY = 20;
    
    // === ПАРАМЕТРЫ ПРОЕКТА ===
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('1. ПАРАМЕТРЫ ПРОЕКТА', 20, currentY);
    currentY += 10;
    
    const paramsData = [
      ['Порода деревьев:', inputs.treeType],
      ['Площадь проекта, га:', inputs.areaHa.toString()],
      ['Срок проекта, лет:', inputs.projectYears.toString()],
      ['Ставка дисконтирования, %:', (inputs.discountRate * 100).toFixed(1)],
      ['Уровень инфляции, %:', (inputs.inflation * 100).toFixed(1)],
      ['Цена углеродной единицы, руб/т:', formatNumberGOST(inputs.carbonUnitPrice)],
      ['Цена древесины, руб/м³:', formatNumberGOST(inputs.timberPrice)]
    ];
    
    doc.autoTable({
      startY: currentY,
      head: [['Параметр', 'Значение']],
      body: paramsData,
      theme: 'grid',
      styles: { 
        fontSize: 10, 
        cellPadding: 4,
        font: 'helvetica'
      },
      headStyles: { 
        fillColor: [33, 150, 243],
        textColor: 255,
        fontStyle: 'bold'
      },
      margin: { left: 20, right: 20 }
    });
    
    // === ФИНАНСОВЫЕ ПОКАЗАТЕЛИ ===
    currentY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('2. ФИНАНСОВЫЕ ПОКАЗАТЕЛИ', 20, currentY);
    currentY += 10;
    
    const financialData = [
      ['NPV (чистая приведенная стоимость)', `${formatNumberGOST(results.financials.npv)} руб.`],
      ['IRR (внутренняя норма доходности)', results.financials.irr],
      ['Срок окупаемости (простой)', `${results.financials.simplePayback} лет`],
      ['Срок окупаемости (дисконтированный)', `${results.financials.discountedPayback} лет`],
      ['Себестоимость углеродной единицы', `${formatNumberGOST(results.financials.cuCost)} руб./т`],
      ['ROI (рентабельность инвестиций)', results.financials.roi],
      ['Индекс доходности', results.financials.profitabilityIndex.toString()]
    ];
    
    doc.autoTable({
      startY: currentY,
      head: [['Показатель', 'Значение']],
      body: financialData,
      theme: 'grid',
      styles: { 
        fontSize: 10, 
        cellPadding: 4,
        font: 'helvetica'
      },
      headStyles: { 
        fillColor: [76, 175, 80],
        textColor: 255,
        fontStyle: 'bold'
      },
      margin: { left: 20, right: 20 }
    });
    
    // === ГРАФИКИ ===
    currentY = doc.lastAutoTable.finalY + 15;
    
    // Проверяем, есть ли место для графиков
    if (currentY > 120) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('3. ГРАФИЧЕСКАЯ ВИЗУАЛИЗАЦИЯ', 20, currentY);
    currentY += 15;
    
    // Добавляем графики, если они переданы
    if (chartRefs.cashFlowChart && chartRefs.carbonChart) {
      try {
        // Получаем данные canvas как изображения
        const cashFlowCanvas = chartRefs.cashFlowChart.canvas;
        const carbonCanvas = chartRefs.carbonChart.canvas;
        
        // Конвертируем в base64
        const cashFlowImage = cashFlowCanvas.toDataURL('image/png');
        const carbonImage = carbonCanvas.toDataURL('image/png');
        
        // Добавляем первый график
        addChartToPDF(doc, cashFlowImage, 'Денежные потоки (млн руб.)', 20, currentY, 170, 80);
        currentY += 90;
        
        // Проверяем место для второго графика
        if (currentY > 180) {
          doc.addPage();
          currentY = 20;
        }
        
        // Добавляем второй график
        addChartToPDF(doc, carbonImage, 'Накопленные углеродные единицы (тыс. т CO₂)', 20, currentY, 170, 80);
        currentY += 90;
        
      } catch (chartError) {
        console.error('Error processing charts:', chartError);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Графики недоступны для экспорта', 20, currentY);
        currentY += 20;
      }
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Графики недоступны для экспорта', 20, currentY);
      currentY += 20;
    }
    
    // === ДЕТАЛЬНЫЕ ДАННЫЕ ===
    if (currentY > 100) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('4. СВОДНЫЕ ДАННЫЕ ПО ГОДАМ', 20, currentY);
    currentY += 10;
    
    // Выбираем ключевые годы для отображения
    const keyYears = [0, 1, 5, 10, 20, 30, 50, inputs.projectYears].filter(y => y <= inputs.projectYears);
    
    // Таблица денежных потоков
    const cashFlowTableData = keyYears.map(year => [
      year.toString(),
      formatNumberGOST(results.cashFlows[year] / 1000),
      formatNumberGOST(results.discountedCashFlows[year] / 1000)
    ]);
    
    doc.autoTable({
      startY: currentY,
      head: [['Год', 'Чистый ДП (тыс. руб.)', 'Дисконт. ДП (тыс. руб.)']],
      body: cashFlowTableData,
      theme: 'grid',
      styles: { 
        fontSize: 8, 
        cellPadding: 3,
        font: 'helvetica'
      },
      headStyles: { 
        fillColor: [158, 158, 158],
        textColor: 255,
        fontStyle: 'bold'
      },
      margin: { left: 20, right: 20 }
    });
    
    // Таблица углеродных единиц
    currentY = doc.lastAutoTable.finalY + 10;
    
    const carbonTableData = keyYears.map(year => [
      year.toString(),
      formatNumberGOST(results.carbonUnits[year]),
      formatNumberGOST(results.carbonUnits.slice(0, year + 1).reduce((a, b) => a + b, 0))
    ]);
    
    doc.autoTable({
      startY: currentY,
      head: [['Год', 'УЕ за год (т CO₂)', 'Накопленные УЕ (т CO₂)']],
      body: carbonTableData,
      theme: 'grid',
      styles: { 
        fontSize: 8, 
        cellPadding: 3,
        font: 'helvetica'
      },
      headStyles: { 
        fillColor: [121, 85, 72],
        textColor: 255,
        fontStyle: 'bold'
      },
      margin: { left: 20, right: 20 }
    });
    
    // === ЗАКЛЮЧЕНИЕ ===
    currentY = doc.lastAutoTable.finalY + 15;
    
    if (currentY > 200) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('5. ЗАКЛЮЧЕНИЕ', 20, currentY);
    currentY += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const conclusionLines = [
      `Настоящий отчет содержит расчет экономической эффективности лесного климатического проекта.`,
      `Порода деревьев: ${inputs.treeType}`,
      `Площадь проекта: ${inputs.areaHa} га`,
      `Срок реализации: ${inputs.projectYears} лет`,
      ``,
      `Ключевые финансовые показатели:`,
      `• Чистая приведенная стоимость (NPV): ${formatNumberGOST(results.financials.npv)} руб.`,
      `• Внутренняя норма доходности (IRR): ${results.financials.irr}`,
      `• Срок окупаемости: ${results.financials.simplePayback} лет`,
      `• Себестоимость углеродной единицы: ${formatNumberGOST(results.financials.cuCost)} руб./т`,
      ``,
      `Отчет составлен в соответствии с методикой расчета лесных климатических проектов.`
    ];
    
    conclusionLines.forEach((line, index) => {
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
      }
      doc.text(line, 20, currentY);
      currentY += 5;
    });
    
    // Футер на последней странице
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : currentY + 10;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Отчет сгенерирован автоматически. Данные носят информационный характер.', pageWidth / 2, finalY < 280 ? finalY : 280, { align: 'center' });
    
    // Сохранение с именем по ГОСТ
    const fileName = `Расчет_лесного_проекта_${inputs.treeType}_${inputs.areaHa}га_${formatDateGOST()}.pdf`;
    doc.save(fileName);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    alert('Ошибка при создании PDF. Пожалуйста, попробуйте экспорт в Excel.');
  }
}
