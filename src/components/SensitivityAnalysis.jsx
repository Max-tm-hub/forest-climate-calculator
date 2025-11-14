import React, { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  LineElement, 
  PointElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { calculateSensitivityAnalysis, SENSITIVITY_PARAMETERS, calculateBreakEvenAnalysis } from '../utils/sensitivityAnalysis';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  LineElement, 
  PointElement, 
  Title, 
  Tooltip, 
  Legend
);

export default function SensitivityAnalysis({ inputs, results }) {
  const [selectedParameter, setSelectedParameter] = useState('carbonUnitPrice');
  const [showBreakEven, setShowBreakEven] = useState(false);

  const sensitivityData = useMemo(() => {
    if (!inputs) return null;
    return calculateSensitivityAnalysis(inputs, selectedParameter);
  }, [inputs, selectedParameter]);

  const breakEvenData = useMemo(() => {
    if (!inputs || !results) return null;
    return calculateBreakEvenAnalysis(inputs);
  }, [inputs, results]);

  const chartData = showBreakEven ? breakEvenData?.fullAnalysis : sensitivityData;

  const chartConfig = {
    labels: chartData?.map(item => 
      showBreakEven ? `${item.value} руб` : `${item.percentChange}%`
    ) || [],
    datasets: [
      {
        label: 'NPV (руб)',
        data: chartData?.map(item => item.npv / 1000000) || [],
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        tension: 0.3,
        fill: true,
        yAxisID: 'y',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(2) + ' млн руб';
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: showBreakEven ? 'Цена УЕ (руб/т)' : 'Изменение параметра (%)'
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'NPV (млн руб)'
        }
      }
    }
  };

  if (!inputs || !results) {
    return (
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        textAlign: 'center',
        color: '#666'
      }}>
        Выполните расчет для анализа чувствительности
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: 'white', 
      padding: '20px', 
      borderRadius: '8px',
      marginBottom: '20px',
      border: '1px solid #e9ecef'
    }}>
      <h3 style={{ color: '#2e7d32', marginBottom: '20px' }}>Анализ чувствительности</h3>
      
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <select
          value={selectedParameter}
          onChange={(e) => setSelectedParameter(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            minWidth: '200px'
          }}
        >
          {Object.entries(SENSITIVITY_PARAMETERS).map(([key, param]) => (
            <option key={key} value={key}>{param.label}</option>
          ))}
        </select>

        <button
          onClick={() => setShowBreakEven(!showBreakEven)}
          style={{
            padding: '8px 16px',
            backgroundColor: showBreakEven ? '#ff9800' : '#795548',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showBreakEven ? '📊 Анализ чувствительности' : '⚖️ Точка безубыточности'}
        </button>
      </div>

      {showBreakEven && breakEvenData && (
        <div style={{
          backgroundColor: '#fff3e0',
          padding: '15px',
          borderRadius: '6px',
          marginBottom: '20px',
          border: '1px solid #ffb74d'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#e65100' }}>
            Анализ точки безубыточности
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            <div>
              <strong>Текущий NPV:</strong> {(breakEvenData.currentNpv / 1000000).toFixed(2)} млн руб
            </div>
            <div>
              <strong>Текущая цена УЕ:</strong> {inputs.carbonUnitPrice} руб/т
            </div>
            {breakEvenData.breakEvenPoint && (
              <div>
                <strong>Точка безубыточности:</strong> {breakEvenData.breakEvenPoint.value} руб/т
              </div>
            )}
          </div>
        </div>
      )}

      {chartData && (
        <div style={{ height: '400px' }}>
          <Line data={chartConfig} options={chartOptions} />
        </div>
      )}

      {sensitivityData && !showBreakEven && (
        <div style={{ marginTop: '20px' }}>
          <h4 style={{ color: '#1976d2', marginBottom: '10px' }}>Результаты анализа:</h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '10px',
            fontSize: '14px'
          }}>
            <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <strong>Макс. NPV:</strong> {Math.max(...sensitivityData.map(d => d.npv)).toLocaleString('ru-RU')} руб
            </div>
            <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <strong>Мин. NPV:</strong> {Math.min(...sensitivityData.map(d => d.npv)).toLocaleString('ru-RU')} руб
            </div>
            <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <strong>Волатильность:</strong> {((Math.max(...sensitivityData.map(d => d.npv)) - Math.min(...sensitivityData.map(d => d.npv))) / Math.abs(results.financials.npv) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
