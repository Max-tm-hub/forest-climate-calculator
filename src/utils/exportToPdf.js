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
  const pageHeight = doc.internal.pageSize.getHeight();
  
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
    ['Себестоимость углеродной единицы', `${formatNumberGOST(results.financials.cuCost)} руб./
