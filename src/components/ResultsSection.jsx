// src/components/ResultsSection.jsx
import React, { useRef } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, /* ... */ } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
ChartJS.register(/* ... */, zoomPlugin);

export default function ResultsSection({ resultsByScenario, inputs }) {
  const years = Array.from({ length: inputs.projectYears + 1 }, (_, i) => i);
  const yearLabels = years.map(y => y % 5 === 0 ? y : '');

  // График УЕ (step-line)
  const carbonData = {
    labels: years.map(String),
    datasets: [{
      label: 'УЕ (т)',
       resultsByScenario.base.carbonUnits,
      borderColor: '#1976d2',
      stepped: 'before',
      fill: true
    }]
  };

  // Сравнение NPV
  const npvData = {
    labels: ['Пессимистичный', 'Базовый', 'Оптимистичный'],
    datasets: [{ label: 'NPV, ₽', data: [
      resultsByScenario.pessimistic.npv,
      resultsByScenario.base.npv,
      resultsByScenario.optimistic.npv
    ], backgroundColor: ['#f44336', '#2196f3', '#4caf50'] }]
  };

  const options = {
    responsive: true,
    plugins: { legend: { position: 'top' }, zoom: { zoom: { wheel: { enabled: true } }, pan: { enabled: true } } },
    scales: { x: { ticks: { callback: (_, i) => yearLabels[i] } } }
  };

  return (
    <div>
      <h3>Результаты расчёта</h3>

      {/* Сводка */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        <Metric label="NPV (баз.)" value={`${resultsByScenario.base.financials.npv.toLocaleString()} ₽`} />
        <Metric label="IRR (баз.)" value={resultsByScenario.base.financials.irr} />
        <Metric label="Себестоимость УЕ" value={`${resultsByScenario.base.financials.cuCost} ₽/т`} />
      </div>

      {/* Графики */}
      <h4>Динамика углеродных единиц</h4>
      <div style={{ height: '350px' }}>
        <Line data={carbonData} options={options} />
      </div>

      <h4 style={{ marginTop: '30px' }}>Сравнение сценариев (NPV)</h4>
      <div style={{ height: '300px' }}>
        <Bar data={npvData} options={{ ...options, indexAxis: 'y' }} />
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div style={{ border: '1px solid #eee', padding: '12px', textAlign: 'center' }}>
      <div><strong>{label}</strong></div>
      <div>{value}</div>
    </div>
  );
}
