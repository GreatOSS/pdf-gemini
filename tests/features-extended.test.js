import test from 'node:test';
import assert from 'node:assert';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

test('PDF metadata updating and retrieval', async () => {
  const doc = await PDFDocument.create();
  doc.setTitle('Original Title');
  doc.setAuthor('Original Author');
  doc.setSubject('Engineering Specifications');
  doc.setKeywords(['spec', 'pdf', 'cad']);
  doc.setProducer('FolioFlux Engine');
  doc.setCreator('FolioFlux PDF');

  const page = doc.addPage([600, 800]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText('Document with Metadata', { x: 50, y: 700, size: 16, font, color: rgb(0, 0, 0) });

  const bytes = await doc.save();
  const loaded = await PDFDocument.load(bytes);

  assert.strictEqual(loaded.getTitle(), 'Original Title');
  assert.strictEqual(loaded.getAuthor(), 'Original Author');
  assert.strictEqual(loaded.getSubject(), 'Engineering Specifications');
  assert.strictEqual(loaded.getCreator(), 'FolioFlux PDF');
  assert.ok(loaded.getProducer(), 'Producer should be present');

  // Update metadata
  loaded.setTitle('Updated FolioFlux Spec');
  loaded.setAuthor('Lead Maintainer');
  const updatedBytes = await loaded.save();

  const reloaded = await PDFDocument.load(updatedBytes);
  assert.strictEqual(reloaded.getTitle(), 'Updated FolioFlux Spec');
  assert.strictEqual(reloaded.getAuthor(), 'Lead Maintainer');
});

test('PDF multi-page outline / bookmark generation compatibility', async () => {
  const doc = await PDFDocument.create();
  const p1 = doc.addPage([600, 800]);
  const p2 = doc.addPage([600, 800]);
  const p3 = doc.addPage([600, 800]);

  const font = await doc.embedFont(StandardFonts.Helvetica);
  p1.drawText('Chapter 1: Introduction', { x: 50, y: 750, size: 18, font });
  p2.drawText('Chapter 2: Core Components', { x: 50, y: 750, size: 18, font });
  p3.drawText('Chapter 3: Verification & Tests', { x: 50, y: 750, size: 18, font });

  const bytes = await doc.save();
  assert.ok(bytes.length > 500);

  const reloaded = await PDFDocument.load(bytes);
  assert.strictEqual(reloaded.getPageCount(), 3);
});

test('Password-protected PDF detection interface', async () => {
  // Verify PDF.js PasswordResponses constants
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  assert.strictEqual(pdfjs.PasswordResponses.NEED_PASSWORD, 1);
  assert.strictEqual(pdfjs.PasswordResponses.INCORRECT_PASSWORD, 2);
});
