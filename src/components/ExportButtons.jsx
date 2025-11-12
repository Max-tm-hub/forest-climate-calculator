import React from 'react';
import { exportToExcel } from '../utils/exportToExcel';
import { exportToPdfWithCanvas } from '../utils/pdfRenderer';

export default function ExportButtons({ results, inputs, chartRefs }) {
  const handleExportExcel = () => {
    if (results) {
      exportToExcel(results, inputs);
    } else {
      alert('Нет данных для экспорта');
    }
  };

  const handleExportPdf = () => {
    if (results && chartRefs) {
      exportToPdfWithCanvas(results, inputs, chartRefs);
    } else {
      alert('Нет данных для экспорта');
    }
  };

  return (
    <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
      <button 
        onClick={handleExportExcel} 
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#4CAF50', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px', 
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        📊 Экспорт в Excel
      </button>
      <button 
        onClick={handleExportPdf} 
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#2196F3', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px', 
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        📄 Экспорт в PDF
      </button>
    </div>
  );
}
