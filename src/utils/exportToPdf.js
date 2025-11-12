[file name]: exportToPdf.js
[file content begin]
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

function registerRussianFont(doc) {
  doc.setFont('helvetica');
}

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

async function addChartToPDF(doc, chartRef, title, x, y, width = 170, height = 90) {
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
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(title, x + width / 2, y - 5, { align: 'center' });
      
      doc.addImage(imageData, 'PNG', x, y, width, height);
      
      return true;
    }
  } catch (error) {
    console.error('Error adding chart to PDF:', error);
  }
  return false;
}

export async function exportToPdf(results, inputs, chartRefs = {}) {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    registerRussianFont(doc);
    
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
    
    doc.addPage();
    
    let currentY = 20;
    
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
    
    currentY = doc.lastAutoTable.finalY + 15;
    
    if (currentY > 100) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('3. ГРАФИЧЕСКАЯ ВИЗУАЛИЗАЦИЯ', 20, currentY);
    currentY += 15;
    
    let chartsAdded = false;
    
    if (chartRefs.cashFlowChart) {
      const chartAdded = await addChartToPDF(
        doc, 
        chartRefs.cashFlowChart, 
        'Денежные потоки (млн руб.)', 
        20, 
        currentY, 
        170, 
        90
      );
      
      if (chartAdded) {
        currentY += 100;
        chartsAdded = true;
      }
    }
    
    if (currentY > 150) {
      doc.addPage();
      currentY = 20;
    }
    
    if (chartRefs.carbonChart) {
      const chartAdded = await addChartToPDF(
        doc, 
        chartRefs.carbonChart, 
        'Накопленные углеродные единицы (тыс. т CO₂)', 
        20, 
        currentY, 
        170, 
        90
      );
      
      if (chartAdded) {
        chartsAdded = true;
      }
    }
    
    if (!chartsAdded) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Графики недоступны для экспорта', 20, currentY);
      currentY += 20;
    } else {
      currentY += 100;
    }
    
    if (currentY > 120) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('4. СВОДНЫЕ ДАННЫЕ ПО ГОДАМ', 20, currentY);
    currentY += 10;
    
    const keyYears = [0, 1, 5, 10, 20, 30, 50, inputs.projectYears].filter(y => y <= inputs.projectYears);
    
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
    
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : currentY + 10;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Отчет сгенерирован автоматически. Данные носят информационный характер.', pageWidth / 2, finalY < 280 ? finalY : 280, { align: 'center' });
    
    const fileName = `Расчет_лесного_проекта_${inputs.treeType}_${inputs.areaHa}га_${formatDateGOST()}.pdf`;
    doc.save(fileName);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    alert('Ошибка при создании PDF. Пожалуйста, попробуйте экспорт в Excel.');
  }
}
[file content end]
