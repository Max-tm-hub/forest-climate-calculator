// src/utils/pdfRenderer.js
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function exportToPdfWithCanvas(results, inputs, chartRefs = {}) {
  try {
    console.log('Starting PDF export with charts:', {
      cashFlow: !!chartRefs.cashFlowChart,
      carbon: !!chartRefs.carbonChart
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // === СТРАНИЦА 1: ОСНОВНЫЕ ДАННЫЕ ===
    const pdfContainer = document.createElement('div');
    pdfContainer.style.cssText = `
      position: fixed;
      left: -10000px;
      top: 0;
      width: 800px;
      padding: 20px;
      background: white;
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: black;
    `;

    pdfContainer.innerHTML = generatePdfHTML(results, inputs);
    document.body.appendChild(pdfContainer);

    await new Promise(resolve => setTimeout(resolve, 500));
    
    const canvas = await html2canvas(pdfContainer, {
      scale: 1.5,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    document.body.removeChild(pdfContainer);

    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // === СТРАНИЦА 2: ГРАФИК ДЕНЕЖНЫХ ПОТОКОВ ===
    if (chartRefs.cashFlowChart) {
      console.log('Processing cash flow chart...');
      const chartAdded = await addChartToPdf(pdf, chartRefs.cashFlowChart, 'ГРАФИК ДЕНЕЖНЫХ ПОТОКОВ', 'Денежные потоки проекта в миллионах рублей');
      if (chartAdded) {
        console.log('Cash flow chart added successfully');
      } else {
        console.log('Failed to add cash flow chart');
      }
    }

    // === СТРАНИЦА 3: ГРАФИК УГЛЕРОДНЫХ ЕДИНИЦ ===
    if (chartRefs.carbonChart) {
      console.log('Processing carbon chart...');
      const chartAdded = await addChartToPdf(pdf, chartRefs.carbonChart, 'ГРАФИК НАКОПЛЕННЫХ УГЛЕРОДНЫХ ЕДИНИЦ', 'Накопленные углеродные единицы в тысячах тонн CO₂');
      if (chartAdded) {
        console.log('Carbon chart added successfully');
      } else {
        console.log('Failed to add carbon chart');
      }
    }

    // Сохранение
    const fileName = `Расчет_проекта_${inputs.treeType}_${inputs.areaHa}га_${formatDate()}.pdf`;
    pdf.save(fileName);
    console.log('PDF saved successfully');

  } catch (error) {
    console.error('PDF generation error:', error);
    alert('Ошибка при создании PDF: ' + error.message);
  }
}

// Функция для добавления графика в PDF
async function addChartToPdf(pdf, chartRef, title, subtitle) {
  try {
    // Ждем полной отрисовки графика
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!chartRef || !chartRef.canvas) {
      console.error('Chart reference or canvas is missing');
      return false;
    }

    const canvas = chartRef.canvas;
    
    // Проверяем, что canvas имеет содержимое
    if (canvas.width === 0 || canvas.height === 0) {
      console.error('Canvas has zero dimensions');
      return false;
    }

    // Создаем временный canvas с увеличенным разрешением
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    
    // Сохраняем оригинальные размеры
    const originalWidth = canvas.width;
    const originalHeight = canvas.height;
    
    // Увеличиваем размер для лучшего качества
    const scale = 2;
    tempCanvas.width = originalWidth * scale;
    tempCanvas.height = originalHeight * scale;
    
    // Настраиваем сглаживание
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Копируем содержимое исходного canvas
    ctx.drawImage(canvas, 0, 0, originalWidth, originalHeight);
    
    // Конвертируем в base64
    const imageData = tempCanvas.toDataURL('image/png', 1.0);
    
    // Добавляем новую страницу
    pdf.addPage();
    
    // Добавляем заголовок
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, 105, 20, { align: 'center' });
    
    // Добавляем подзаголовок
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(subtitle, 105, 28, { align: 'center' });
    
    // Рассчитываем размеры для вставки изображения
    const pageWidth = pdf.internal.pageSize.getWidth();
    const maxWidth = pageWidth - 20; // Отступы по 10мм с каждой стороны
    const maxHeight = 150; // Максимальная высота графика
    
    // Сохраняем пропорции
    const aspectRatio = originalWidth / originalHeight;
    let chartWidth = maxWidth;
    let chartHeight = chartWidth / aspectRatio;
    
    if (chartHeight > maxHeight) {
      chartHeight = maxHeight;
      chartWidth = chartHeight * aspectRatio;
    }
    
    // Центрируем график
    const x = (pageWidth - chartWidth) / 2;
    const y = 40;
    
    // Добавляем изображение графика
    pdf.addImage(imageData, 'PNG', x, y, chartWidth, chartHeight);
    
    return true;
    
  } catch (error) {
    console.error('Error adding chart to PDF:', error);
    return false;
  }
}

function generatePdfHTML(results, inputs) {
  const keyYears = [0, 1, 5, 10, 20, 30, 50, inputs.projectYears].filter(y => y <= inputs.projectYears);
  
  return `
    <div style="font-family: Arial, sans-serif; color: #000; max-width: 800px;">
      <div style="text-align: center; margin-bottom: 30px; padding: 20px; border-bottom: 2px solid #2e7d32;">
        <h1 style="font-size: 24px; margin: 0 0 10px 0; color: #2e7d32;">РАСЧЕТ ЭФФЕКТИВНОСТИ</h1>
        <h2 style="font-size: 20px; margin: 0 0 20px 0; color: #2e7d32;">ЛЕСНОГО КЛИМАТИЧЕСКОГО ПРОЕКТА</h2>
        <div style="display: flex; justify-content: center; gap: 30px; font-size: 14px;">
          <div><strong>Порода:</strong> ${inputs.treeType}</div>
          <div><strong>Площадь:</strong> ${inputs.areaHa} га</div>
          <div><strong>Срок:</strong> ${inputs.projectYears} лет</div>
        </div>
        <div style="margin-top: 10px; font-size: 12px; color: #666;">Дата составления: ${formatDate()}</div>
      </div>

      <div style="margin-bottom: 25px;">
        <h3 style="font-size: 16px; background: #2196F3; color: white; padding: 8px; margin: 0 0 15px 0; border-radius: 4px;">1. ПАРАМЕТРЫ ПРОЕКТА</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          ${[
            ['Порода деревьев', inputs.treeType],
            ['Площадь проекта, га', inputs.areaHa],
            ['Срок проекта, лет', inputs.projectYears],
            ['Ставка дисконтирования, %', (inputs.discountRate * 100).toFixed(1)],
            ['Цена углеродной единицы, руб/т', formatNumber(inputs.carbonUnitPrice)],
            ['Цена древесины, руб/м³', formatNumber(inputs.timberPrice)]
          ].map(row => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px; width: 60%; background: #f9f9f9;"><strong>${row[0]}</strong></td>
              <td style="border: 1px solid #ddd; padding: 8px; width: 40%;">${row[1]}</td>
            </tr>
          `).join('')}
        </table>
      </div>

      <div style="margin-bottom: 25px;">
        <h3 style="font-size: 16px; background: #4CAF50; color: white; padding: 8px; margin: 0 0 15px 0; border-radius: 4px;">2. ФИНАНСОВЫЕ ПОКАЗАТЕЛИ</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          ${[
            ['NPV (чистая приведенная стоимость)', `${formatNumber(results.financials.npv)} руб.`],
            ['IRR (внутренняя норма доходности)', results.financials.irr],
            ['Срок окупаемости (простой)', `${results.financials.simplePayback} лет`],
            ['Срок окупаемости (дисконтированный)', `${results.financials.discountedPayback} лет`],
            ['Себестоимость углеродной единицы', `${formatNumber(results.financials.cuCost)} руб./т`],
            ['ROI (рентабельность инвестиций)', results.financials.roi]
          ].map(row => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px; width: 60%; background: #f9f9f9;"><strong>${row[0]}</strong></td>
              <td style="border: 1px solid #ddd; padding: 8px; width: 40%;">${row[1]}</td>
            </tr>
          `).join('')}
        </table>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 16px; background: #795548; color: white; padding: 8px; margin: 0 0 15px 0; border-radius: 4px;">3. СВОДНЫЕ ДАННЫЕ ПО ГОДАМ</h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div>
            <h4 style="font-size: 14px; margin: 0 0 10px 0; color: #2196F3;">Денежные потоки (тыс. руб)</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
              <tr style="background: #e0e0e0;">
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Год</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right;">Сумма</th>
              </tr>
              ${keyYears.map(year => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 6px;">${year}</td>
                  <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${formatNumber(results.cashFlows[year] / 1000)}</td>
                </tr>
              `).join('')}
            </table>
          </div>
          
          <div>
            <h4 style="font-size: 14px; margin: 0 0 10px 0; color: #4CAF50;">Углеродные единицы (т CO₂)</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
              <tr style="background: #e0e0e0;">
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Год</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right;">Сумма</th>
              </tr>
              ${keyYears.map(year => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 6px;">${year}</td>
                  <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${formatNumber(results.carbonUnits[year])}</td>
                </tr>
              `).join('')}
            </table>
          </div>
        </div>
      </div>

      <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; border-left: 4px solid #2e7d32;">
        <p style="margin: 0; font-size: 11px; line-height: 1.5;">
          <strong>Примечание:</strong> Графики денежных потоков и накопленных углеродных единиц представлены на следующих страницах.
        </p>
      </div>
    </div>
  `;
}

function formatDate() {
  const now = new Date();
  return `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
}

function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
