import { saveAs } from 'file-saver';

// Функция для безопасного текста
function safeText(text) {
  if (text === null || text === undefined) return '';
  return String(text);
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

// Функция для создания HTML контента для Word
function generateWordHTML(results, inputs, chartImages = {}) {
  const keyYears = [0, 1, 5, 10, 20, 30, 50, inputs.projectYears].filter(y => y <= inputs.projectYears);
  
  return `
<html xmlns:o='urn:schemas-microsoft-com:office:office' 
      xmlns:w='urn:schemas-microsoft-com:office:word' 
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="UTF-8">
  <title>Отчет по лесному климатическому проекту</title>
  <style>
    body { font-family: 'Times New Roman', serif; font-size: 12pt; margin: 2cm; }
    h1 { color: #2e7d32; text-align: center; font-size: 16pt; }
    h2 { color: #1976d2; font-size: 14pt; margin-top: 20pt; }
    h3 { color: #d32f2f; font-size: 13pt; margin-top: 15pt; }
    table { width: 100%; border-collapse: collapse; margin: 10pt 0; }
    th, td { border: 1pt solid #000; padding: 6pt; text-align: left; }
    th { background-color: #f2f2f2; font-weight: bold; }
    .header { text-align: center; margin-bottom: 30pt; }
    .section { margin-bottom: 20pt; }
    .chart-container { text-align: center; margin: 15pt 0; }
    .chart-title { font-weight: bold; margin-bottom: 8pt; }
  </style>
</head>
<body>
  <div class="header">
    <h1>МИНИСТЕРСТВО ПРИРОДНЫХ РЕСУРСОВ И ЭКОЛОГИИ РОССИЙСКОЙ ФЕДЕРАЦИИ</h1>
    <h2>ОТЧЁТ О РАСЧЁТЕ ЭФФЕКТИВНОСТИ ЛЕСНОГО КЛИМАТИЧЕСКОГО ПРОЕКТА</h2>
    <p>Дата формирования: ${getCurrentDate()}</p>
  </div>

  <div class="section">
    <h2>1. ПАРАМЕТРЫ ПРОЕКТА</h2>
    <table>
      <tr><th width="70%">Параметр</th><th width="30%">Значение</th></tr>
      <tr><td>Порода деревьев</td><td>${safeText(inputs.treeType)}</td></tr>
      <tr><td>Площадь проекта</td><td>${inputs.areaHa} га</td></tr>
      <tr><td>Срок реализации</td><td>${inputs.projectYears} лет</td></tr>
      <tr><td>Ставка дисконтирования</td><td>${(inputs.discountRate * 100).toFixed(1)}%</td></tr>
      <tr><td>Уровень инфляции</td><td>${(inputs.inflation * 100).toFixed(1)}%</td></tr>
      <tr><td>Цена углеродной единицы</td><td>${formatNumber(inputs.carbonUnitPrice)} руб/т</td></tr>
      <tr><td>Цена древесины</td><td>${formatNumber(inputs.timberPrice)} руб/м³</td></tr>
    </table>
  </div>

  <div class="section">
    <h2>2. ФИНАНСОВЫЕ ПОКАЗАТЕЛИ</h2>
    <table>
      <tr><th width="70%">Показатель</th><th width="30%">Значение</th></tr>
      <tr><td>NPV (чистая приведенная стоимость)</td><td>${formatNumber(results.financials.npv)} руб</td></tr>
      <tr><td>IRR (внутренняя норма доходности)</td><td>${safeText(results.financials.irr)}</td></tr>
      <tr><td>Срок окупаемости (простой)</td><td>${safeText(results.financials.simplePayback)} лет</td></tr>
      <tr><td>Срок окупаемости (дисконтированный)</td><td>${safeText(results.financials.discountedPayback)} лет</td></tr>
      <tr><td>Себестоимость углеродной единицы</td><td>${formatNumber(results.financials.cuCost)} руб/т</td></tr>
      <tr><td>ROI (рентабельность инвестиций)</td><td>${safeText(results.financials.roi)}</td></tr>
      <tr><td>Индекс доходности</td><td>${safeText(results.financials.profitabilityIndex)}</td></tr>
    </table>
  </div>

  <div class="section">
    <h2>3. СВОДНЫЕ ДАННЫЕ ПО ГОДАМ</h2>
    <table>
      <tr>
        <th>Год</th>
        <th>УЕ (т CO₂)</th>
        <th>Денежный поток (тыс. руб)</th>
        <th>Дисконтированный ДП (тыс. руб)</th>
      </tr>
      ${keyYears.map(year => `
        <tr>
          <td>${year}</td>
          <td>${formatNumber(results.carbonUnits[year])}</td>
          <td>${formatNumber(results.cashFlows[year] / 1000)}</td>
          <td>${formatNumber(results.discountedCashFlows[year] / 1000)}</td>
        </tr>
      `).join('')}
    </table>
  </div>

  ${chartImages.cashFlowChart ? `
  <div class="section">
    <h2>4. ГРАФИЧЕСКАЯ ВИЗУАЛИЗАЦИЯ</h2>
    
    <div class="chart-container">
      <div class="chart-title">Динамика денежных потоков</div>
      <img src="${chartImages.cashFlowChart}" alt="График денежных потоков" style="max-width: 100%; height: auto;" />
      <p><em>Денежные потоки показаны в миллионах рублей</em></p>
    </div>

    ${chartImages.carbonChart ? `
    <div class="chart-container">
      <div class="chart-title">Динамика накопленных углеродных единиц</div>
      <img src="${chartImages.carbonChart}" alt="График углеродных единиц" style="max-width: 100%; height: auto;" />
      <p><em>Углеродные единицы показаны в тысячах тонн CO₂</em></p>
    </div>
    ` : ''}
  </div>
  ` : ''}

  <div class="section">
    <h2>5. ВЫВОДЫ И РЕКОМЕНДАЦИИ</h2>
    ${generateConclusion(results, inputs)}
  </div>

</body>
</html>
  `;
}

// Функция для генерации выводов
function generateConclusion(results, inputs) {
  const npv = results.financials.npv;
  const irr = results.financials.irr;
  const cuCost = results.financials.cuCost;
  
  let conclusion = '<p>';
  
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
  
  conclusion += '</p><p><strong>Рекомендации:</strong></p>';
  conclusion += '<ul>';
  conclusion += '<li>Мониторинг рыночных цен на углеродные единицы</li>';
  conclusion += '<li>Оптимизация операционных затрат</li>';
  conclusion += '<li>Рассмотреть возможность получения государственной поддержки</li>';
  conclusion += '<li>Диверсификация источников дохода</li>';
  conclusion += '<li>Страхование климатических рисков</li>';
  conclusion += '</ul>';
  
  return conclusion;
}

// Функция для конвертации графика в base64
function chartToBase64(chartRef) {
  if (!chartRef || !chartRef.canvas) return null;
  
  try {
    const canvas = chartRef.canvas;
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error converting chart to base64:', error);
    return null;
  }
}

// Основная функция экспорта
export async function exportToWord(results, inputs, chartRefs = {}) {
  try {
    console.log('Starting Word export...', {
      hasCashFlowChart: !!chartRefs.cashFlowChart,
      hasCarbonChart: !!chartRefs.carbonChart
    });

    // Конвертируем графики в base64
    const chartImages = {};
    
    if (chartRefs.cashFlowChart) {
      chartImages.cashFlowChart = chartToBase64(chartRefs.cashFlowChart);
    }
    
    if (chartRefs.carbonChart) {
      chartImages.carbonChart = chartToBase64(chartRefs.carbonChart);
    }

    // Генерируем HTML контент
    const htmlContent = generateWordHTML(results, inputs, chartImages);

    // Создаем Blob с HTML контентом
    const blob = new Blob([htmlContent], { 
      type: 'application/msword' 
    });

    // Сохраняем файл
    const fileName = `Отчет_ЛКП_${inputs.treeType}_${inputs.areaHa}га_${getCurrentDate().replace(/\./g, '-')}.doc`;
    saveAs(blob, fileName);
    
    console.log('Word export completed successfully');

  } catch (error) {
    console.error('Word export error:', error);
    alert('Ошибка при создании Word документа: ' + error.message);
  }
}