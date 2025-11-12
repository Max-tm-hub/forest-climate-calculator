import React, { useState, useRef } from 'react';
import CalculatorForm from './components/CalculatorForm';
import ResultsSection from './components/ResultsSection';
import ExportButtons from './components/ExportButtons';
import { calculateProject } from './utils/calculator';

function App() {
  const [inputs, setInputs] = useState({
    treeType: 'Смешанный лес',
    areaHa: 500,
    projectYears: 80,
    discountRate: 0.23,
    inflation: 0.025,
    landPrice: 500000,
    prepPerHa: 20000,
    seedlingsPerHa: 1300,
    seedlingCost: 120,
    plantingCostPerHa: 10000,
    pestsInitialPerHa: 8000,
    equipmentPerHa: 20000,
    designVerification: 600000,
    weedingCostPerHa: 5000,
    weedingFreq: 2,
    pruningCostPerHa: 1000,
    pruningFreq: 1,
    thinningCostPerHa: 120000,
    carbonUnitPrice: 1100,
    timberPrice: 1900,
    timberVolumePerHa: 200,
    timberHarvestCost: 50,
    transportCostPerKm: 10,
    transportDistance: 50,
    profitTaxRate: 0.25
  });

  const [results, setResults] = useState(null);
  const [chartRefs, setChartRefs] = useState({});

  const handleInputChange = (name, value) => {
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const res = calculateProject(inputs);
      setResults(res);
    } catch (err) {
      alert('Ошибка расчёта: ' + err.message);
    }
  };

  const handleChartsReady = (refs) => {
    setChartRefs(refs);
  };

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#2e7d32', marginBottom: '10px' }}>🌱 Калькулятор лесных климатических проектов</h1>
        <p style={{ color: '#666', fontSize: '16px' }}>Расчёт поглощения CO₂ и экономической эффективности лесного проекта</p>
      </header>

      <CalculatorForm 
        inputs={inputs} 
        onInputChange={handleInputChange} 
        onSubmit={handleSubmit} 
      />
      
      {results && (
        <>
          <ResultsSection 
            results={results} 
            inputs={inputs} 
            onChartsReady={handleChartsReady}
          />
          <ExportButtons 
            results={results}
            inputs={inputs}
            chartRefs={chartRefs}
          />
        </>
      )}
    </div>
  );
}

export default App;
