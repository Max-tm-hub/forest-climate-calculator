// exportToWord.js
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
    /* Основные стили - БЕЗ полей, Word добавит свои */
    body { 
      font-family: 'Times New Roman', serif; 
      font-size: 12pt; 
      margin: 0;
      padding: 0;
      line-height: 1.2;
      width: 100%;
    }
    h1 { 
      color: #2e7d32; 
      text-align: center; 
      font-size: 16pt; 
      margin-top: 0;
      margin-bottom: 20pt;
    }
    h2 { 
      color: #1976d2; 
      font-size: 14pt; 
      margin-top: 25pt; 
      margin-bottom: 12pt;
      border-bottom: 1pt solid #1976d2;
      padding-bottom: 4pt;
    }
    h3 { 
      color: #d32f2f; 
      font-size: 13pt; 
      margin-top: 20pt; 
      margin-bottom: 10pt;
    }
    table { 
      width: 90%; 
      border-collapse: collapse; 
      margin: 12pt auto;
      table-layout: fixed;
    }
    th, td { 
      border: 1pt solid #000; 
      padding: 5pt; 
      text-align: left;
      word-wrap: break-word;
      font-size: 10pt;
      vertical-align: top;
    }
    th { 
      background-color: #f2f2f2; 
      font-weight: bold; 
    }
    .header { 
      text-align: center; 
      margin-bottom: 30pt; 
      border-bottom: 2pt solid #2e7d32;
      padding-bottom: 15pt;
    }
    .section { 
      margin-bottom: 25pt; 
      width: 90%;
      margin-left: auto;
      margin-right: auto;
    }
    .chart-section {
      margin: 30pt 0;
      page-break-inside: avoid;
      width: 90%;
      margin-left: auto;
      margin-right: auto;
    }
    .chart-container { 
      text-align: center; 
      margin: 20pt auto;
      width: 100%;
    }
    .chart-title { 
      font-weight: bold; 
      margin-bottom: 15pt; 
      font-size: 13pt;
      text-align: center;
      color: #2e7d32;
    }
    .chart-image {
      max-width: 75%;
      max-height: 11cm;
      border: 1pt solid #ddd;
      display: block;
      margin: 0 auto;
      page-break-inside: avoid;
    }
    .chart-description {
      text-align: center;
      font-style: italic;
      margin-top: 10pt;
      font-size: 11pt;
      color: #666;
    }
    /* Узкие колонки для таблиц */
    .col-year { width: 12%; }
    .col-number { width: 22%; }
    .col-medium { width: 30%; }
    .col-large { width: 36%; }
    /* Разделитель страниц */
    .page-break {
      page-break-before: always;
      margin-top: 0;
      padding-top: 0;
    }
    .clearfix {
      clear: both;
    }
    ul {
      margin: 10pt 0;
      padding-left: 20pt;
    }
    li {
      margin-bottom: 5pt;
    }
    /* Контейнер для центрирования контента */
    .content-wrapper {
      width: 90%;
      margin: 0 auto;
    }
    .institution-name {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 10pt;
      line-height: 1.3;
    }
    .program-name {
      font-size: 13pt;
      font-style: italic;
      margin-bottom: 15pt;
      color: #2e7d32;
    }
  </style>
</head>
<body>

<div class="content-wrapper">

  <!-- СТРАНИЦА 1: ТИТУЛЬНЫЙ ЛИСТ И ОСНОВНЫЕ ДАННЫЕ -->
  <div class="header">
    <div class="institution-name">
      Федеральное государственное бюджетное образовательное учреждение высшего образования 
      «Санкт-Петербургский государственный университет» (СПбГУ)
    </div>
    <div class="program-name">
      ПИШ «Междисциплинарные исследования, технологии и бизнес-процессы для минерально-сырьевого комплекса России»
    </div>
    <h2>ОТЧЁТ О РАСЧЁТЕ ЭФФЕКТИВНОСТИ ЛЕСНОГО КЛИМАТИЧЕСКОГО ПРОЕКТА</h2>
    <p style="font-size: 13pt; margin-top: 15pt;"><strong>Дата формирования:</strong> ${getCurrentDate()}</p>
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
        <td>${inputs.discountRate}%</td> <!-- Исправлено: убрано умножение на 100 -->
      </tr>
      <tr>
        <td>Уровень инфляции</td>
        <td>${inputs.inflation}%</td> <!-- Исправлено: убрано умножение на 100 -->
      </tr>
      <tr>
        <td>Цена углеродной единицы</td>
        <td>${formatNumber(inputs.carbonUnitPrice)} руб/т</td>
      </tr>
      <tr>
        <td>Цена древесины</td>
        <td>${formatNumber(inputs.timberPrice)} руб/м³</td>
      </tr>
      <tr>
        <td>Налог на прибыль</td>
        <td>${inputs.profitTaxRate}%</td> <!-- Исправлено: убрано умножение на 100 -->
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

</div>

  <!-- РАЗДЕЛИТЕЛЬ СТРАНИЦ -->
  <div class="page-break"></div>

<div class="content-wrapper">

  <!-- СТРАНИЦА 2: ГРАФИКИ -->
  <div class="section">
    <h2>4. ГРАФИЧЕСКАЯ ВИЗУАЛИЗАЦИЯ</h2>
    
    ${chartImages.cashFlowChart ? `
    <div class="chart-section">
      <div class="chart-container">
        <div class="chart-title">ДИНАМИКА ДЕНЕЖНЫХ ПОТОКОВ</div>
        <img src="${chartImages.cashFlowChart}" alt="График денежных потоков" class="chart-image" />
        <div class="chart-description">Денежные потоки показаны в миллионах рублей</div>
      </div>
    </div>
    ` : '<p>График денежных потоков недоступен</p>'}

    ${chartImages.carbonChart ? `
    <div class="chart-section">
      <div class="chart-container">
        <div class="chart-title">ДИНАМИКА НАКОПЛЕННЫХ УГЛЕРОДНЫХ ЕДИНИЦ</div>
        <img src="${chartImages.carbonChart}" alt="График углеродных единиц" class="chart-image" />
        <div class="chart-description">Углеродные единицы показаны в тысячах тонн CO₂</div>
      </div
