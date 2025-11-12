import React from 'react';

export default function ExportButtons({ onExportExcel, onExportPdf }) {
  return (
    <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
      <button onClick={onExportExcel} style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        📊 Экспорт в Excel
      </button>
      <button onClick={onExportPdf} style={{ padding: '10px 20px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        📄 Экспорт в PDF
      </button>
    </div>
  );
}
