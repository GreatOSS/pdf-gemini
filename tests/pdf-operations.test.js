import test from 'node:test';
import assert from 'node:assert';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

test('PDF creation and page addition', async () => {
  const doc = await PDFDocument.create();
  const page = doc.addPage([500, 700]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText('FolioFlux Automated Test', { x: 50, y: 650, size: 20, font, color: rgb(0, 0, 0) });

  const bytes = await doc.save();
  assert.ok(bytes.length > 500, 'Generated PDF should have non-zero content');

  const loaded = await PDFDocument.load(bytes);
  assert.strictEqual(loaded.getPageCount(), 1, 'Should have exactly 1 page');
});

test('PDF page rotation', async () => {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  page.setRotation(degrees(90));
  const bytes = await doc.save();

  const loaded = await PDFDocument.load(bytes);
  const p1 = loaded.getPage(0);
  assert.strictEqual(p1.getRotation().angle, 90, 'Page rotation should be 90 degrees');
});

test('PDF merge multiple documents', async () => {
  const doc1 = await PDFDocument.create();
  doc1.addPage([600, 400]);

  const doc2 = await PDFDocument.create();
  doc2.addPage([600, 400]);
  doc2.addPage([600, 400]);

  const merged = await PDFDocument.create();
  const p1 = await merged.copyPages(doc1, [0]);
  const p2 = await merged.copyPages(doc2, [0, 1]);

  merged.addPage(p1[0]);
  merged.addPage(p2[0]);
  merged.addPage(p2[1]);

  const bytes = await merged.save();
  const loaded = await PDFDocument.load(bytes);
  assert.strictEqual(loaded.getPageCount(), 3, 'Merged document should have 3 pages');
});

test('PDF split document', async () => {
  const doc = await PDFDocument.create();
  doc.addPage([600, 400]);
  doc.addPage([600, 400]);

  const splitDoc = await PDFDocument.create();
  const [extracted] = await splitDoc.copyPages(doc, [1]);
  splitDoc.addPage(extracted);

  const bytes = await splitDoc.save();
  const loaded = await PDFDocument.load(bytes);
  assert.strictEqual(loaded.getPageCount(), 1, 'Split document should have 1 page');
});

test('PDF watermark and page numbering export', async () => {
  const { PDFExporter } = await import('../src/core/pdf-exporter.js');
  const doc = await PDFDocument.create();
  doc.addPage([600, 800]);
  doc.addPage([600, 800]);
  const rawBytes = await doc.save();

  const mockPdfEngine = {
    rawData: rawBytes,
    pageOrder: [0, 1],
    pageRotations: new Map(),
    metadata: { title: 'Watermarked Doc', author: 'FolioFlux Author' },
  };

  const exportedBytes = await PDFExporter.exportDocument({
    pdfEngine: mockPdfEngine,
    annotationsManager: null,
    formEngine: null,
    watermark: { text: 'CONFIDENTIAL', color: '#dc2626', opacity: 0.3 },
    pageNumbers: { format: 'Page {page} of {total}', position: 'bottom-center' },
  });

  assert.ok(exportedBytes.length > 1000, 'Should produce valid watermarked PDF');
  const verifyDoc = await PDFDocument.load(exportedBytes);
  assert.strictEqual(verifyDoc.getPageCount(), 2, 'Should have 2 pages');
  assert.strictEqual(verifyDoc.getTitle(), 'Watermarked Doc');
  assert.strictEqual(verifyDoc.getAuthor(), 'FolioFlux Author');
});

test('PDF measurement annotation export', async () => {
  const { PDFExporter } = await import('../src/core/pdf-exporter.js');
  const doc = await PDFDocument.create();
  doc.addPage([600, 800]);
  const rawBytes = await doc.save();

  const mockPdfEngine = {
    rawData: rawBytes,
    pageOrder: [0],
    pageRotations: new Map(),
    metadata: { title: 'Blueprint Measurement' },
  };

  const mockAnnManager = {
    getAnnotationsForPage: (idx) => {
      if (idx === 0) {
        return [
          {
            id: 'm1',
            type: 'measure',
            startX: 100,
            startY: 200,
            endX: 300,
            endY: 200,
            distPts: 200,
            label: '2.78 in',
            unit: 'in',
            color: '#4f46e5',
          },
        ];
      }
      return [];
    },
  };

  const exportedBytes = await PDFExporter.exportDocument({
    pdfEngine: mockPdfEngine,
    annotationsManager: mockAnnManager,
    formEngine: null,
  });

  assert.ok(exportedBytes.length > 500, 'Should export PDF with measurement annotation');
  const verifyDoc = await PDFDocument.load(exportedBytes);
  assert.strictEqual(verifyDoc.getPageCount(), 1);
});

test('PDFEngine independent rotations for duplicated pages and export', async () => {
  const { PDFExporter } = await import('../src/core/pdf-exporter.js');
  const doc = await PDFDocument.create();
  doc.addPage([600, 800]); // Page 0
  const rawBytes = await doc.save();

  // Mock engine with duplicate page (page 0 duplicated to slot 1)
  const mockPdfEngine = {
    rawData: rawBytes,
    pageOrder: [0, 0],
    displayRotations: [0, 90], // slot 0 has 0°, slot 1 has 90°
    getPageRotation(displayIdx) {
      return this.displayRotations[displayIdx] || 0;
    },
    metadata: { title: 'Duplicated Rotations' },
  };

  const exportedBytes = await PDFExporter.exportDocument({
    pdfEngine: mockPdfEngine,
    annotationsManager: null,
    formEngine: null,
  });

  const verifyDoc = await PDFDocument.load(exportedBytes);
  assert.strictEqual(verifyDoc.getPageCount(), 2, 'Exported doc should have 2 pages');
  const pages = verifyDoc.getPages();
  assert.strictEqual(pages[0].getRotation().angle, 0, 'First page should have 0 degree rotation');
  assert.strictEqual(pages[1].getRotation().angle, 90, 'Second duplicated page should have 90 degree rotation');
});
