// src/utils/exportToPdf.js
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportGostReport(results, inputs) {
  // ✅ Используем Times New Roman через embed — но проще через html2canvas
  import('html2canvas').then(({ default: html2canvas }) => {
    const container = document.createElement('div');
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.padding = '20px';
    container.style.width = '210mm';
    container.style.lineHeight = 1.5;

    container.innerHTML = `
      <h2 style="text-align: center; color: #1976d2;">Отчёт по лесному климатическому проекту</h2>
      <p><strong>Порода:</strong> ${inputs.treeType}</p>
      <p><strong>Площадь:</strong> ${inputs.areaHa} га</p>
      <p><strong>Срок:</strong> ${inputs.projectYears} лет</p>
      <p><strong>Дата:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>

      <h3>Финансовые показатели</h3>
      <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%;">
        <tr><th>Показатель</th><th>Значение</th></tr>
        <tr><td>NPV</td><td>${results.npv.toLocaleString('ru')} ₽</td></tr>
        <tr><td>IRR</td><td>${results.irr}</td></tr>
        <tr><td>Срок окупаемости (простой)</td><td>${results.simplePayback} лет</td></tr>
        <tr><td>Себестоимость УЕ</td><td>${results.cuCost} ₽/т</td></tr>
      </table>
    `;

    document.body.appendChild(container);

    html2canvas(container, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Отчёт_ЛКП_${inputs.treeType}_${inputs.areaHa}га.pdf`);

      document.body.removeChild(container);
    }).catch(err => {
      console.error('PDF export error:', err);
      alert('Ошибка генерации PDF. Откройте DevTools (F12) для деталей.');
    });
  });
}
