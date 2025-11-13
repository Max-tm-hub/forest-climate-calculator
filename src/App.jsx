// App.jsx
import React, { useState, useRef } from 'react';
import CalculatorForm from './components/CalculatorForm';
import ResultsSection from './components/ResultsSection';
import ExportButtons from './components/ExportButtons';
import ProjectManager from './components/ProjectManager';
import SensitivityAnalysis from './components/SensitivityAnalysis';
import ScenarioComparison from './components/ScenarioComparison';
import { calculateProject } from './utils/calculator';
import { saveProject } from './utils/projectStorage';
import { projectTemplates } from './data/projectTemplates';

function App() {
  const [inputs, setInputs] = useState(projectTemplates.boreal);
  const [results, setResults] = useState(null);
  const [chartRefs, setChartRefs] = useState({});
  const [activeTab, setActiveTab] = useState('calculator'); // 'calculator', 'sensitivity', 'comparison'

  const handleInputChange = (name, value) => {
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const res = calculateProject(inputs);
      setResults(res);
      setActiveTab('calculator'); // Переключаем на вкладку с результатами
    } catch (err) {
      alert('Ошибка расчёта: ' + err.message);
    }
  };

  const handleChartsReady = (refs) => {
    setChartRefs(refs);
  };

  const handleLoadProject = (projectData) => {
    setInputs(projectData);
    setResults(null); // Сбрасываем результаты при загрузке нового проекта
  };

  const handleSaveProject = (projectData) => {
    const saved = saveProject(projectData);
    if (saved) {
      alert('Проект успешно сохранен!');
    } else {
      alert('Ошибка при сохранении проекта');
    }
  };

  const tabs = [
    { id: 'calculator', label: 'Калькулятор', icon: '🧮' },
    { id: 'sensitivity', label: 'Анализ чувствительности', icon: '📈' },
    { id: 'comparison', label: 'Сравнение сценариев', icon: '⚖️' }
  ];

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#2e7d32', marginBottom: '10px' }}>🌱 Калькулятор лесных климатических проектов</h1>
        <p style={{ color: '#666', fontSize: '16px' }}>Расчёт поглощения CO₂ и экономической эффективности лесного проекта</p>
      </header>

      {/* Менеджер проектов */}
      <ProjectManager 
        onLoadProject={handleLoadProject}
        currentProject={inputs}
        onSaveCurrent={handleSaveProject}
      />

      {/* Навигация по вкладкам */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '2px solid #e9ecef',
        marginBottom: '20px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 24px',
              backgroundColor: activeTab === tab.id ? '#2e7d32' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#666',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #2e7d32' : 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'all 0.3s'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Содержимое вкладок */}
      <div>
        {activeTab === 'calculator' && (
          <>
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
          </>
        )}

        {activeTab === 'sensitivity' && (
          <SensitivityAnalysis 
            inputs={inputs}
            results={results}
          />
        )}

        {activeTab === 'comparison' && (
          <ScenarioComparison 
            baseInputs={inputs}
            baseResults={results}
          />
        )}
      </div>

      {/* Информационная панель */}
      {!results && activeTab === 'calculator' && (
        <div style={{
          backgroundColor: '#e3f2fd',
          padding: '20px',
          borderRadius: '8px',
          marginTop: '20px',
          border: '1px solid #90caf9'
        }}>
          <h4 style={{ color: '#1565c0', margin: '0 0 10px 0' }}>💡 Советы по использованию:</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#1976d2' }}>
            <li>Используйте шаблоны для быстрого старта</li>
            <li>Сохраняйте проекты для последующего сравнения</li>
            <li>Анализируйте чувствительность к ключевым параметрам</li>
            <li>Сравнивайте разные сценарии в соответствующем разделе</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
