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

// Функция для безопасного отображения текста
function safeText(text) {
  if (typeof text !== 'string') return String(text);
  // Заменяем проблемные символы
  return text
    .replace(/[^\x00-\x7F]/g, '') // Убираем не-ASCII символы для надежности
    .replace(/[^\w\s.,%()+-]/g, '');
}

export function exportToPdf(results, inputs) {
  try {
    // Создаем PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Устанавливаем простой шрифт для лучшей совместимости
    doc.setFont('helvetica');
    doc.setFontSize(16);
    
    // Заголовок (используем только ASCII символы для надежности)
    doc.text('CALCULATION OF FOREST CLIMATE PROJECT', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Date: ${formatDateGOST()}`, 14, 35);
    
    // 1. ПАРАМЕТРЫ ПРОЕКТА (PROJECT PARAMETERS)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. PROJECT PARAMETERS', 14, 50);
    
    const paramsData = [
      ['Tree species:', inputs.treeType],
      ['Area, ha:', inputs.areaHa.toString()],
      ['Project years:', inputs.projectYears.toString()],
      ['Discount rate, %:', (inputs.discountRate * 100).toFixed(1)],
      ['Inflation, %:', (inputs.inflation * 100).toFixed(1)]
    ];
    
    doc.autoTable({
      startY: 55,
      head: [['Parameter', 'Value']],
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
      margin: { left: 14, right: 14 }
    });
    
    // 2. ФИНАНСОВЫЕ ПОКАЗАТЕЛИ (FINANCIAL INDICATORS)
    const paramsY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('2. FINANCIAL INDICATORS', 14, paramsY);
    
    const financialData = [
      ['NPV (Net Present Value)', `${formatNumberGOST(results.financials.npv)} RUB`],
      ['IRR (Internal Rate of Return)', results.financials.irr],
      ['Payback period (simple)', `${results.financials.simplePayback} years`],
      ['Payback period (discounted)', `${results.financials.discountedPayback} years`],
      ['Carbon unit cost', `${formatNumberGOST(results.financials.cuCost)} RUB/t`],
      ['ROI (Return on Investment)', results.financials.roi],
      ['Profitability index', results.financials.profitabilityIndex.toString()]
    ];
    
    doc.autoTable({
      startY: paramsY + 5,
      head: [['Indicator', 'Value']],
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
      margin: { left: 14, right: 14 }
    });
    
    // 3. ДЕНЕЖНЫЕ ПОТОКИ (CASH FLOWS)
    const financialY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('3. CASH FLOWS (thousand RUB)', 14, financialY);
    
    const keyYears = [0, 1, 5, 10, 20, 30, 50, inputs.projectYears].filter(y => y <= inputs.projectYears);
    const cashFlowData = keyYears.map(year => [
      year.toString(),
      formatNumberGOST(results.cashFlows[year] / 1000),
      formatNumberGOST(results.discountedCashFlows[year] / 1000)
    ]);
    
    doc.autoTable({
      startY: financialY + 5,
      head: [['Year', 'Cash Flow', 'Discounted CF']],
      body: cashFlowData,
      theme: 'grid',
      styles: { 
        fontSize: 9, 
        cellPadding: 3,
        font: 'helvetica'
      },
      headStyles: { 
        fillColor: [158, 158, 158],
        textColor: 255,
        fontStyle: 'bold'
      },
      margin: { left: 14, right: 14 }
    });
    
    // 4. УГЛЕРОДНЫЕ ЕДИНИЦЫ (CARBON UNITS)
    const cashFlowY = doc.lastAutoTable.finalY + 15;
    
    if (cashFlowY > 250) {
      doc.addPage();
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('4. CARBON UNITS', 14, 20);
    } else {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('4. CARBON UNITS', 14, cashFlowY);
    }
    
    const startY = cashFlowY > 250 ? 25 : cashFlowY + 5;
    
    const carbonData = keyYears.map(year => [
      year.toString(),
      formatNumberGOST(results.carbonUnits[year]),
      formatNumberGOST(results.carbonUnits.slice(0, year + 1).reduce((a, b) => a + b, 0))
    ]);
    
    doc.autoTable({
      startY: startY,
      head: [['Year', 'Annual CU (t CO₂)', 'Accumulated CU (t CO₂)']],
      body: carbonData,
      theme: 'grid',
      styles: { 
        fontSize: 9, 
        cellPadding: 3,
        font: 'helvetica'
      },
      headStyles: { 
        fillColor: [121, 85, 72],
        textColor: 255,
        fontStyle: 'bold'
      },
      margin: { left: 14, right: 14 }
    });
    
    // Footer
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated by Forest Climate Project Calculator', pageWidth / 2, finalY > 280 ? 20 : finalY, { align: 'center' });
    
    // Сохранение
    const fileName = `Forest_Project_${inputs.treeType.replace(/\s+/g, '_')}_${inputs.areaHa}ha_${formatDateGOST()}.pdf`;
    doc.save(fileName);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    alert('Ошибка при создании PDF. Пожалуйста, попробуйте экспорт в Excel.');
  }
}
