import React from 'react';
import { exportToExcel } from '../utils/exportToExcel';
import { exportToWord } from '../utils/exportToWord';

export default function ExportButtons({ results, inputs, chartRefs }) {
  const handleExportExcel = () => {
    if (results) {
      exportToExcel(results, inputs);
    } else {
      alert('Сначала выполните расчет');
    }
  };

  const handleExportWord = async () => {
    if (!results) {
      alert('Сначала выполните расчет');
      return;
    }

    // Проверяем наличие ссылок на графики
    if (!chartRefs.cashFlowChart || !chartRefs.carbonChart) {
      alert('Графики еще не готовы. Подождите несколько секунд после расчета и попробуйте снова.');
      return;
    }

    // Дополнительная проверка, что canvas графиков действительно отрисованы
    const cashFlowCanvas = chartRefs.cashFlowChart.canvas;
    const carbonCanvas = chartRefs.carbonChart.canvas;
    
    if (!cashFlowCanvas || !carbonCanvas) {
      alert('Графики не инициализированы. Перезагрузите страницу и попробуйте снова.');
      return;
    }

    console.log('Canvas dimensions:', {
      cashFlow: { width: cashFlowCanvas.width, height: cashFlowCanvas.height },
      carbon: { width: carbonCanvas.width, height: carbonCanvas.height }
    });

    if (cashFlowCanvas.width === 0 || carbonCanvas.width === 0) {
      alert('Графики еще не отрисованы. Подождите немного и попробуйте снова.');
      return;
    }

    console.log('Starting Word export with verified chart refs');

    try {
      await exportToWord(results, inputs, chartRefs);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Ошибка при экспорте: ' + error.message);
    }
  };

  return (
    <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      <button 
        onClick={handleExportExcel}
        style={{ 
          padding: '12px 24px', 
          backgroundColor: '#4CAF50', 
          color: 'white', 
          border: 'none', 
          borderRadius: '6px', 
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      >
        📊 Экспорт в Excel
      </button>
      <button 
        onClick={handleExportWord}
        style={{ 
          padding: '12px 24px', 
          backgroundColor: '#2196F3', 
          color: 'white', 
          border: 'none', 
          borderRadius: '6px', 
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      >
        📄 Экспорт в Word
      </button>
    </div>
  );
}
