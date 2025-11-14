import React, { useRef, useEffect, useCallback } from 'react';
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
  const cashFlowChartRef = useRef(null);
  const carbonChartRef = useRef(null);
  const cumulativeChartRef = useRef(null);
  const chartsReadyRef = useRef(false);

  // Стабильная функция для уведомления о готовности графиков
  const notifyChartsReady = useCallback(() => {
    if (results && onChartsReady && cashFlowChartRef.current && carbonChartRef.current && cumulativeChartRef.current && !chartsReadyRef.current) {
      console.log('All charts are ready, notifying parent...');
      
      chartsReadyRef.current = true;
      
      setTimeout(() => {
        onChartsReady({
          cashFlowChart: cashFlowChartRef.current,
          carbonChart: carbonChartRef.current,
          cumulativeChart: cumulativeChartRef.current
        });
      }, 1500);
    }
  }, [onChartsReady, results]);

  useEffect(() => {
    if (results) {
      chartsReadyRef.current = false;
    }
  }, [results]);

  useEffect(() => {
    if (cashFlowChartRef.current && carbonChartRef.current && cumulativeChartRef.current) {
      const cashFlowCanvas = cashFlowChartRef.current.canvas;
      const carbonCanvas = carbonChartRef.current.canvas;
      const cumulativeCanvas = cumulativeChartRef.current.canvas;
      
      if (cashFlowCanvas && carbonCanvas && cumulativeCanvas && 
          cashFlowCanvas.width > 0 && carbonCanvas.width > 0 && cumulativeCanvas.width > 0) {
        notifyChartsReady();
      }
    }
  }, [notifyChartsReady]);

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

  // График накопленных углеродных единиц
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

  // График денежных потоков (годовые значения) - ТОЛЬКО ЧИСТЫЙ ДП
  const cashFlowValues = normalizeData(optimizedYears.map(i => results.cashFlows[i]), 1000000);

  const cashFlowData = {
    labels: optimizedYears.map(y => y.toString()),
    datasets: [
      {
        label: 'Чистый денежный поток (млн ₽)',
        data: cashFlowValues,
        backgroundColor: 'rgba(25, 118, 210, 0.7)',
        barPercentage: 0.6,
        categoryPercentage: 0.8
      }
    ]
  };

  // График нарастающего итога дисконтированных денежных потоков
  const cumulativeDiscountedValues = normalizeData(optimizedYears.map(i => 
    results.cumulativeDiscountedCashFlows ? results.cumulativeDiscountedCashFlows[i] : 0
  ), 1000000);

  const cumulativeData = {
    labels: optimizedYears.map(y => y.toString()),
    datasets: [{
      label: 'Нарастающий итог ДДП (млн ₽)',
      data: cumulativeDiscountedValues,
      borderColor: '#ff9800',
      backgroundColor: 'rgba(255, 152, 0, 0.1)',
      tension: 0.3,
      fill: true,
      pointBackgroundColor: '#ff9800',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 3,
      borderWidth: 2
    }]
  };

  const cashFlowBounds = getYAxisBounds(cashFlowValues);
  const carbonBounds = getYAxisBounds(carbonDataValues);
  const cumulativeBounds = getYAxisBounds(cumulativeDiscountedValues);

  const cashFlowChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 12,
          font: {
            size: 14,
            weight: 'bold'
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
          size: 12
        },
        bodyFont: {
          size: 12
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
            size: 13,
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
            size: 11,
            weight: 'bold'
          }
        }
      },
      y: {
        title: {
          display: true,
          text: 'Млн рублей',
          font: {
            size: 13,
            weight: 'bold'
          }
        },
        min: cashFlowBounds.min,
        max: cashFlowBounds.max,
        ticks: {
          font: {
            size: 11,
            weight: 'bold'
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
          padding: 12,
          font: {
            size: 14,
            weight: 'bold'
          },
          boxWidth: 12
        }
      },
      tooltip: {
        mode: 'nearest',
        intersect: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 8,
        titleFont: {
          size: 12
        },
        bodyFont: {
          size: 12
        },
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(3) + ' тыс. т';
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
            size: 13,
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
            size: 11,
            weight: 'bold'
          }
        }
      },
      y: {
        title: {
          display: true,
          text: 'Тыс. тонн CO₂',
          font: {
            size: 13,
            weight: 'bold'
          }
        },
        min: carbonBounds.min,
        max: carbonBounds.max,
        ticks: {
          font: {
            size: 11,
            weight: 'bold'
          },
          callback: function(value) {
            return value.toFixed(3) + 'K';
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  };

  const cumulativeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 12,
          font: {
            size: 14,
            weight: 'bold'
          },
          boxWidth: 12
        }
      },
      tooltip: {
        mode: 'nearest',
        intersect: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 8,
        titleFont: {
          size: 12
        },
        bodyFont: {
          size: 12
        },
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
            size: 13,
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
            size: 11,
            weight: 'bold'
          }
        }
      },
      y: {
        title: {
          display: true,
          text: 'Млн рублей',
          font: {
            size: 13,
            weight: 'bold'
          }
        },
        min: cumulativeBounds.min,
        max: cumulativeBounds.max,
        ticks: {
          font: {
            size: 11,
            weight: 'bold'
          },
          callback: function(value) {
            return value.toFixed(1) + 'M';
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
    { key: 'profitabilityIndex', label: 'Индекс доходности', value: results.financials.profitabilityIndex },
    { key: 'totalInvestment', label: 'Общие инвестиции', value: `${(results.financials.totalInvestment / 1000000).toFixed(1)} млн ₽` }
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
            Денежные потоки (годовые)
          </h5>
          <div style={{ height: '350px' }}>
            <Bar 
              ref={cashFlowChartRef}
              data={cashFlowData} 
              options={cashFlowChartOptions} 
              redraw={false}
            />
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
            color: '#ff9800',
            fontSize: '0.9em',
            fontWeight: '600'
          }}>
            Нарастающий итог дисконтированных денежных потоков
          </h5>
          <div style={{ height: '350px' }}>
            <Line 
              ref={cumulativeChartRef}
              data={cumulativeData} 
              options={cumulativeChartOptions} 
              redraw={false}
            />
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
          <div style={{ height: '350px' }}>
            <Line 
              ref={carbonChartRef}
              data={carbonData} 
              options={carbonChartOptions} 
              redraw={false}
            />
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
