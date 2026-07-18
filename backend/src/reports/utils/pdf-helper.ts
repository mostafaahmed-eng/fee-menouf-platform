import PDFDocument from 'pdfkit';

export interface PdfReportOptions {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number)[][];
}

export function generatePdfReport(options: PdfReportOptions): Buffer {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  doc.fontSize(20).font('Helvetica-Bold').text(options.title, { align: 'center' });
  doc.moveDown(0.5);
  if (options.subtitle) {
    doc.fontSize(12).font('Helvetica').fillColor('#666666').text(options.subtitle, { align: 'center' });
    doc.moveDown(1);
  }

  doc.fillColor('#000000');
  const colWidth = (doc.page.width - 100) / options.headers.length;

  doc.fontSize(10).font('Helvetica-Bold');
  const headerY = doc.y;
  options.headers.forEach((h, i) => {
    doc.text(h, 50 + i * colWidth, headerY, { width: colWidth, align: 'center' });
  });
  doc.y = headerY + 20;
  doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
  doc.moveDown(0.5);

  doc.font('Helvetica').fontSize(9).fillColor('#333333');
  options.rows.forEach((row) => {
    if (doc.y > doc.page.height - 100) {
      doc.addPage();
    }
    const y = doc.y;
    row.forEach((cell, i) => {
      doc.text(String(cell ?? '-'), 50 + i * colWidth, y, { width: colWidth, align: 'center' });
    });
    doc.y = y + 18;
  });

  doc.fontSize(8).fillColor('#999999');
  doc.text(`Generated: ${new Date().toISOString().split('T')[0]}`, 50, doc.page.height - 50, { align: 'center', width: doc.page.width - 100 });

  doc.end();
  return Buffer.concat(chunks);
}
