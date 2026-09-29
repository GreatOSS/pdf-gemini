import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

/**
 * Helper to parse hex color string into pdf-lib rgb values (0..1)
 */
function parseColor(hex) {
  if (!hex || typeof hex !== 'string') return rgb(0.2, 0.2, 0.2);
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return rgb(0.2, 0.2, 0.2);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  return rgb(r, g, b);
}

/**
 * FolioFlux PDF Exporter
 * Compiles document modifications, reorders, rotations, vector annotations,
 * signatures, rubber stamps, form field values, and permanent redactions into a valid PDF binary.
 */
export class PDFExporter {
  static async exportDocument({ pdfEngine, annotationsManager, formEngine, flattenForms = true }) {
    if (!pdfEngine || !pdfEngine.rawData) {
      throw new Error('No PDF document loaded to export');
    }

    // Load source document
    const srcDoc = await PDFDocument.load(pdfEngine.rawData);
    const outDoc = await PDFDocument.create();

    // Standard fonts
    const fontRegular = await outDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await outDoc.embedFont(StandardFonts.HelveticaBold);

    // Copy pages in custom pageOrder
    const copiedPages = await outDoc.copyPages(srcDoc, pdfEngine.pageOrder);

    for (let displayIdx = 0; displayIdx < copiedPages.length; displayIdx++) {
      const page = copiedPages[displayIdx];
      const origIdx = pdfEngine.pageOrder[displayIdx];

      // Apply rotation
      const customRot = pdfEngine.pageRotations.get(origIdx) || 0;
      const currentRot = page.getRotation().angle;
      page.setRotation(degrees((currentRot + customRot) % 360));

      const { width, height } = page.getSize();

      // Retrieve annotations for this page
      const annotations = annotationsManager ? annotationsManager.getAnnotationsForPage(displayIdx) : [];

      for (const ann of annotations) {
        // Redaction: draws permanent solid black block
        if (ann.type === 'redaction') {
          const pdfY = height - ann.y - ann.height;
          page.drawRectangle({
            x: ann.x,
            y: pdfY,
            width: ann.width,
            height: ann.height,
            color: rgb(0, 0, 0),
            opacity: 1.0,
          });
          if (ann.textOverlay) {
            page.drawText(ann.textOverlay, {
              x: ann.x + 4,
              y: pdfY + ann.height / 2 - 4,
              size: 9,
              font: fontBold,
              color: rgb(1, 1, 1),
            });
          }
        }

        // Highlight
        else if (ann.type === 'highlight') {
          const color = parseColor(ann.color || '#facc15');
          const pdfY = height - ann.y - ann.height;
          page.drawRectangle({
            x: ann.x,
            y: pdfY,
            width: ann.width,
            height: ann.height,
            color,
            opacity: ann.opacity || 0.4,
          });
        }

        // Rectangles & Boxes
        else if (ann.type === 'rect') {
          const stroke = parseColor(ann.strokeColor || '#ef4444');
          const pdfY = height - ann.y - ann.height;
          const options = {
            x: ann.x,
            y: pdfY,
            width: ann.width,
            height: ann.height,
            borderColor: stroke,
            borderWidth: ann.strokeWidth || 2,
          };
          if (ann.fillColor && ann.fillColor !== 'transparent') {
            options.color = parseColor(ann.fillColor);
            options.opacity = ann.fillOpacity || 0.2;
          }
          page.drawRectangle(options);
        }

        // Lines & Underlines
        else if (ann.type === 'line' || ann.type === 'underline' || ann.type === 'strikeout') {
          const stroke = parseColor(ann.strokeColor || ann.color || '#ef4444');
          const startY = height - ann.startY;
          const endY = height - ann.endY;
          page.drawLine({
            start: { x: ann.startX, y: startY },
            end: { x: ann.endX, y: endY },
            color: stroke,
            thickness: ann.strokeWidth || 2,
          });
        }

        // Freehand Ink Drawing
        else if (ann.type === 'ink' && ann.points && ann.points.length > 1) {
          const stroke = parseColor(ann.color || '#000000');
          for (let i = 0; i < ann.points.length - 1; i++) {
            const p1 = ann.points[i];
            const p2 = ann.points[i + 1];
            page.drawLine({
              start: { x: p1.x, y: height - p1.y },
              end: { x: p2.x, y: height - p2.y },
              color: stroke,
              thickness: ann.width || 2,
            });
          }
        }

        // Text box
        else if (ann.type === 'text' && ann.text) {
          const color = parseColor(ann.color || '#000000');
          const fontSize = ann.fontSize || 12;
          const pdfY = height - ann.y - fontSize;
          page.drawText(ann.text, {
            x: ann.x,
            y: pdfY,
            size: fontSize,
            font: fontRegular,
            color,
          });
        }

        // Rubber Stamp
        else if (ann.type === 'stamp') {
          const stampColors = {
            APPROVED: rgb(0.02, 0.6, 0.3),
            CONFIDENTIAL: rgb(0.85, 0.15, 0.15),
            DRAFT: rgb(0.4, 0.45, 0.5),
            VOID: rgb(0.85, 0.15, 0.15),
            REVIEWED: rgb(0.1, 0.4, 0.8),
          };
          const text = (ann.stampType || 'APPROVED').toUpperCase();
          const color = stampColors[text] || rgb(0.1, 0.4, 0.8);
          const pdfY = height - ann.y - (ann.height || 40);

          page.drawRectangle({
            x: ann.x,
            y: pdfY,
            width: ann.width || 140,
            height: ann.height || 40,
            borderColor: color,
            borderWidth: 2,
            color: rgb(1, 1, 1),
            opacity: 0.9,
          });
          page.drawText(text, {
            x: ann.x + 14,
            y: pdfY + 12,
            size: 16,
            font: fontBold,
            color,
          });
        }

        // Digital Signature (embedded PNG image)
        else if (ann.type === 'signature' && ann.dataUrl) {
          try {
            const base64Data = ann.dataUrl.split(',')[1];
            const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            const image = await outDoc.embedPng(imageBytes);
            const pdfY = height - ann.y - ann.height;
            page.drawImage(image, {
              x: ann.x,
              y: pdfY,
              width: ann.width,
              height: ann.height,
            });
          } catch (err) {
            console.warn('Could not embed signature image:', err);
          }
        }
      }

      outDoc.addPage(page);
    }

    // Form filling & flattening
    if (formEngine && formEngine.fieldValues.size > 0) {
      try {
        const form = outDoc.getForm();
        for (const [name, val] of formEngine.fieldValues.entries()) {
          try {
            const field = form.getFieldMaybe(name);
            if (field) {
              if (typeof val === 'boolean') {
                if (val) field.check();
                else field.uncheck();
              } else if (typeof val === 'string') {
                field.setText(val);
              }
            }
          } catch (fErr) {
            console.warn(`Could not set form field ${name}:`, fErr);
          }
        }
        if (flattenForms) {
          form.flatten();
        }
      } catch (formErr) {
        console.warn('Form flattening error:', formErr);
      }
    }

    // Set PDF metadata
    outDoc.setTitle(pdfEngine.metadata?.title || 'FolioFlux Document');
    outDoc.setProducer('FolioFlux PDF Engine');
    outDoc.setCreator('FolioFlux — https://github.com/GreatOSS/pdf-gemini');

    return await outDoc.save();
  }
}
