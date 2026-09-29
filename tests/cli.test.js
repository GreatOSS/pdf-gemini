import test from 'node:test';
import assert from 'node:assert';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLI_PATH = path.resolve(__dirname, '../bin/folioflux.js');

test('CLI --version and --help output', async () => {
  const { stdout: versionOut } = await execFileAsync('node', [CLI_PATH, '--version']);
  assert.ok(versionOut.includes('FolioFlux v1.0.0'));

  const { stdout: helpOut } = await execFileAsync('node', [CLI_PATH, '--help']);
  assert.ok(helpOut.includes('Usage:'));
  assert.ok(helpOut.includes('merge'));
  assert.ok(helpOut.includes('split'));
  assert.ok(helpOut.includes('rotate'));
});

test('CLI info on generated sample file', async () => {
  const tmpDir = path.resolve('/tmp/opencode/cli-test');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const { PDFDocument } = await import('pdf-lib');
  const doc = await PDFDocument.create();
  doc.setTitle('Test Sample Document');
  doc.addPage([500, 700]);
  doc.addPage([500, 700]);

  const testFile = path.join(tmpDir, 'test-info.pdf');
  fs.writeFileSync(testFile, await doc.save());

  const { stdout } = await execFileAsync('node', [CLI_PATH, 'info', testFile]);
  assert.ok(stdout.includes('FolioFlux Document Info'));
  assert.ok(stdout.includes('Pages:      2'));
  assert.ok(stdout.includes('Test Sample Document'));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('CLI extract-text from document', async () => {
  const tmpDir = path.resolve('/tmp/opencode/cli-extract-test');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const { PDFDocument, StandardFonts } = await import('pdf-lib');
  const doc = await PDFDocument.create();
  const page = doc.addPage([500, 700]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText('FolioFlux CLI Extract Test String', { x: 50, y: 650, size: 14, font });

  const testFile = path.join(tmpDir, 'test-extract.pdf');
  const outFile = path.join(tmpDir, 'extracted.txt');
  fs.writeFileSync(testFile, await doc.save());

  const { stdout } = await execFileAsync('node', [CLI_PATH, 'extract-text', testFile, '-o', outFile]);
  assert.ok(stdout.includes('Successfully extracted text'));

  const content = fs.readFileSync(outFile, 'utf-8');
  assert.ok(content.includes('FolioFlux CLI Extract Test String'));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
