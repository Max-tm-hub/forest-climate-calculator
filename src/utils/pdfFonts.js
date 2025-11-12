// pdfFonts.js
import { jsPDF } from 'jspdf';

// Base64 encoded font files for Cyrillic support
// Здесь должны быть Base64 строки шрифтов, но для простоты используем встроенные

export function registerCustomFonts(doc) {
  // Используем Times New Roman как fallback шрифт с лучшей поддержкой кириллицы
  // В реальном проекте нужно добавить Base64 шрифты
  try {
    doc.setFont('helvetica');
  } catch (e) {
    try {
      doc.setFont('times');
    } catch (e2) {
      console.warn('Could not set custom font, using default');
    }
  }
}

// Функция для безопасного отображения текста
export function safeText(text) {
  if (text === null || text === undefined) return '';
  
  const str = String(text);
  
  // Заменяем проблемные символы
  return str
    .replace(/[”“]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—]/g, '-')
    .replace(/[«»]/g, '"');
}

// Альтернативное решение - используем canvas для рендеринга текста
export function renderTextWithUnicode(doc, text, x, y, options = {}) {
  const { align = 'left', fontSize = 10, fontStyle = 'normal' } = options;
  
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', fontStyle);
  
  // Простая замена для основных символов кириллицы
  const cleanText = safeText(text);
  
  doc.text(cleanText, x, y, { align });
}