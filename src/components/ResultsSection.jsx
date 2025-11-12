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
  Legend 
} from 'chart.js';

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

export default function ResultsSection({ results, inputs }) {
  if (!results) return null;

  // Уменьшаем количество отображаемых лет для читаемости
  const step = Math.max(1, Math.floor(inputs.projectYears / 20));
  const years = Array.from({ length: inputs.projectYears + 1 }, (_, i) => i);
  const filteredYears = years.filter((_, i) => i % step === 0 || i === 0 || i === inputs.projectYears);
  
  const carbonData = {
    labels: filteredYears.map(y => y.toString()),
    datasets: [{
      label: 'УЕ (т CO₂)',
      data: filteredYears.map(i => results.carbonUnits[i]),
      borderColor: '#2e7d32',
      backgroundColor: 'rgba(46, 125, 50, 0.1)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#2e7d32',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4
    }]
  };

  const cashFlowData = {
    labels: filteredYears.map(y => y.toString()),
    datasets: [
      {
        label: 'Чистый ДП (тыс. ₽)',
        data: filteredYears.map(i => results.cashFlows[i] / 1000),
        backgroundColor: 'rgba(25, 118, 210, 0.7)',
        order: 2
      },
      {
        label: 'Дисконтированный ДП (тыс. ₽)',
        data: filteredYears.map(i => results.discountedCashFlows[i] / 1000),
        borderColor: '#d32f2f',
        backgroundColor: 'transparent',
        type: 'line',
        order: 1,
        borderWidth: 3,
        pointBackgroundColor: '#d32f2f',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        font: {
          size: 14
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 12
        },
        bodyFont: {
          size: 12
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Год проекта',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        grid: {
          display: false
        }
      },
      y: {
        title: {
          display: true,
          text: 'Значение',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        beginAtZero: true
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  const metrics = [
    { key: 'npv', label: 'NPV', value: `${results.financials.npv.toLocaleString('ru-RU')} ₽` },
    { key: 'irr', label: 'IRR', value: results.financials.irr },
    { key: 'simplePayback', label: 'Срок окупаемости (лет)', value: results.financials.simplePayback },
    { key: 'discountedPayback', label: 'Диск. срок окупаемости (лет)', value: results.financials.discountedPayback },
    { key: 'cuCost', label: 'Себестоимость УЕ', value: `${results.financials.cuCost.toLocaleString('ru-RU')} ₽/т` },
    { key: 'roi', label: 'ROI', value: results.financials.roi },
    { key: 'profitabilityIndex', label: 'Индекс доходности', value: results.financials.profitabilityIndex }
  ];

  return (
    <div style={{ marginTop: '30px' }}>
      <h3 style={{ color: '#2e7d32', marginBottom: '20px' }}>Результаты расчёта</h3>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '12px', 
        marginBottom: '30px' 
      }}>
        {metrics.map(({ key, label, value }) => (
          <div key={key} style={{ 
            border: '1px solid #e0e0e0', 
            padding: '16px', 
            borderRadius: '8px', 
            textAlign: 'center', 
            backgroundColor: '#f8f9fa',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '0.85em', opacity: 0.7, marginBottom: '8px' }}>{label}</div>
            <div style={{ fontWeight: 'bold', fontSize: '1.1em', color: '#1976d2' }}>{value}</div>
          </div>
        ))}
      </div>

      <h4 style={{ marginBottom: '20px', color: '#455a64' }}>Графики проекта</h4>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '30px', 
        height: '450px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h5 style={{ textAlign: 'center', marginBottom: '15px', color: '#2e7d32' }}>
            Накопленные углеродные единицы
          </h5>
          <Line data={carbonData} options={chartOptions} />
        </div>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h5 style={{ textAlign: 'center', marginBottom: '15px', color: '#1976d2' }}>
            Денежные потоки (тыс. рублей)
          </h5>
          <Bar data={cashFlowData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
