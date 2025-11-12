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
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function exportToPdf(results, inputs) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // === ЗАГОЛОВОК ПО ГОСТ ===
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('РАСЧЕТ ЭФФЕКТИВНОСТИ ЛЕСНОГО КЛИМАТИЧЕСКОГО ПРОЕКТА', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Дата составления: ${formatDateGOST()}`, pageWidth - 20, 30, { align: 'right' });
  
  // === ПАРАМЕТРЫ ПРОЕКТА ===
  doc.setFont('helvetica', 'bold');
  doc.text('1. ПАРАМЕТРЫ ПРОЕКТА', 14, 45);
  
  const paramsData = [
    ['Порода деревьев:', inputs.treeType],
    ['Площадь проекта, га:', inputs.areaHa.toString()],
    ['Срок проекта, лет:', inputs.projectYears.toString()],
    ['Ставка дисконтирования, %:', (inputs.discountRate * 100).toFixed(1)],
    ['Уровень инфляции, %:', (inputs.inflation * 100).toFixed(1)]
  ];
  
  doc.autoTable({
    startY: 50,
    head: [['Параметр', 'Значение']],
    body: paramsData,
    theme: 'grid',
    styles: { 
      fontSize: 9, 
      cellPadding: 3,
      font: 'helvetica'
    },
    headStyles: { 
      fillColor: [33, 150, 243],
      textColor: 255,
      fontStyle: 'bold'
    },
    margin: { left: 14, right: 14 }
  });
  
  // === ФИНАНСОВЫЕ ПОКАЗАТЕЛИ ===
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.text('2. ФИНАНСОВЫЕ ПОКАЗАТЕЛИ', 14, finalY);
  
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
    startY: finalY + 5,
    head: [['Показатель', 'Значение']],
    body: financialData,
    theme: 'grid',
    styles: { 
      fontSize: 9, 
      cellPadding: 3,
      font: 'helvetica'
    },
    headStyles: { 
      fillColor: [76, 175, 80],
      textColor: 255,
      fontStyle: 'bold'
    },
    margin: { left: 14, right: 14 }
  });
  
  // === СВОДНАЯ ТАБЛИЦА ДЕНЕЖНЫХ ПОТОКОВ ===
  const financialY = doc.lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.text('3. СВОДНАЯ ТАБЛИЦА ДЕНЕЖНЫХ ПОТОКОВ (тыс. руб.)', 14, financialY);
  
  // Выбираем ключевые годы для отображения
  const keyYears = [0, 1, 5, 10, 20, 30, 50, inputs.projectYears].filter(y => y <= inputs.projectYears);
  const cashFlowData = keyYears.map(year => [
    year.toString(),
    formatNumberGOST(results.cashFlows[year] / 1000),
    formatNumberGOST(results.discountedCashFlows[year] / 1000)
  ]);
  
  doc.autoTable({
    startY: financialY + 5,
    head: [['Год', 'Чистый денежный поток', 'Дисконтированный ДП']],
    body: cashFlowData,
    theme: 'grid',
    styles: { 
      fontSize: 8, 
      cellPadding: 2,
      font: 'helvetica'
    },
    headStyles: { 
      fillColor: [158, 158, 158],
      textColor: 255,
      fontStyle: 'bold'
    },
    margin: { left: 14, right: 14 }
  });
  
  // === УГЛЕРОДНЫЕ ЕДИНИЦЫ ===
  const cashFlowY = doc.lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.text('4. ПОГЛОЩЕНИЕ УГЛЕРОДА', 14, cashFlowY);
  
  const carbonData = keyYears.map(year => [
    year.toString(),
    formatNumberGOST(results.carbonUnits[year]),
    formatNumberGOST(results.carbonUnits.slice(0, year + 1).reduce((a, b) => a + b, 0))
  ]);
  
  doc.autoTable({
    startY: cashFlowY + 5,
    head: [['Год', 'УЕ за год (т CO₂)', 'Накопленные УЕ (т CO₂)']],
    body: carbonData,
    theme: 'grid',
    styles: { 
      fontSize: 8, 
      cellPadding: 2,
      font: 'helvetica'
    },
    headStyles: { 
      fillColor: [121, 85, 72],
      textColor: 255,
      fontStyle: 'bold'
    },
    margin: { left: 14, right: 14 }
  });
  
  // === ПОДПИСИ ===
  const finalTableY = doc.lastAutoTable.finalY + 20;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Расчет выполнен с использованием калькулятора лесных климатических проектов', pageWidth / 2, finalTableY, { align: 'center' });
  
  // Сохранение с именем по ГОСТ
  const fileName = `Расчет_лесного_проекта_${inputs.treeType}_${inputs.areaHa}га_${formatDateGOST()}.pdf`;
  doc.save(fileName);
}
