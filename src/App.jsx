// src/App.jsx
import React, { useState } from 'react';
import { calculateProject } from './utils/calculator';
import { exportGostReport } from './utils/exportToPdf';
import ResultsSection from './components/ResultsSection';

const SCENARIOS = {
  pessimistic: { co2Factor: 0.8, carbonPrice: 800, timberPrice: 1500, inflation: 0.04, discountRate: 0.28 },
  base: { co2Factor: 1.0, carbonPrice: 1100, timberPrice: 1900, inflation: 0.025, discountRate: 0.23 },
  optimistic: { co2Factor: 1.2, carbonPrice: 1500, timberPrice: 2300, inflation: 0.015, discountRate: 0.18 }
};

export default function App() {
  const [inputs, setInputs] = useState({
    treeType: 'Смешанный лес',
    areaHa: 500,
    projectYears: 40
  });

  const [resultsByScenario, setResults] = useState(null);

  const handleCalculate = () => {
    const results = {};
    for (const [key, params] of Object.entries(SCENARIOS)) {
      const res = calculateProject({
        ...inputs,
        carbonUnitPrice: params.carbonPrice,
        timberPrice: params.timberPrice,
        inflation: params.inflation,
        discountRate: params.discountRate
        // co2Factor можно ввести в calculator.js при необходимости
      });
      results[key] = res;
    }
    setResults(results);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🌱 Калькулятор лесных климатических проектов</h1>

      <div style={{ marginBottom: '20px' }}>
        <label>Порода: </label>
        <select value={inputs.treeType} onChange={e => setInputs({...inputs, treeType: e.target.value})}>
          {['Смешанный лес', 'Лиственница', 'Сосна', 'Пихта Дугласа', 'Пихта', 'Ель', 'Дуб', 'Бук'].map(t => 
            <option key={t} value={t}>{t}</option>
          )}
        </select>
        <label> Площадь (га): </label>
        <input type="number" value={inputs.areaHa} onChange={e => setInputs({...inputs, areaHa: +e.target.value})} />
        <label> Срок (лет): </label>
        <input type="number" value={inputs.projectYears} onChange={e => setInputs({...inputs, projectYears: +e.target.value})} min="1" max="80" />
        <button onClick={handleCalculate} style={{ marginLeft: '10px', padding: '6px 12px', backgroundColor: '#1976d2', color: 'white' }}>
          Рассчитать
        </button>
      </div>

      {resultsByScenario && (
        <>
          <ResultsSection resultsByScenario={resultsByScenario} inputs={inputs} />
          <button onClick={() => exportGostReport(resultsByScenario, inputs)} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#607d8b', color: 'white' }}>
            📄 Скачать отчёт по ГОСТ
          </button>
        </>
      )}
    </div>
  );
}
