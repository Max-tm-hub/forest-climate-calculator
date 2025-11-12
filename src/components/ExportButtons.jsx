import React from 'react';
import { exportToPdfWithCanvas } from '../utils/pdfRenderer';

export default function ExportButtons({ onExportExcel, onExportPdf, results, inputs, chartRefs }) {
  const handleExportPdf = () => {
    if (results && chartRefs) {
      exportToPdfWithCanvas(results, inputs, chartRefs);
    } else {
      alert('Нет данных для экспорта');
    }
  };

  return (
    <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
      <button onClick={onExportExcel} style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        📊 Экспорт в Excel
      </button>
      <button onClick={handleExportPdf} style={{ padding: '10px 20px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        📄 Экспорт в PDF (Canvas)
      </button>
    </div>
  );
}
