import React, { useState, useMemo } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement, 
  PointElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { calculateProject } from '../utils/calculator';
import { projectTemplates } from '../data/projectTemplates';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement, 
  PointElement, 
  Title, 
  Tooltip, 
  Legend
);

export default function ScenarioComparison({ baseInputs, baseResults }) {
  const [selectedScenarios, setSelectedScenarios] = useState(['boreal', 'mixed', 'deciduous']);
  const [comparisonType, setComparisonType] = useState('financial'); // 'financial' or 'carbon'

  const scenarios = useMemo(() => {
    return selectedScenarios.map(key => {
      const template = projectTemplates[key];
      if (!template) return null;
      
      try {
        const results = calculateProject(template);
        return {
          key,
          name: template.name,
          inputs: template,
          results
        };
      } catch (error) {
        console.error(`Error calculating scenario ${key}:`, error);
        return null;
      }
    }).filter(Boolean);
  }, [selectedScenarios]);

  const financialChartData = {
    labels: scenarios.map(s => s.name),
    datasets: [
      {
        label: 'NPV (млн руб)',
        data: scenarios.map(s => s.results.financials.npv / 1000000),
        backgroundColor: 'rgba(76, 175, 80, 0.7)',
        yAxisID: 'y',
      },
      {
        label: 'IRR (%)',
        data: scenarios.map(s => parseFloat(s.results.financials.irr.replace('%', '')) || 0),
        backgroundColor: 'rgba(33, 150, 243, 0.7)',
        yAxisID: 'y1',
        type: 'line',
        borderColor: 'rgba(33, 150, 243, 1)',
        borderWidth: 2,
        fill: false
      }
    ]
  };

  const carbonChartData = {
    labels: scenarios.map(s => s.name),
    datasets: [
      {
        label: 'Общие УЕ (тыс. т)',
        data: scenarios.map(s => s.results.carbonUnits.reduce((a, b) => a + b, 0) / 1000),
        backgroundColor: 'rgba(46, 125, 50, 0.7)',
      },
      {
        label: 'Себестоимость УЕ (руб/т)',
        data: scenarios.map(s => s.results.financials.cuCost),
        backgroundColor: 'rgba(255, 152, 0, 0.7)',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: comparisonType === 'financial' ? 'NPV (млн руб)' : 'УЕ (тыс. т)'
        }
      },
      y1: {
        type: 'linear',
        display: comparisonType === 'financial',
        position: 'right',
        title: {
          display: true,
          text: 'IRR (%)'
        },
        grid: {
          drawOnChartArea: false,
        },
      }
    }
  };

  const allTemplates = Object.entries(projectTemplates);

  return (
    <div style={{ 
      backgroundColor: 'white', 
      padding: '20px', 
      borderRadius: '8px',
      marginBottom: '20px',
      border: '1px solid #e9ecef'
    }}>
      <h3 style={{ color: '#2e7d32', marginBottom: '20px' }}>Сравнение сценариев</h3>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Выберите сценарии:
          </label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {allTemplates.map(([key, template]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input
                  type="checkbox"
                  checked={selectedScenarios.includes(key)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedScenarios(prev => [...prev, key]);
                    } else {
                      setSelectedScenarios(prev => prev.filter(k => k !== key));
                    }
                  }}
                />
                {template.name}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Тип сравнения:
          </label>
          <select
            value={comparisonType}
            onChange={(e) => setComparisonType(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          >
            <option value="financial">Финансовые показатели</option>
            <option value="carbon">Углеродные единицы</option>
          </select>
        </div>
      </div>

      {scenarios.length > 0 ? (
        <>
          <div style={{ height: '400px', marginBottom: '20px' }}>
            {comparisonType === 'financial' ? (
              <Bar data={financialChartData} options={chartOptions} />
            ) : (
              <Bar data={carbonChartData} options={chartOptions} />
            )}
          </div>

          <div>
            <h4 style={{ color: '#1976d2', marginBottom: '15px' }}>Детализация сценариев:</h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '15px' 
            }}>
              {scenarios.map(scenario => (
                <div 
                  key={scenario.key}
                  style={{
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    border: '1px solid #dee2e6'
                  }}
                >
                  <h5 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>
                    {scenario.name}
                  </h5>
                  <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                    <div><strong>NPV:</strong> {(scenario.results.financials.npv / 1000000).toFixed(2)} млн руб</div>
                    <div><strong>IRR:</strong> {scenario.results.financials.irr}</div>
                    <div><strong>Окупаемость:</strong> {scenario.results.financials.discountedPayback} лет</div>
                    <div><strong>Общие УЕ:</strong> {(scenario.results.carbonUnits.reduce((a, b) => a + b, 0) / 1000).toFixed(1)} тыс. т</div>
                    <div><strong>Себестоимость УЕ:</strong> {scenario.results.financials.cuCost.toLocaleString('ru-RU')} руб/т</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#666',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px'
        }}>
          Выберите хотя бы один сценарий для сравнения
        </div>
      )}
    </div>
  );
}