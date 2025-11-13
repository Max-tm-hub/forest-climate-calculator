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

// Функция для создания HTML контента для Word с альбомными страницами для графиков
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
    /* Сброс стандартных отступов Word */
    body { 
      font-family: 'Times New Roman', serif; 
      font-size: 12pt; 
      margin: 0;
      padding: 0;
    }
    /* Настройка области печати - стандартные поля Word для книжной ориентации */
    @page {
      margin: 2cm 1.5cm 2cm 2cm;
      size: portrait;
    }
    /* Альбомная ориентация для страниц с графиками */
    .landscape-page {
      page: landscape;
      margin: 1.5cm;
    }
    h1 { 
      color: #2e7d32; 
      text-align: center; 
      font-size: 16pt; 
      margin-top: 0;
      margin-bottom: 10pt;
    }
    h2 { 
      color: #1976d2; 
      font-size: 14pt; 
      margin-top: 20pt; 
      margin-bottom: 10pt;
    }
    h3 { 
      color: #d32f2f; 
      font-size: 13pt; 
      margin-top: 15pt; 
      margin-bottom: 8pt;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 10pt 0;
      table-layout: fixed;
    }
    th, td { 
      border: 1pt solid #000; 
      padding: 4pt; 
      text-align: left;
      word-wrap: break-word;
      font-size: 10pt;
    }
    th { 
      background-color: #f2f2f2; 
      font-weight: bold; 
    }
    .header { 
      text-align: center; 
      margin-bottom: 30pt; 
    }
    .section { 
      margin-bottom: 20pt; 
    }
    .charts-section {
      page-break-before: always;
    }
    .chart-container { 
      text-align: center; 
      margin: 15pt 0;
      page-break-inside: avoid;
    }
    .chart-title { 
      font-weight: bold; 
      margin-bottom: 8pt; 
      font-size: 11pt;
    }
    .chart-image {
      max-width: 90%;
      height: auto;
      border: 1pt solid #ddd;
    }
    .landscape-chart {
      max-width: 95%;
      max-height: 18cm;
    }
    /* Узкие колонки для таблиц */
    .col-year { width: 8%; }
    .col-number { width: 20%; }
    .col-medium { width: 30%; }
    .col-large { width: 42%; }
    /* Разделитель страниц */
    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>
  <!-- СТРАНИЦА 1: ТИТУЛЬНЫЙ ЛИСТ И ОСНОВНЫЕ ДАННЫЕ -->
  <div class="header">
    <h1>МИНИСТЕРСТВО ПРИРОДНЫХ РЕСУРСОВ И ЭКОЛОГИИ РОССИЙСКОЙ ФЕДЕРАЦИИ</h1>
    <h2>ОТЧЁТ О РАСЧЁТЕ ЭФФЕКТИВНОСТИ ЛЕСНОГО КЛИМАТИЧЕСКОГО ПРОЕКТА</h2>
    <p><strong>Дата формирования:</strong> ${getCurrentDate()}</p>
  </div>

  <div class="section">
    <h2>1. ПАРАМЕТРЫ ПРОЕКТА</h2>
    <table>
      <colgroup>
        <col class="col-large">
        <col class="col-medium">
      </colgroup>
      <tr>
        <th>Параметр</th>
        <th>Значение</th>
      </tr>
      <tr>
        <td>Порода деревьев</td>
        <td>${safeText(inputs.treeType)}</td>
      </tr>
      <tr>
        <td>Площадь проекта</td>
        <td>${inputs.areaHa} га</td>
      </tr>
      <tr>
        <td>Срок реализации</td>
        <td>${inputs.projectYears} лет</td>
      </tr>
      <tr>
        <td>Ставка дисконтирования</td>
        <td>${(inputs.discountRate * 100).toFixed(1)}%</td>
      </tr>
      <tr>
        <td>Уровень инфляции</td>
        <td>${(inputs.inflation * 100).toFixed(1)}%</td>
      </tr>
      <tr>
        <td>Цена углеродной единицы</td>
        <td>${formatNumber(inputs.carbonUnitPrice)} руб/т</td>
      </tr>
      <tr>
        <td>Цена древесины</td>
        <td>${formatNumber(inputs.timberPrice)} руб/м³</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <h2>2. ФИНАНСОВЫЕ ПОКАЗАТЕЛИ</h2>
    <table>
      <colgroup>
        <col class="col-large">
        <col class="col-medium">
      </colgroup>
      <tr>
        <th>Показатель</th>
        <th>Значение</th>
      </tr>
      <tr>
        <td>NPV (чистая приведенная стоимость)</td>
        <td>${formatNumber(results.financials.npv)} руб</td>
      </tr>
      <tr>
        <td>IRR (внутренняя норма доходности)</td>
        <td>${safeText(results.financials.irr)}</td>
      </tr>
      <tr>
        <td>Срок окупаемости (простой)</td>
        <td>${safeText(results.financials.simplePayback)} лет</td>
      </tr>
      <tr>
        <td>Срок окупаемости (дисконтированный)</td>
        <td>${safeText(results.financials.discountedPayback)} лет</td>
      </tr>
      <tr>
        <td>Себестоимость углеродной единицы</td>
        <td>${formatNumber(results.financials.cuCost)} руб/т</td>
      </tr>
      <tr>
        <td>ROI (рентабельность инвестиций)</td>
        <td>${safeText(results.financials.roi)}</td>
      </tr>
      <tr>
        <td>Индекс доходности</td>
        <td>${safeText(results.financials.profitabilityIndex)}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <h2>3. СВОДНЫЕ ДАННЫЕ ПО ГОДАМ</h2>
    <table>
      <colgroup>
        <col class="col-year">
        <col class="col-number">
        <col class="col-number">
        <col class="col-number">
      </colgroup>
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

  <!-- СТРАНИЦА 2: ГРАФИК ДЕНЕЖНЫХ ПОТОКОВ (АЛЬБОМНАЯ) -->
  ${chartImages.cashFlowChart ? `
  <div class="charts-section landscape-page">
    <h2>4. ГРАФИЧЕСКАЯ ВИЗУАЛИЗАЦИЯ</h2>
    
    <div class="chart-container">
      <div class="chart-title">Динамика денежных потоков</div>
      <img src="${chartImages.cashFlowChart}" alt="График денежных потоков" class="chart-image landscape-chart" />
      <p><em>Денежные потоки показаны в миллионах рублей</em></p>
    </div>
  </div>
  ` : ''}

  <!-- СТРАНИЦА 3: ГРАФИК УГЛЕРОДНЫХ ЕДИНИЦ (АЛЬБОМНАЯ) -->
  ${chartImages.carbonChart ? `
  <div class="charts-section landscape-page">
    <div class="chart-container">
      <div class="chart-title">Динамика накопленных углеродных единиц</div>
      <img src="${chartImages.carbonChart}" alt="График углеродных единиц" class="chart-image landscape-chart" />
      <p><em>Углеродные единицы показаны в тысячах тонн CO₂</em></p>
    </div>
  </div>
  ` : ''}

  <!-- СТРАНИЦА 4: ВЫВОДЫ И РЕКОМЕНДАЦИИ (КНИЖНАЯ) -->
  <div class="page-break">
    <div class="section">
      <h2>5. ВЫВОДЫ И РЕКОМЕНДАЦИИ</h2>
      ${generateConclusion(results, inputs)}
    </div>
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

// Улучшенная функция для конвертации графика в base64 с увеличенным разрешением
function chartToBase64(chartRef) {
  if (!chartRef || !chartRef.canvas) {
    console.error('Chart reference or canvas is missing');
    return null;
  }
  
  try {
    const canvas = chartRef.canvas;
    
    // Проверяем, что canvas имеет содержимое
    if (canvas.width === 0 || canvas.height === 0) {
      console.error('Canvas has zero dimensions:', {
        width: canvas.width,
        height: canvas.height
      });
      return null;
    }

    console.log('Converting chart with dimensions:', {
      width: canvas.width,
      height: canvas.height
    });
    
    // Создаем временный canvas с увеличенным разрешением для лучшего качества
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    const scale = 2; // Увеличиваем разрешение в 2 раза
    tempCanvas.width = canvas.width * scale;
    tempCanvas.height = canvas.height * scale;
    
    // Настраиваем сглаживание для лучшего качества
    tempCtx.scale(scale, scale);
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';
    
    // Копируем содержимое с белым фоном
    tempCtx.fillStyle = '#FFFFFF';
    tempCtx.fillRect(0, 0, canvas.width, canvas.height);
    tempCtx.drawImage(canvas, 0, 0);
    
    const dataUrl = tempCanvas.toDataURL('image/png', 1.0);
    console.log('Chart converted to base64 successfully, size:', dataUrl.length);
    return dataUrl;
    
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
      hasCarbonChart: !!chartRefs.carbonChart,
      cashFlowCanvas: chartRefs.cashFlowChart?.canvas,
      carbonCanvas: chartRefs.carbonChart?.canvas
    });

    // Даем время на полную отрисовку графиков
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Конвертируем графики в base64
    const chartImages = {};
    
    if (chartRefs.cashFlowChart) {
      console.log('Converting cash flow chart...');
      chartImages.cashFlowChart = chartToBase64(chartRefs.cashFlowChart);
      console.log('Cash flow chart converted:', !!chartImages.cashFlowChart);
    } else {
      console.error('Cash flow chart reference is missing');
    }
    
    if (chartRefs.carbonChart) {
      console.log('Converting carbon chart...');
      chartImages.carbonChart = chartToBase64(chartRefs.carbonChart);
      console.log('Carbon chart converted:', !!chartImages.carbonChart);
    } else {
      console.error('Carbon chart reference is missing');
    }

    // Генерируем HTML контент
    const htmlContent = generateWordHTML(results, inputs, chartImages);

    // Создаем Blob с HTML контентом
    const blob = new Blob(['\uFEFF' + htmlContent], { 
      type: 'application/msword;charset=utf-8'
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
