#!/usr/bin/env node

/**
 * FolioFlux CLI and Application Launcher
 * Fast, versatile open-source PDF viewer and manipulation tool.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { PDFDocument, degrees } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.wasm': 'application/wasm',
  '.bcmap': 'application/octet-stream',
  '.properties': 'text/plain',
};

function showHelp() {
  console.log(`
FolioFlux v1.0.0 — Modern Open-Source PDF Viewer & Editor

Usage:
  folioflux [options] [command | file.pdf]

Commands:
  (default) [file.pdf]        Launch the FolioFlux desktop / browser UI
  serve [--port <port>]       Start local server without opening a browser window
  info <file.pdf>             Display document metadata, page count, and dimensions
  merge <files...> -o <out>   Merge multiple PDFs into a single document
  split <file.pdf> -o <dir>   Split a PDF into individual page files
  rotate <file.pdf> -o <out> --angle <90|180|270> [--pages 1,2...]
                              Rotate pages by a specified angle
  extract-text <file.pdf> [-o <out>]
                              Extract all plain text from document
  help, --help, -h            Show this help manual
  version, --version, -v      Show current version

Options:
  --port <number>             Port to listen on (default: 4080 or next available)
  --host <address>            Host interface to bind (default: 127.0.0.1)
  --headless                  Do not launch browser window

Examples:
  folioflux document.pdf
  folioflux merge part1.pdf part2.pdf -o complete.pdf
  folioflux rotate scan.pdf -o upright.pdf --angle 90
  folioflux info report.pdf
`);
}

async function handleInfo(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const bytes = fs.readFileSync(filePath);
  const doc = await PDFDocument.load(bytes);
  const count = doc.getPageCount();
  const title = doc.getTitle() || '(untitled)';
  const author = doc.getAuthor() || '(unknown)';
  const subject = doc.getSubject() || '(none)';
  const producer = doc.getProducer() || '(unknown)';
  const creator = doc.getCreator() || '(unknown)';

  console.log(`--- FolioFlux Document Info ---`);
  console.log(`File:       ${path.resolve(filePath)}`);
  console.log(`Size:       ${(bytes.length / 1024).toFixed(1)} KB`);
  console.log(`Title:      ${title}`);
  console.log(`Author:     ${author}`);
  console.log(`Subject:    ${subject}`);
  console.log(`Producer:   ${producer}`);
  console.log(`Creator:    ${creator}`);
  console.log(`Pages:      ${count}`);

  for (let i = 0; i < Math.min(count, 5); i++) {
    const page = doc.getPage(i);
    const { width, height } = page.getSize();
    const rot = page.getRotation().angle;
    console.log(`  Page ${i + 1}: ${width.toFixed(1)} x ${height.toFixed(1)} pt (rotation: ${rot}°)`);
  }
  if (count > 5) {
    console.log(`  ... and ${count - 5} more pages`);
  }
}

async function handleMerge(args) {
  let outIndex = args.indexOf('-o');
  if (outIndex === -1) outIndex = args.indexOf('--output');
  if (outIndex === -1 || outIndex === args.length - 1) {
    console.error('Error: Must specify output file with -o <output.pdf>');
    process.exit(1);
  }

  const outPath = args[outIndex + 1];
  const inputFiles = args.slice(0, outIndex).concat(args.slice(outIndex + 2));

  if (inputFiles.length < 2) {
    console.error('Error: Please provide at least two PDF files to merge.');
    process.exit(1);
  }

  const mergedDoc = await PDFDocument.create();

  for (const file of inputFiles) {
    if (!fs.existsSync(file)) {
      console.error(`Error: File not found: ${file}`);
      process.exit(1);
    }
    const bytes = fs.readFileSync(file);
    const srcDoc = await PDFDocument.load(bytes);
    const copiedPages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
    for (const page of copiedPages) {
      mergedDoc.addPage(page);
    }
    console.log(`Added ${copiedPages.length} pages from ${path.basename(file)}`);
  }

  const outBytes = await mergedDoc.save();
  fs.writeFileSync(outPath, outBytes);
  console.log(`Successfully merged ${inputFiles.length} files (${mergedDoc.getPageCount()} total pages) -> ${outPath}`);
}

async function handleSplit(args) {
  const filePath = args[0];
  let outIndex = args.indexOf('-o');
  if (outIndex === -1) outIndex = args.indexOf('--output');
  const outDir = outIndex !== -1 ? args[outIndex + 1] : './split_pages';

  if (!filePath || !fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const bytes = fs.readFileSync(filePath);
  const srcDoc = await PDFDocument.load(bytes);
  const count = srcDoc.getPageCount();
  const baseName = path.basename(filePath, path.extname(filePath));

  console.log(`Splitting ${baseName}.pdf into ${count} individual pages...`);

  for (let i = 0; i < count; i++) {
    const singleDoc = await PDFDocument.create();
    const [page] = await singleDoc.copyPages(srcDoc, [i]);
    singleDoc.addPage(page);
    const pageBytes = await singleDoc.save();
    const outPagePath = path.join(outDir, `${baseName}-page-${i + 1}.pdf`);
    fs.writeFileSync(outPagePath, pageBytes);
  }

  console.log(`Successfully wrote ${count} pages into ${outDir}`);
}

async function handleRotate(args) {
  const filePath = args[0];
  let outIndex = args.indexOf('-o');
  if (outIndex === -1) outIndex = args.indexOf('--output');
  if (outIndex === -1) {
    console.error('Error: Must specify output file with -o <output.pdf>');
    process.exit(1);
  }
  const outPath = args[outIndex + 1];

  let angleIndex = args.indexOf('--angle');
  const angle = angleIndex !== -1 ? parseInt(args[angleIndex + 1], 10) : 90;

  if (!filePath || !fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const bytes = fs.readFileSync(filePath);
  const doc = await PDFDocument.load(bytes);
  const count = doc.getPageCount();

  for (let i = 0; i < count; i++) {
    const page = doc.getPage(i);
    const currentAngle = page.getRotation().angle;
    page.setRotation(degrees((currentAngle + angle) % 360));
  }

  const outBytes = await doc.save();
  fs.writeFileSync(outPath, outBytes);
  console.log(`Successfully rotated all ${count} pages by ${angle}° -> ${outPath}`);
}

async function handleExtractText(args) {
  const filePath = args[0];
  let outIndex = args.indexOf('-o');
  if (outIndex === -1) outIndex = args.indexOf('--output');
  const outPath = outIndex !== -1 ? args[outIndex + 1] : null;

  if (!filePath || !fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const bytes = fs.readFileSync(filePath);
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(bytes),
    standardFontDataUrl: path.join(ROOT_DIR, 'public/standard_fonts/'),
  });
  const doc = await loadingTask.promise;
  const count = doc.numPages;

  let fullText = '';
  for (let i = 1; i <= count; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(it => it.str).join(' ');
    fullText += `--- Page ${i} ---\n${pageText}\n\n`;
  }

  if (outPath) {
    fs.writeFileSync(outPath, fullText, 'utf-8');
    console.log(`Successfully extracted text from ${count} pages -> ${outPath}`);
  } else {
    process.stdout.write(fullText);
  }
}

function startServer({ port = 4080, host = '127.0.0.1', initialDocPath = null }) {
  let initialBuffer = null;
  let initialDocName = 'document.pdf';

  if (initialDocPath && fs.existsSync(initialDocPath)) {
    initialBuffer = fs.readFileSync(initialDocPath);
    initialDocName = path.basename(initialDocPath);
  }

  const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let pathname = decodeURIComponent(parsedUrl.pathname);

    // API endpoint to fetch initial document if opened from CLI
    if (pathname === '/api/initial-document') {
      if (initialBuffer) {
        res.writeHead(200, {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${initialDocName}"`,
        });
        res.end(initialBuffer);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No initial document' }));
      }
      return;
    }

    if (pathname === '/') pathname = '/index.html';

    const filePath = path.join(DIST_DIR, pathname);

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      // Fallback to index.html for SPA routes
      const fallback = path.join(DIST_DIR, 'index.html');
      if (fs.existsSync(fallback)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(fs.readFileSync(fallback));
        return;
      }
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(filePath).pipe(res);
  });

  server.listen(port, host, () => {
    const url = `http://${host}:${port}`;
    console.log(`FolioFlux running at ${url}`);
  });

  return server;
}

async function launchGUI(initialDocPath = null) {
  // Check if dist directory exists; if not, build it
  if (!fs.existsSync(DIST_DIR) || !fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
    console.log('Building FolioFlux assets...');
    const buildProc = spawn('npm', ['run', 'build'], { cwd: ROOT_DIR, stdio: 'inherit' });
    await new Promise((resolve, reject) => {
      buildProc.on('close', code => code === 0 ? resolve() : reject(new Error('Build failed')));
    });
  }

  const port = 4080;
  const host = '127.0.0.1';
  startServer({ port, host, initialDocPath });

  const appUrl = `http://${host}:${port}`;

  // Check if Chrome / Chromium is available for desktop mode
  const chromePaths = [
    '/opt/agent-tools/chromium/chrome-linux64/chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ];

  let chromeBin = null;
  for (const p of chromePaths) {
    if (fs.existsSync(p)) {
      chromeBin = p;
      break;
    }
  }

  if (chromeBin && process.env.DISPLAY) {
    console.log(`Launching FolioFlux desktop app via ${chromeBin} on ${process.env.DISPLAY}...`);
    const args = [
      `--app=${appUrl}`,
      '--window-size=1440,900',
      '--no-sandbox',
      '--disable-gpu-sandbox',
      '--disable-dev-shm-usage',
      '--user-data-dir=/tmp/opencode/folioflux-chrome-profile',
    ];
    const child = spawn(chromeBin, args, {
      detached: true,
      stdio: 'ignore',
      env: process.env,
    });
    child.unref();
  } else {
    console.log(`Desktop display not detected or browser not found. Open ${appUrl} in your browser.`);
  }
}

// Main CLI dispatch
async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (!cmd || cmd === 'start' || (!cmd.startsWith('-') && cmd.endsWith('.pdf'))) {
    const file = cmd && cmd.endsWith('.pdf') ? cmd : null;
    await launchGUI(file);
    return;
  }

  if (cmd === 'help' || cmd === '--help' || cmd === '-h') {
    showHelp();
    return;
  }

  if (cmd === 'version' || cmd === '--version' || cmd === '-v') {
    console.log('FolioFlux v1.0.0');
    return;
  }

  if (cmd === 'serve') {
    const portIdx = args.indexOf('--port');
    const port = portIdx !== -1 ? parseInt(args[portIdx + 1], 10) : 4080;
    startServer({ port });
    return;
  }

  if (cmd === 'info') {
    await handleInfo(args[1]);
    return;
  }

  if (cmd === 'merge') {
    await handleMerge(args.slice(1));
    return;
  }

  if (cmd === 'split') {
    await handleSplit(args.slice(1));
    return;
  }

  if (cmd === 'rotate') {
    await handleRotate(args.slice(1));
    return;
  }

  if (cmd === 'extract-text') {
    await handleExtractText(args.slice(1));
    return;
  }

  // Unknown command: fallback to opening file or help
  if (fs.existsSync(cmd)) {
    await launchGUI(cmd);
  } else {
    console.error(`Unknown command: ${cmd}`);
    showHelp();
    process.exit(1);
  }
}

main().catch(err => {
  console.error('FolioFlux error:', err);
  process.exit(1);
});
