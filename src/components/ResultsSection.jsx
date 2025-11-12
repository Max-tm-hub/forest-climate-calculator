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

  // Оптимизация: показываем только ключевые годы
  const getOptimizedYears = () => {
    const totalYears = inputs.projectYears + 1;
    
    if (totalYears <= 20) {
      // Для коротких проектов показываем все годы
      return Array.from({ length: totalYears }, (_, i) => i);
    } else if (totalYears <= 50) {
      // Для средних проектов - каждый 2-5 год
      const step = Math.max(2, Math.floor(totalYears / 15));
      return Array.from({ length: totalYears }, (_, i) => i)
        .filter((_, i) => i % step === 0 || i === 0 || i === totalYears - 1);
    } else {
      // Для длинных проектов - ключевые точки + начало/конец
      const keyPoints = [0, 1, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80];
      return keyPoints.filter(year => year <= inputs.projectYears)
        .concat(inputs.projectYears)
        .filter((year, index, array) => array.indexOf(year) === index) // Уникальные значения
        .sort((a, b) => a - b);
    }
  };

  const optimizedYears = getOptimizedYears();
  
  // Данные для графика углеродных единиц
  const carbonData = {
    labels: optimizedYears.map(y => y.toString()),
    datasets: [{
      label: 'Накопленные УЕ (т CO₂)',
      data: optimizedYears.map(i => {
        // Рассчитываем накопленные УЕ до этого года
        return results.carbonUnits.slice(0, i + 1).reduce((sum, value) => sum + value, 0);
      }),
      borderColor: '#2e7d32',
      backgroundColor: 'rgba(46, 125, 50, 0.1)',
      tension: 0.3,
      fill: true,
      pointBackgroundColor: '#2e7d32',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 3,
      borderWidth: 2
    }]
  };

  // Данные для графика денежных потоков (в тыс. рублей)
  const cashFlowData = {
    labels: optimizedYears.map(y => y.toString()),
    datasets: [
      {
        label: 'Чистый ДП (тыс. ₽)',
        data: optimizedYears.map(i => results.cashFlows[i] / 1000),
        backgroundColor: 'rgba(25, 118, 210, 0.7)',
        order: 2,
        barPercentage: 0.6,
        categoryPercentage: 0.8
      },
      {
        label: 'Дисконтированный ДП (тыс. ₽)',
        data: optimizedYears.map(i => results.discountedCashFlows[i] / 1000),
        borderColor: '#d32f2f',
        backgroundColor: 'transparent',
        type: 'line',
        order: 1,
        borderWidth: 2,
        pointBackgroundColor: '#d32f2f',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        pointRadius: 3,
        tension: 0.1
      }
    ]
  };

  // Компактные настройки графиков
  const compactChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 10,
          font: {
            size: 11
          },
          boxWidth: 12
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 8,
        titleFont: {
          size: 11
        },
        bodyFont: {
          size: 11
        },
        displayColors: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('ru-RU').format(context.parsed.y.toFixed(0));
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
          text: 'Год проекта',
          font: {
            size: 11,
            weight: 'bold'
          },
          padding: { top: 5, bottom: 5 }
        },
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          font: {
            size: 10
          },
          padding: 2
        }
      },
      y: {
        title: {
          display: true,
          text: 'Тыс. рублей / Тонны CO₂',
          font: {
            size: 11,
            weight: 'bold'
          },
          padding: { top: 5, bottom: 5 }
        },
        beginAtZero: true,
        ticks: {
          font: {
            size: 10
          },
          padding: 2,
          callback: function(value) {
            return new Intl.NumberFormat('ru-RU').format(value);
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    elements: {
      point: {
        hoverRadius: 5
      }
    }
  };

  const metrics = [
    { key: 'npv', label: 'NPV', value: `${results.financials.npv.toLocaleString('ru-RU')} ₽` },
    { key: 'irr', label: 'IRR', value: results.financials.irr },
    { key: 'simplePayback', label: 'Срок окупаемости', value: `${results.financials.simplePayback} лет` },
    { key: 'discountedPayback', label: 'Диск. срок окупаемости', value: `${results.financials.discountedPayback} лет` },
    { key: 'cuCost', label: 'Себестоимость УЕ', value: `${results.financials.cuCost.toLocaleString('ru-RU')} ₽/т` },
    { key: 'roi', label: 'ROI', value: results.financials.roi },
    { key: 'profitabilityIndex', label: 'Индекс доходности', value: results.financials.profitabilityIndex }
  ];

  return (
    <div style={{ marginTop: '20px' }}>
      <h3 style={{ color: '#2e7d32', marginBottom: '15px', fontSize: '1.3em' }}>Результаты расчёта</h3>
      
      {/* Компактная сетка показателей */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: '10px', 
        marginBottom: '20px' 
      }}>
        {metrics.map(({ key, label, value }) => (
          <div key={key} style={{ 
            border: '1px solid #e0e0e0', 
            padding: '12px', 
            borderRadius: '6px', 
            textAlign: 'center', 
            backgroundColor: '#f8f9fa',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '0.8em', opacity: 0.7, marginBottom: '6px', fontWeight: '500' }}>{label}</div>
            <div style={{ fontWeight: 'bold', fontSize: '0.95em', color: '#1976d2' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Компактные графики */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr', 
        gap: '20px', 
        marginBottom: '20px'
      }}>
        
        {/* График денежных потоков */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '15px', 
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          height: '350px'
        }}>
          <h5 style={{ 
            textAlign: 'center', 
            marginBottom: '12px', 
            color: '#1976d2',
            fontSize: '1em',
            fontWeight: '600'
          }}>
            Денежные потоки (тыс. рублей)
          </h5>
          <Bar data={cashFlowData} options={compactChartOptions} />
        </div>

        {/* График углеродных единиц */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '15px', 
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          height: '350px'
        }}>
          <h5 style={{ 
            textAlign: 'center', 
            marginBottom: '12px', 
            color: '#2e7d32',
            fontSize: '1em',
            fontWeight: '600'
          }}>
            Накопленные углеродные единицы
          </h5>
          <Line data={carbonData} options={compactChartOptions} />
        </div>
      </div>

      {/* Информация о данных */}
      <div style={{
        fontSize: '0.8em',
        color: '#666',
        textAlign: 'center',
        padding: '10px',
        borderTop: '1px solid #e0e0e0',
        marginTop: '10px'
      }}>
        Показаны ключевые точки данных для лучшей читаемости. Полные данные доступны в экспорте Excel.
        {optimizedYears.length < inputs.projectYears + 1 && (
          <span> Отображено {optimizedYears.length} из {inputs.projectYears + 1} лет.</span>
        )}
      </div>
    </div>
  );
}
