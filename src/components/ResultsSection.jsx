[file name]: ResultsSection.jsx
[file content begin]
import React, { useRef, useEffect } from 'react';
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

export default function ResultsSection({ results, inputs, onChartsReady }) {
  const cashFlowChartRef = useRef();
  const carbonChartRef = useRef();

  useEffect(() => {
    if (results && onChartsReady && cashFlowChartRef.current && carbonChartRef.current) {
      onChartsReady({
        cashFlowChart: cashFlowChartRef.current,
        carbonChart: carbonChartRef.current
      });
    }
  }, [onChartsReady, results]);

  if (!results) return null;

  const getOptimizedYears = () => {
    const totalYears = inputs.projectYears + 1;
    
    if (totalYears <= 20) {
      return Array.from({ length: totalYears }, (_, i) => i);
    } else {
      const keyPoints = [0, 1, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80];
      return keyPoints.filter(year => year <= inputs.projectYears)
        .concat(inputs.projectYears)
        .filter((year, index, array) => array.indexOf(year) === index)
        .sort((a, b) => a - b);
    }
  };

  const optimizedYears = getOptimizedYears();

  const normalizeData = (data, divisor = 1000) => {
    return data.map(value => value / divisor);
  };

  const getYAxisBounds = (data) => {
    const values = data.filter(val => val !== null && val !== undefined);
    if (values.length === 0) return { min: 0, max: 100 };
    
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    
    const range = maxVal - minVal;
    const padding = range * 0.3;
    
    return {
      min: minVal - padding,
      max: maxVal + padding
    };
  };

  const carbonDataValues = optimizedYears.map(i => {
    return results.carbonUnits.slice(0, i + 1).reduce((sum, value) => sum + value, 0) / 1000;
  });

  const carbonData = {
    labels: optimizedYears.map(y => y.toString()),
    datasets: [{
      label: 'Накопленные УЕ (тыс. т CO₂)',
      data: carbonDataValues,
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

  const cashFlowValues = normalizeData(optimizedYears.map(i => results.cashFlows[i]), 1000000);
  const discountedFlowValues = normalizeData(optimizedYears.map(i => results.discountedCashFlows[i]), 1000000);

  const cashFlowData = {
    labels: optimizedYears.map(y => y.toString()),
    datasets: [
      {
        label: 'Чистый ДП (млн ₽)',
        data: cashFlowValues,
        backgroundColor: 'rgba(25, 118, 210, 0.7)',
        order: 2,
        barPercentage: 0.6,
        categoryPercentage: 0.8
      },
      {
        label: 'Дисконтированный ДП (млн ₽)',
        data: discountedFlowValues,
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

  const cashFlowBounds = getYAxisBounds([...cashFlowValues, ...discountedFlowValues]);
  const carbonBounds = getYAxisBounds(carbonDataValues);

  const cashFlowChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 8,
          font: {
            size: 11
          },
          boxWidth: 10
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 6,
        titleFont: {
          size: 10
        },
        bodyFont: {
          size: 10
        },
        displayColors: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(2) + ' млн ₽';
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
          }
        },
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          font: {
            size: 9
          }
        }
      },
      y: {
        title: {
          display: true,
          text: 'Млн рублей',
          font: {
            size: 11,
            weight: 'bold'
          }
        },
        min: cashFlowBounds.min,
        max: cashFlowBounds.max,
        ticks: {
          font: {
            size: 9
          },
          callback: function(value) {
            return value.toFixed(1) + 'M';
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
    }
  };

  const carbonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 8,
          font: {
            size: 11
          },
          boxWidth: 10
        }
      },
      tooltip: {
        mode: 'nearest',
        intersect: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 6,
        titleFont: {
          size: 10
        },
        bodyFont: {
          size: 10
        },
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(1) + ' тыс. т';
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
          }
        },
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          font: {
            size: 9
          }
        }
      },
      y: {
        title: {
          display: true,
          text: 'Тыс. тонн CO₂',
          font: {
            size: 11,
            weight: 'bold'
          }
        },
        min: carbonBounds.min,
        max: carbonBounds.max,
        ticks: {
          font: {
            size: 9
          },
          callback: function(value) {
            return value.toFixed(0) + 'K';
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  };

  const metrics = [
    { key: 'npv', label: 'NPV', value: `${(results.financials.npv / 1000000).toFixed(1)} млн ₽` },
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
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
        gap: '8px', 
        marginBottom: '20px' 
      }}>
        {metrics.map(({ key, label, value }) => (
          <div key={key} style={{ 
            border: '1px solid #e0e0e0', 
            padding: '10px 8px', 
            borderRadius: '6px', 
            textAlign: 'center', 
            backgroundColor: '#f8f9fa',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '0.75em', opacity: 0.7, marginBottom: '4px', fontWeight: '500' }}>{label}</div>
            <div style={{ fontWeight: 'bold', fontSize: '0.85em', color: '#1976d2' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: '15px', 
        marginBottom: '15px'
      }}>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '12px', 
          borderRadius: '6px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          height: '400px'
        }}>
          <h5 style={{ 
            textAlign: 'center', 
            margin: '0 0 10px 0', 
            color: '#1976d2',
            fontSize: '0.9em',
            fontWeight: '600'
          }}>
            Денежные потоки
          </h5>
          <div ref={cashFlowChartRef} style={{ height: '350px' }}>
            <Bar data={cashFlowData} options={cashFlowChartOptions} />
          </div>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '12px', 
          borderRadius: '6px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          height: '400px'
        }}>
          <h5 style={{ 
            textAlign: 'center', 
            margin: '0 0 10px 0', 
            color: '#2e7d32',
            fontSize: '0.9em',
            fontWeight: '600'
          }}>
            Накопленные углеродные единицы
          </h5>
          <div ref={carbonChartRef} style={{ height: '350px' }}>
            <Line data={carbonData} options={carbonChartOptions} />
          </div>
        </div>
      </div>

      <div style={{
        fontSize: '0.7em',
        color: '#666',
        textAlign: 'center',
        padding: '8px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        border: '1px solid #e9ecef'
      }}>
        💡 <strong>Данные нормализованы для лучшего отображения:</strong><br/>
        Денежные потоки показаны в миллионах рублей, углеродные единицы - в тысячах тонн
      </div>
    </div>
  );
}
[file content end]
