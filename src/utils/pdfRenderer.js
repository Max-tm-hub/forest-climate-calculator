import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function exportToPdfWithCanvas(results, inputs, chartRefs = {}) {
  try {
    // Создаем скрытый div с содержимым для PDF
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

    // Генерируем HTML содержимое
    pdfContainer.innerHTML = generatePdfHTML(results, inputs);
    document.body.appendChild(pdfContainer);

    // Ждем отрисовки
    await new Promise(resolve => setTimeout(resolve, 500));

    // Конвертируем в canvas
    const canvas = await html2canvas(pdfContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    // Удаляем временный контейнер
    document.body.removeChild(pdfContainer);

    // Создаем PDF из canvas
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Добавляем изображение на первую страницу
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    // Добавляем графики на отдельные страницы
    if (chartRefs.cashFlowChart) {
      pdf.addPage();
      await addChartToPDF(pdf, chartRefs.cashFlowChart, 'Денежные потоки', 10, 20, 190, 100);
    }
    
    if (chartRefs.carbonChart) {
      pdf.addPage();
      await addChartToPDF(pdf, chartRefs.carbonChart, 'Накопленные углеродные единицы', 10, 20, 190, 100);
    }

    // Сохраняем PDF
    const fileName = `Расчет_лесного_проекта_${inputs.treeType}_${inputs.areaHa}га_${formatDateGOST()}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('PDF generation error:', error);
    alert('Ошибка при создании PDF');
  }
}

function generatePdfHTML(results, inputs) {
  const keyYears = [0, 1, 5, 10, 20, 30, 50, inputs.projectYears].filter(y => y <= inputs.projectYears);
  
  return `
    <div style="font-family: Arial, sans-serif; color: #000;">
      <!-- Заголовок -->
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 20px; margin-bottom: 10px;">РАСЧЕТ ЭФФЕКТИВНОСТИ</h1>
        <h2 style="font-size: 18px; margin-bottom: 20px;">ЛЕСНОГО КЛИМАТИЧЕСКОГО ПРОЕКТА</h2>
        <p><strong>Порода деревьев:</strong> ${inputs.treeType}</p>
        <p><strong>Площадь:</strong> ${inputs.areaHa} га</p>
        <p><strong>Срок проекта:</strong> ${inputs.projectYears} лет</p>
        <p><strong>Дата составления:</strong> ${formatDateGOST()}</p>
      </div>

      <!-- Параметры проекта -->
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 16px; background: #f0f0f0; padding: 5px; margin-bottom: 10px;">1. ПАРАМЕТРЫ ПРОЕКТА</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #2196F3; color: white;">
            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Параметр</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Значение</th>
          </tr>
          <tr><td style="border: 1px solid #000; padding: 8px;">Порода деревьев</td><td style="border: 1px solid #000; padding: 8px;">${inputs.treeType}</td></tr>
          <tr><td style="border: 1px solid #000; padding: 8px;">Площадь проекта, га</td><td style="border: 1px solid #000; padding: 8px;">${inputs.areaHa}</td></tr>
          <tr><td style="border: 1px solid #000; padding: 8px;">Срок проекта, лет</td><td style="border: 1px solid #000; padding: 8px;">${inputs.projectYears}</td></tr>
          <tr><td style="border: 1px solid #000; padding: 8px;">Ставка дисконтирования, %</td><td style="border: 1px solid #000; padding: 8px;">${(inputs.discountRate * 100).toFixed(1)}</td></tr>
          <tr><td style="border: 1px solid #000; padding: 8px;">Уровень инфляции, %</td><td style="border: 1px solid #000; padding: 8px;">${(inputs.inflation * 100).toFixed(1)}</td></tr>
          <tr><td style="border: 1px solid #000; padding: 8px;">Цена углеродной единицы, руб/т</td><td style="border: 1px solid #000; padding: 8px;">${formatNumberGOST(inputs.carbonUnitPrice)}</td></tr>
          <tr><td style="border: 1px solid #000; padding: 8px;">Цена древесины, руб/м³</td><td style="border: 1px solid #000; padding: 8px;">${formatNumberGOST(inputs.timberPrice)}</td></tr>
        </table>
      </div>

      <!-- Финансовые показатели -->
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 16px; background: #f0f0f0; padding: 5px; margin-bottom: 10px;">2. ФИНАНСОВЫЕ ПОКАЗАТЕЛИ</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #4CAF50; color: white;">
            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Показатель</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Значение</th>
          </tr>
          <tr><td style="border: 1px solid #000; padding: 8px;">NPV (чистая приведенная стоимость)</td><td style="border: 1px solid #000; padding: 8px;">${formatNumberGOST(results.financials.npv)} руб.</td></tr>
          <tr><td style="border: 1px solid #000; padding: 8px;">IRR (внутренняя норма доходности)</td><td style="border: 1px solid #000; padding: 8px;">${results.financials.irr}</td></tr>
          <tr><td style="border: 1px solid #000; padding: 8px;">Срок окупаемости (простой)</td><td style="border: 1px solid #000; padding: 8px;">${results.financials.simplePayback} лет</td></tr>
          <tr><td style="border: 1px solid #000; padding: 8px;">Срок окупаемости (дисконтированный)</td><td style="border: 1px solid #000; padding: 8px;">${results.financials.discountedPayback} лет</td></tr>
          <tr><td style="border: 1px solid #000; padding: 8px;">Себестоимость углеродной единицы</td><td style="border: 1px solid #000; padding: 8px;">${formatNumberGOST(results.financials.cuCost)} руб./т</td></tr>
          <tr><td style="border: 1px solid #000; padding: 8px;">ROI (рентабельность инвестиций)</td><td style="border: 1px solid #000; padding: 8px;">${results.financials.roi}</td></tr>
          <tr><td style="border: 1px solid #000; padding: 8px;">Индекс доходности</td><td style="border: 1px solid #000; padding: 8px;">${results.financials.profitabilityIndex}</td></tr>
        </table>
      </div>

      <!-- Данные по годам -->
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 16px; background: #f0f0f0; padding: 5px; margin-bottom: 10px;">3. СВОДНЫЕ ДАННЫЕ ПО ГОДАМ</h3>
        
        <h4 style="font-size: 14px; margin: 10px 0;">Денежные потоки</h4>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <tr style="background: #9E9E9E; color: white;">
            <th style="border: 1px solid #000; padding: 6px; text-align: left;">Год</th>
            <th style="border: 1px solid #000; padding: 6px; text-align: left;">Чистый ДП (тыс. руб.)</th>
            <th style="border: 1px solid #000; padding: 6px; text-align: left;">Дисконт. ДП (тыс. руб.)</th>
          </tr>
          ${keyYears.map(year => `
            <tr>
              <td style="border: 1px solid #000; padding: 6px;">${year}</td>
              <td style="border: 1px solid #000; padding: 6px;">${formatNumberGOST(results.cashFlows[year] / 1000)}</td>
              <td style="border: 1px solid #000; padding: 6px;">${formatNumberGOST(results.discountedCashFlows[year] / 1000)}</td>
            </tr>
          `).join('')}
        </table>

        <h4 style="font-size: 14px; margin: 10px 0;">Углеродные единицы</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #795548; color: white;">
            <th style="border: 1px solid #000; padding: 6px; text-align: left;">Год</th>
            <th style="border: 1px solid #000; padding: 6px; text-align: left;">УЕ за год (т CO₂)</th>
            <th style="border: 1px solid #000; padding: 6px; text-align: left;">Накопленные УЕ (т CO₂)</th>
          </tr>
          ${keyYears.map(year => `
            <tr>
              <td style="border: 1px solid #000; padding: 6px;">${year}</td>
              <td style="border: 1px solid #000; padding: 6px;">${formatNumberGOST(results.carbonUnits[year])}</td>
              <td style="border: 1px solid #000; padding: 6px;">${formatNumberGOST(results.carbonUnits.slice(0, year + 1).reduce((a, b) => a + b, 0))}</td>
            </tr>
          `).join('')}
        </table>
      </div>

      <!-- Заключение -->
      <div>
        <h3 style="font-size: 16px; background: #f0f0f0; padding: 5px; margin-bottom: 10px;">4. ЗАКЛЮЧЕНИЕ</h3>
        <p>Настоящий отчет содержит расчет экономической эффективности лесного климатического проекта.</p>
        <p><strong>Порода деревьев:</strong> ${inputs.treeType}</p>
        <p><strong>Площадь проекта:</strong> ${inputs.areaHa} га</p>
        <p><strong>Срок реализации:</strong> ${inputs.projectYears} лет</p>
        
        <p><strong>Ключевые финансовые показатели:</strong></p>
        <ul>
          <li>Чистая приведенная стоимость (NPV): ${formatNumberGOST(results.financials.npv)} руб.</li>
          <li>Внутренняя норма доходности (IRR): ${results.financials.irr}</li>
          <li>Срок окупаемости: ${results.financials.simplePayback} лет</li>
          <li>Себестоимость углеродной единицы: ${formatNumberGOST(results.financials.cuCost)} руб./т</li>
        </ul>
        
        <p>Отчет составлен в соответствии с методикой расчета лесных климатических проектов.</p>
        <p style="font-style: italic; font-size: 10px; margin-top: 20px;">
          Отчет сгенерирован автоматически. Данные носят информационный характер.
        </p>
      </div>
    </div>
  `;
}

async function addChartToPDF(pdf, chartRef, title, x, y, width, height) {
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
      
      // Добавляем заголовок
      pdf.setFontSize(12);
      pdf.text(title, x + width / 2, y - 5, { align: 'center' });
      
      // Добавляем изображение графика
      pdf.addImage(imageData, 'PNG', x, y, width, height);
      
      return true;
    }
  } catch (error) {
    console.error('Error adding chart to PDF:', error);
  }
  return false;
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
