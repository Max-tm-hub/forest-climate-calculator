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

  const handleExportWord = () => {
    if (!results) {
      alert('Сначала выполните расчет');
      return;
    }

    if (!chartRefs.cashFlowChart || !chartRefs.carbonChart) {
      alert('Графики еще не готовы. Подождите несколько секунд и попробуйте снова.');
      return;
    }

    console.log('Starting Word export with chart refs:', chartRefs);
    exportToWord(results, inputs, chartRefs);
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
