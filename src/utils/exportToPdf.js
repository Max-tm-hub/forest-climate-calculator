import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Кастомная функция для работы с кириллицей
class PDFGenerator {
  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.setupFonts();
  }

  setupFonts() {
    // Устанавливаем стандартные шрифты с лучшей поддержкой кириллицы
    this.doc.setFont('helvetica');
    this.doc.setFontSize(10);
  }

  // Безопасный текст для кириллицы
  safeText(text) {
    if (text === null || text === undefined) return '';
    return String(text)
      .replace(/[”“]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[—]/g, '-')
      .replace(/[«»]/g, '"');
  }

  // Рендеринг текста с поддержкой Unicode
  renderText(text, x, y, options = {}) {
    const { align = 'left', fontSize = 10, fontStyle = 'normal', maxWidth = null } = options;
    
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', fontStyle);
    
    const safeText = this.safeText(text);
    
    if (maxWidth) {
      this.doc.text(safeText, x, y, { align, maxWidth });
    } else {
      this.doc.text(safeText, x, y, { align });
    }
  }

  // Создание таблицы с поддержкой кириллицы
  createTable(head, body, options = {}) {
    const {
      startY = 20,
      margin = { left: 20, right: 20 },
      headStyles = { fillColor: [33, 150, 243], textColor: 255, fontStyle: 'bold' },
      styles = { fontSize: 10, cellPadding: 4, fontStyle: 'normal' }
    } = options;

    // Обрабатываем данные для корректного отображения кириллицы
    const safeHead = head.map(row => 
      row.map(cell => this.safeText(cell))
    );
    
    const safeBody = body.map(row => 
      row.map(cell => this.safeText(cell))
    );

    this.doc.autoTable({
      startY,
      head: safeHead,
      body: safeBody,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 4,
        font: 'helvetica',
        fontStyle: 'normal',
        ...styles
      },
      headStyles: {
        fillColor: [33, 150, 243],
        textColor: 255,
        fontStyle: 'bold',
        font: 'helvetica',
        ...headStyles
      },
      margin
    });

    return this.doc.lastAutoTable.finalY;
  }

  // Добавление графиков
  async addChart(chartRef, title, x, y, width = 170, height = 90) {
    try {
      if (chartRef && chartRef.canvas) {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const canvas = chartRef.canvas;
        const offScreenCanvas = document.createElement('canvas');
        const offScreenCtx = offScreenCanvas.getContext('2d');
        
        const scale = 2;
        offScreenCanvas.width = canvas.width * scale;
        offScreenCanvas.height = canvas.height * scale;
        
        offScreenCtx.scale(scale, scale);
        offScreenCtx.imageSmoothingEnabled = true;
        offScreenCtx.imageSmoothingQuality = 'high';
        offScreenCtx.drawImage(canvas, 0, 0);
        
        const imageData = offScreenCanvas.toDataURL('image/png', 1.0);
        
        // Заголовок графика
        this.renderText(title, x + width / 2, y - 5, { align: 'center', fontSize: 10, fontStyle: 'bold' });
        
        // Изображение графика
        this.doc.addImage(imageData, 'PNG', x, y, width, height);
        
        return true;
      }
    } catch (error) {
      console.error('Error adding chart to PDF:', error);
    }
    return false;
  }

  // Добавление новой страницы
  addPage() {
    this.doc.addPage();
  }

  // Сохранение PDF
  save(fileName) {
    this.doc.save(fileName);
  }

  getDoc() {
    return this.doc;
  }
}

// Вспомогательные функции
function formatDateGOST() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${day}.${month}.${year}`;
}

function formatNumberGOST(num) {
  if (num === null || num === undefined) return '0';
  const rounded = Math.round(num);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Основная функция экспорта
export async function exportToPdf(results, inputs, chartRefs = {}) {
  try {
    const pdf = new PDFGenerator();
    const doc = pdf.getDoc();
    const pageWidth = pdf.pageWidth;

    // === ТИТУЛЬНЫЙ ЛИСТ ===
    pdf.renderText('РАСЧЕТ ЭФФЕКТИВНОСТИ', pageWidth / 2, 60, { align: 'center', fontSize: 16, fontStyle: 'bold' });
    pdf.renderText('ЛЕСНОГО КЛИМАТИЧЕСКОГО ПРОЕКТА', pageWidth / 2, 75, { align: 'center', fontSize: 16, fontStyle: 'bold' });
    
    pdf.renderText(`Порода деревьев: ${inputs.treeType}`, pageWidth / 2, 100, { align: 'center', fontSize: 12 });
    pdf.renderText(`Площадь: ${inputs.areaHa} га`, pageWidth / 2, 110, { align: 'center', fontSize: 12 });
    pdf.renderText(`Срок проекта: ${inputs.projectYears} лет`, pageWidth / 2, 120, { align: 'center', fontSize: 12 });
    
    pdf.renderText(`Дата составления: ${formatDateGOST()}`, pageWidth / 2, 140, { align: 'center', fontSize: 10 });
    pdf.renderText('Отчет сгенерирован системой расчета лесных климатических проектов', pageWidth / 2, 150, { align: 'center', fontSize: 10 });

    // === СТРАНИЦА 2: ПАРАМЕТРЫ ПРОЕКТА ===
    pdf.addPage();
    let currentY = 20;

    pdf.renderText('1. ПАРАМЕТРЫ ПРОЕКТА', 20, currentY, { fontSize: 14, fontStyle: 'bold' });
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

    currentY = pdf.createTable(
      [['Параметр', 'Значение']],
      paramsData,
      { startY: currentY, headStyles: { fillColor: [33, 150, 243] } }
    );

    // === ФИНАНСОВЫЕ ПОКАЗАТЕЛИ ===
    currentY += 15;
    pdf.renderText('2. ФИНАНСОВЫЕ ПОКАЗАТЕЛИ', 20, currentY, { fontSize: 14, fontStyle: 'bold' });
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

    currentY = pdf.createTable(
      [['Показатель', 'Значение']],
      financialData,
      { startY: currentY, headStyles: { fillColor: [76, 175, 80] } }
    );

    // === ГРАФИКИ ===
    currentY += 15;
    if (currentY > 100) {
      pdf.addPage();
      currentY = 20;
    }

    pdf.renderText('3. ГРАФИЧЕСКАЯ ВИЗУАЛИЗАЦИЯ', 20, currentY, { fontSize: 14, fontStyle: 'bold' });
    currentY += 15;

    let chartsAdded = false;

    if (chartRefs.cashFlowChart) {
      const chartAdded = await pdf.addChart(
        chartRefs.cashFlowChart,
        'Денежные потоки (млн руб.)',
        20,
        currentY
      );
      
      if (chartAdded) {
        currentY += 100;
        chartsAdded = true;
      }
    }

    if (currentY > 150) {
      pdf.addPage();
      currentY = 20;
    }

    if (chartRefs.carbonChart) {
      const chartAdded = await pdf.addChart(
        chartRefs.carbonChart,
        'Накопленные углеродные единицы (тыс. т CO₂)',
        20,
        currentY
      );
      
      if (chartAdded) {
        chartsAdded = true;
      }
    }

    if (!chartsAdded) {
      pdf.renderText('Графики недоступны для экспорта', 20, currentY);
    }

    // === ДАННЫЕ ПО ГОДАМ ===
    if (currentY > 120) {
      pdf.addPage();
      currentY = 20;
    }

    pdf.renderText('4. СВОДНЫЕ ДАННЫЕ ПО ГОДАМ', 20, currentY, { fontSize: 14, fontStyle: 'bold' });
    currentY += 10;

    const keyYears = [0, 1, 5, 10, 20, 30, 50, inputs.projectYears].filter(y => y <= inputs.projectYears);

    const cashFlowTableData = keyYears.map(year => [
      year.toString(),
      formatNumberGOST(results.cashFlows[year] / 1000),
      formatNumberGOST(results.discountedCashFlows[year] / 1000)
    ]);

    currentY = pdf.createTable(
      [['Год', 'Чистый ДП (тыс. руб.)', 'Дисконт. ДП (тыс. руб.)']],
      cashFlowTableData,
      { 
        startY: currentY,
        headStyles: { fillColor: [158, 158, 158] },
        styles: { fontSize: 8, cellPadding: 3 }
      }
    );

    currentY += 10;

    const carbonTableData = keyYears.map(year => [
      year.toString(),
      formatNumberGOST(results.carbonUnits[year]),
      formatNumberGOST(results.carbonUnits.slice(0, year + 1).reduce((a, b) => a + b, 0))
    ]);

    currentY = pdf.createTable(
      [['Год', 'УЕ за год (т CO₂)', 'Накопленные УЕ (т CO₂)']],
      carbonTableData,
      { 
        startY: currentY,
        headStyles: { fillColor: [121, 85, 72] },
        styles: { fontSize: 8, cellPadding: 3 }
      }
    );

    // === ЗАКЛЮЧЕНИЕ ===
    currentY += 15;
    if (currentY > 200) {
      pdf.addPage();
      currentY = 20;
    }

    pdf.renderText('5. ЗАКЛЮЧЕНИЕ', 20, currentY, { fontSize: 14, fontStyle: 'bold' });
    currentY += 10;

    const conclusionLines = [
      'Настоящий отчет содержит расчет экономической эффективности лесного климатического проекта.',
      `Порода деревьев: ${inputs.treeType}`,
      `Площадь проекта: ${inputs.areaHa} га`,
      `Срок реализации: ${inputs.projectYears} лет`,
      '',
      'Ключевые финансовые показатели:',
      `• Чистая приведенная стоимость (NPV): ${formatNumberGOST(results.financials.npv)} руб.`,
      `• Внутренняя норма доходности (IRR): ${results.financials.irr}`,
      `• Срок окупаемости: ${results.financials.simplePayback} лет`,
      `• Себестоимость углеродной единицы: ${formatNumberGOST(results.financials.cuCost)} руб./т`,
      '',
      'Отчет составлен в соответствии с методикой расчета лесных климатических проектов.'
    ];

    conclusionLines.forEach((line, index) => {
      if (currentY > 270) {
        pdf.addPage();
        currentY = 20;
      }
      pdf.renderText(line, 20, currentY);
      currentY += 5;
    });

    // Футер
    const finalY = currentY + 10;
    pdf.renderText(
      'Отчет сгенерирован автоматически. Данные носят информационный характер.',
      pageWidth / 2,
      finalY < 280 ? finalY : 280,
      { align: 'center', fontSize: 8, fontStyle: 'italic' }
    );

    // Сохранение
    const fileName = `Расчет_лесного_проекта_${inputs.treeType}_${inputs.areaHa}га_${formatDateGOST()}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('PDF generation error:', error);
    alert('Ошибка при создании PDF. Пожалуйста, попробуйте экспорт в Excel.');
  }
}
