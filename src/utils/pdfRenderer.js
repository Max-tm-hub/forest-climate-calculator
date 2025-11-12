import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function exportToPdfWithCanvas(results, inputs, chartRefs = {}) {
  try {
    console.log('Starting PDF export...', { hasCashFlowChart: !!chartRefs.cashFlowChart, hasCarbonChart: !!chartRefs.carbonChart });

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

    // Ждем отрисовки и конвертируем
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const canvas = await html2canvas(pdfContainer, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    document.body.removeChild(pdfContainer);

    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // === СТРАНИЦА 2: ГРАФИК ДЕНЕЖНЫХ ПОТОКОВ ===
    if (chartRefs.cashFlowChart && chartRefs.cashFlowChart.canvas) {
      console.log('Adding cash flow chart...');
      pdf.addPage();
      
      // Добавляем заголовок
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ГРАФИК ДЕНЕЖНЫХ ПОТОКОВ', 105, 20, { align: 'center' });
      
      // Добавляем описание
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Денежные потоки проекта в миллионах рублей', 105, 28, { align: 'center' });
      
      // Конвертируем график в изображение
      const cashFlowImage = await convertChartToImage(chartRefs.cashFlowChart, 700, 400);
      if (cashFlowImage) {
        pdf.addImage(cashFlowImage, 'PNG', 10, 35, 190, 100);
        console.log('Cash flow chart added successfully');
      }
    }

    // === СТРАНИЦА 3: ГРАФИК УГЛЕРОДНЫХ ЕДИНИЦ ===
    if (chartRefs.carbonChart && chartRefs.carbonChart.canvas) {
      console.log('Adding carbon chart...');
      pdf.addPage();
      
      // Добавляем заголовок
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ГРАФИК НАКОПЛЕННЫХ УГЛЕРОДНЫХ ЕДИНИЦ', 105, 20, { align: 'center' });
      
      // Добавляем описание
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Накопленные углеродные единицы в тысячах тонн CO₂', 105, 28, { align: 'center' });
      
      // Конвертируем график в изображение
      const carbonImage = await convertChartToImage(chartRefs.carbonChart, 700, 400);
      if (carbonImage) {
        pdf.addImage(carbonImage, 'PNG', 10, 35, 190, 100);
        console.log('Carbon chart added successfully');
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

// Функция для конвертации графика в изображение
async function convertChartToImage(chartRef, width = 700, height = 400) {
  try {
    const canvas = chartRef.canvas;
    
    // Создаем временный canvas с увеличенным разрешением
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    
    // Увеличиваем размер для лучшего качества
    const scale = 2;
    tempCanvas.width = width * scale;
    tempCanvas.height = height * scale;
    
    // Настраиваем сглаживание
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Копируем содержимое исходного canvas
    ctx.drawImage(canvas, 0, 0, width, height);
    
    // Конвертируем в base64
    return tempCanvas.toDataURL('image/png', 1.0);
    
  } catch (error) {
    console.error('Error converting chart to image:', error);
    return null;
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
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; width: 60%; background: #f9f9f9;"><strong>Порода деревьев</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px; width: 40%;">${inputs.treeType}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"><strong>Площадь проекта, га</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${inputs.areaHa}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"><strong>Срок проекта, лет</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${inputs.projectYears}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"><strong>Ставка дисконтирования, %</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${(inputs.discountRate * 100).toFixed(1)}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"><strong>Цена углеродной единицы, руб/т</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${formatNumber(inputs.carbonUnitPrice)}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"><strong>Цена древесины, руб/м³</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${formatNumber(inputs.timberPrice)}</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 25px;">
        <h3 style="font-size: 16px; background: #4CAF50; color: white; padding: 8px; margin: 0 0 15px 0; border-radius: 4px;">2. ФИНАНСОВЫЕ ПОКАЗАТЕЛИ</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; width: 60%; background: #f9f9f9;"><strong>NPV (чистая приведенная стоимость)</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px; width: 40%;">${formatNumber(results.financials.npv)} руб.</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"><strong>IRR (внутренняя норма доходности)</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${results.financials.irr}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"><strong>Срок окупаемости (простой)</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${results.financials.simplePayback} лет</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"><strong>Срок окупаемости (дисконтированный)</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${results.financials.discountedPayback} лет</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"><strong>Себестоимость углеродной единицы</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${formatNumber(results.financials.cuCost)} руб./т</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"><strong>ROI (рентабельность инвестиций)</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${results.financials.roi}</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 16px; background: #795548; color: white; padding: 8px; margin: 0 0 15px 0; border-radius: 4px;">3. СВОДНЫЕ ДАННЫЕ ПО ГОДАМ</h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div>
            <h4 style="font-size: 14px; margin: 0 0 10px 0; color: #2196F3;">Денежные потоки</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
              <tr style="background: #e0e0e0;">
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Год</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right;">ДП (тыс.руб)</th>
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
            <h4 style="font-size: 14px; margin: 0 0 10px 0; color: #4CAF50;">Углеродные единицы</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
              <tr style="background: #e0e0e0;">
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Год</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right;">УЕ (т CO₂)</th>
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
          Денежные потоки показаны в миллионах рублей, углеродные единицы - в тысячах тонн CO₂.
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
