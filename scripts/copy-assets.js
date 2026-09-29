import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const srcDir = path.join(root, 'node_modules/pdfjs-dist');
const destDir = path.join(root, 'public');

if (fs.existsSync(srcDir)) {
  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(path.join(srcDir, 'build/pdf.worker.min.mjs'), path.join(destDir, 'pdf.worker.min.mjs'));
  fs.cpSync(path.join(srcDir, 'cmaps'), path.join(destDir, 'cmaps'), { recursive: true });
  fs.cpSync(path.join(srcDir, 'standard_fonts'), path.join(destDir, 'standard_fonts'), { recursive: true });
  console.log('PDF.js assets copied to public/');
}
