// src/components/ResultsSection.jsx
import React, { useRef } from 'react';
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
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

export default function ResultsSection({ results, inputs }) {
  if (!results || !inputs) return null;

  const years = Array.from({ length: inputs.projectYears + 1 }, (_, i) => i);
  const yearLabels = years.map(y => y % 5 === 0 ? y.toString() : '');

  // ✅ График УЕ — СТРОГО с data: [...]
  const carbonData = {
    labels: years.map(String),
    datasets: [{
      label: 'Углеродные единицы, т',
       results.carbonUnits, // ← обязательный массив чисел
      borderColor: '#1976d2',
      backgroundColor: 'rgba(25, 118, 210, 0.1)',
      stepped: 'before',
      fill: true,
      tension: 0
    }]
  };

  // ✅ График ДП — СТРОГО с data: [...]
  const cumulativeCashFlow = results.cashFlows.reduce((arr, cf, i) => {
    arr[i] = (arr[i - 1] || 0) + cf;
    return arr;
  }, []);

  const cashFlowData = {
    labels: years.map(String),
    datasets: [
      {
        type: 'bar',
        label: 'Чистый ДП',
         results.cashFlows, // ← массив чисел
        backgroundColor: ctx => ctx.parsed.y >= 0 ? 'rgba(76, 175, 80, 0.7)' : 'rgba(244, 67, 54, 0.7)',
        borderColor: ctx => ctx.parsed.y >= 0 ? 'rgba(76, 175, 80, 1)' : 'rgba(244, 67, 54, 1)',
        borderWidth: 1
      },
      {
        type: 'line',
        label: 'Накопленный ДП',
         cumulativeCashFlow, // ← массив чисел
        borderColor: '#673ab7',
        backgroundColor: 'transparent',
        borderWidth: 2,
        fill: false,
        tension: 0.2
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: function(ctx) {
            const value = ctx.parsed.y;
            const unit = ctx.dataset.label.includes('единиц') ? 'т' : '₽';
            return `${ctx.dataset.label}: ${value.toLocaleString()} ${unit}`;
          }
        }
      }
    },
    scales: {
      x: { ticks: { callback: (_, i) => yearLabels[i] } }
    }
  };

  return (
    <div style={{ marginTop: '30px' }}>
      <h3>Результаты расчёта</h3>
      
      {/* Сводка */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {Object.entries(results.financials).map(([key, value]) => (
          <div key={key} style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
            <strong>{key === 'npv' ? 'NPV' : key}</strong><br />
            {value}
          </div>
        ))}
      </div>

      {/* Графики */}
      <h4>Динамика углеродных единиц</h4>
      <div style={{ height: '350px' }}>
        <Line data={carbonData} options={options} />
      </div>

      <h4 style={{ marginTop: '30px' }}>Денежные потоки</h4>
      <div style={{ height: '400px' }}>
        <Bar data={cashFlowData} options={options} />
      </div>
    </div>
  );
}
