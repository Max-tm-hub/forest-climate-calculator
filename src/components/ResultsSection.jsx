// src/components/ResultsSection.jsx
import React from 'react';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ResultsSection({ results, inputs }) {
  if (!results || !inputs) {
    return <div>Результаты ещё не рассчитаны</div>;
  }

  const years = Array.from({ length: inputs.projectYears + 1 }, (_, i) => i);
  const yearLabels = years.map(y => (y % 5 === 0 ? String(y) : ''));

  // ✅ 1. График УЕ — ОБЯЗАТЕЛЬНО: data: [...]
  const carbonData = {
    labels: years.map(String),
    datasets: [
      {
        label: 'Углеродные единицы, т',
        data: results.carbonUnits, // ✅ ← ИМЯ СВОЙСТВА ОБЯЗАТЕЛЬНО
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        stepped: 'before',
        fill: true,
        tension: 0,
      },
    ],
  };

  // ✅ 2. Накопленный ДП
  const cumulativeCashFlow = results.cashFlows.reduce((arr, cf, i) => {
    arr[i] = (arr[i - 1] || 0) + cf;
    return arr;
  }, []);

  // ✅ 3. График ДП
  const cashFlowData = {
    labels: years.map(String),
    datasets: [
      {
        type: 'bar',
        label: 'Чистый ДП',
        data: results.cashFlows, // ✅ ← ИМЯ СВОЙСТВА ОБЯЗАТЕЛЬНО
        backgroundColor: (ctx) => (ctx.parsed.y >= 0 ? 'rgba(76, 175, 80, 0.7)' : 'rgba(244, 67, 54, 0.7)'),
        borderColor: (ctx) => (ctx.parsed.y >= 0 ? 'rgba(76, 175, 80, 1)' : 'rgba(244, 67, 54, 1)'),
        borderWidth: 1,
      },
      {
        type: 'line',
        label: 'Накопленный ДП',
        data: cumulativeCashFlow, // ✅ ← ИМЯ СВОЙСТВА ОБЯЗАТЕЛЬНО
        borderColor: '#673ab7',
        backgroundColor: 'transparent',
        borderWidth: 2,
        fill: false,
        tension: 0.2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: function (ctx) {
            const value = ctx.parsed.y;
            const unit = ctx.dataset.label.includes('единиц') ? 'т' : '₽';
            return `${ctx.dataset.label}: ${value.toLocaleString()} ${unit}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          callback: (_, i) => yearLabels[i],
        },
      },
    },
  };

  return (
    <div style={{ marginTop: '30px' }}>
      <h3>Результаты расчёта</h3>

      {/* Сводка */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        {results.financials &&
          Object.entries(results.financials).map(([key, value]) => (
            <div
              key={key}
              style={{
                padding: '10px',
                border: '1px solid #ddd',
                textAlign: 'center',
              }}
            >
              <strong>
                {key === 'npv'
                  ? 'NPV'
                  : key === 'irr'
                  ? 'IRR'
                  : key === 'cuCost'
                  ? 'Себестоимость УЕ'
                  : key === 'simplePayback'
                  ? 'Срок окупаемости'
                  : key === 'discountedPayback'
                  ? 'Диск. срок окупаемости'
                  : key}
              </strong>
              <br />
              {value}
            </div>
          ))}
      </div>

      {/* Графики */}
      <h4>Динамика углеродных единиц</h4>
      <div style={{ height: '350px' }}>
        <Line data={carbonData} options={options} />
      </div>

      <h4 style={{ marginTop: '20px' }}>Денежные потоки</h4>
      <div style={{ height: '400px' }}>
        <Bar data={cashFlowData} options={options} />
      </div>
    </div>
  );
}
