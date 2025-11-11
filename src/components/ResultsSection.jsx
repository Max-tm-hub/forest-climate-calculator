import React from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

export default function ResultsSection({ results, inputs }) {
  if (!results) return null;

  const years = Array.from({ length: inputs.projectYears + 1 }, (_, i) => i.toString());

  const carbonData = {
    labels: years,
    datasets: [{ label: 'УЕ (т)', data: results.carbonUnits, borderColor: '#1976d2', backgroundColor: 'rgba(25, 118, 210, 0.2)', tension: 0.4, fill: true }]
  };

  const cashFlowData = {
    labels: years,
    datasets: [
      { label: 'Чистый ДП (₽)', data: results.cashFlows, type: 'bar', backgroundColor: 'rgba(239, 83, 80, 0.6)' },
      { label: 'Дисконтированный ДП (₽)', data: results.discountedCashFlows, type: 'line', borderColor: '#388e3c', backgroundColor: 'transparent', fill: false }
    ]
  };

  const options = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } };

  const metrics = Object.entries(results.financials).map(([key, value]) => (
    <div key={key} style={{ border: '1px solid #e0e0e0', padding: '12px', borderRadius: '6px', textAlign: 'center', backgroundColor: '#f9f9f9' }}>
      <div style={{ fontSize: '0.85em', opacity: 0.7 }}>{key === 'npv' ? 'NPV' : key === 'irr' ? 'IRR' : key === 'cuCost' ? 'Себестоимость УЕ' : key}</div>
      <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{value}</div>
    </div>
  ));

  return (
    <div style={{ marginTop: '30px' }}>
      <h3>Результаты расчёта</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {metrics}
      </div>

      <h4 style={{ marginTop: '30px' }}>Графики</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', height: '400px' }}>
        <div>
          <h5>Количество углеродных единиц по годам</h5>
          <Line data={carbonData} options={options} />
        </div>
        <div>
          <h5>Денежные потоки</h5>
          <Bar data={cashFlowData} options={options} />
        </div>
      </div>
    </div>
  );
}