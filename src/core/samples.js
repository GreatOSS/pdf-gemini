import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Generates the "FolioFlux Feature Tour" sample PDF.
 */
export async function createTourSamplePDF() {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  // Page 1: Introduction & Capabilities
  const p1 = doc.addPage([612, 792]); // Standard US Letter
  const { width, height } = p1.getSize();

  // Top banner
  p1.drawRectangle({
    x: 0,
    y: height - 120,
    width: width,
    height: 120,
    color: rgb(0.31, 0.27, 0.90), // #4f46e5
  });

  p1.drawText('FolioFlux', {
    x: 48,
    y: height - 60,
    size: 28,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  p1.drawText('The Modern, Lightning-Fast Open Source PDF Viewer & Editor', {
    x: 48,
    y: height - 85,
    size: 14,
    font: fontRegular,
    color: rgb(0.88, 0.91, 1.0),
  });

  // Welcome section
  p1.drawText('Welcome to your new PDF workflow', {
    x: 48,
    y: height - 160,
    size: 18,
    font: fontBold,
    color: rgb(0.06, 0.09, 0.16),
  });

  const introText = [
    'FolioFlux is designed from the ground up for speed, elegance, and complete privacy.',
    'All documents are processed 100% locally in your browser or desktop environment.',
    'No file uploads, no tracking, and zero telemetry.',
  ];

  let curY = height - 190;
  for (const line of introText) {
    p1.drawText(line, { x: 48, y: curY, size: 11, font: fontRegular, color: rgb(0.2, 0.25, 0.35) });
    curY -= 18;
  }

  // Feature Card 1: Viewing & Reading
  p1.drawRectangle({
    x: 48,
    y: height - 350,
    width: 240,
    height: 110,
    color: rgb(0.96, 0.97, 0.99),
    borderColor: rgb(0.85, 0.88, 0.95),
    borderWidth: 1,
  });

  p1.drawText('1. Flawless Viewing', {
    x: 60,
    y: height - 270,
    size: 13,
    font: fontBold,
    color: rgb(0.2, 0.25, 0.8),
  });
  p1.drawText('• Continuous vertical scroll\n• Two-page spread & single page\n• Smart dark mode invert\n• Text-to-speech read aloud', {
    x: 60,
    y: height - 290,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.45),
    lineHeight: 14,
  });

  // Feature Card 2: Annotations
  p1.drawRectangle({
    x: 320,
    y: height - 350,
    width: 244,
    height: 110,
    color: rgb(0.96, 0.97, 0.99),
    borderColor: rgb(0.85, 0.88, 0.95),
    borderWidth: 1,
  });

  p1.drawText('2. Rich Markup & Ink', {
    x: 332,
    y: height - 270,
    size: 13,
    font: fontBold,
    color: rgb(0.02, 0.6, 0.5),
  });
  p1.drawText('• Highlighting, underline & strikeout\n• Smooth freehand pen with eraser\n• Shapes: rectangles, circles, arrows\n• Sticky notes with comment threads', {
    x: 332,
    y: height - 290,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.45),
    lineHeight: 14,
  });

  // Feature Card 3: Forms & Signatures
  p1.drawRectangle({
    x: 48,
    y: height - 490,
    width: 240,
    height: 110,
    color: rgb(0.96, 0.97, 0.99),
    borderColor: rgb(0.85, 0.88, 0.95),
    borderWidth: 1,
  });

  p1.drawText('3. Forms & Signatures', {
    x: 60,
    y: height - 410,
    size: 13,
    font: fontBold,
    color: rgb(0.85, 0.45, 0.1),
  });
  p1.drawText('• Fill & flatten interactive forms\n• Digital signatures (draw or type)\n• Pre-made rubber stamps\n• True area redaction scrubbing', {
    x: 60,
    y: height - 430,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.45),
    lineHeight: 14,
  });

  // Feature Card 4: Page Organizer
  p1.drawRectangle({
    x: 320,
    y: height - 490,
    width: 244,
    height: 110,
    color: rgb(0.96, 0.97, 0.99),
    borderColor: rgb(0.85, 0.88, 0.95),
    borderWidth: 1,
  });

  p1.drawText('4. Page Manipulation', {
    x: 332,
    y: height - 410,
    size: 13,
    font: fontBold,
    color: rgb(0.7, 0.2, 0.7),
  });
  p1.drawText('• Rotate pages (90° / 180° / 270°)\n• Drag-and-drop page reordering\n• Delete, duplicate & insert blank\n• Merge multiple PDF documents', {
    x: 332,
    y: height - 430,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.45),
    lineHeight: 14,
  });

  // Callout Quote
  p1.drawRectangle({
    x: 48,
    y: height - 600,
    width: 516,
    height: 80,
    color: rgb(0.94, 0.95, 1.0),
    borderColor: rgb(0.31, 0.27, 0.90),
    borderWidth: 1,
  });
  p1.drawText('Try Annotating This Sample Document Now!', {
    x: 68,
    y: height - 550,
    size: 14,
    font: fontBold,
    color: rgb(0.31, 0.27, 0.90),
  });
  p1.drawText('Pick the Highlighter or Pen tool in the top toolbar to mark any text on this page.\nYou can also add text boxes, rubber stamps, or sticky notes anywhere.', {
    x: 68,
    y: height - 575,
    size: 10.5,
    font: fontRegular,
    color: rgb(0.15, 0.2, 0.3),
  });

  // Footer
  p1.drawText('FolioFlux Open Source Project — Page 1 of 3', {
    x: 48,
    y: 36,
    size: 9,
    font: fontRegular,
    color: rgb(0.5, 0.55, 0.65),
  });

  // Page 2: Keyboard Shortcuts & Power Tips
  const p2 = doc.addPage([612, 792]);
  p2.drawText('FolioFlux Keyboard Shortcuts & Power Tips', {
    x: 48,
    y: height - 60,
    size: 20,
    font: fontBold,
    color: rgb(0.06, 0.09, 0.16),
  });

  p2.drawText('Designed for rapid, keyboard-first navigation and markup.', {
    x: 48,
    y: height - 85,
    size: 11,
    font: fontOblique,
    color: rgb(0.4, 0.45, 0.55),
  });

  // Table of shortcuts
  const shortcuts = [
    ['Ctrl + F / Cmd + F', 'Open Search Bar across all pages'],
    ['Ctrl + Z / Ctrl + Y', 'Undo / Redo annotation or page change'],
    ['Ctrl + S', 'Save & Download edited PDF'],
    ['Ctrl + P', 'Print document with high-res rendering'],
    ['+ / -', 'Zoom in / Zoom out'],
    ['0', 'Fit to Width / Reset zoom'],
    ['PageUp / PageDown', 'Previous / Next page'],
    ['H', 'Hand / Pan tool'],
    ['V', 'Selection tool'],
    ['D', 'Toggle Dark Mode document invert'],
  ];

  let tableY = height - 130;
  for (const [key, desc] of shortcuts) {
    p2.drawRectangle({
      x: 48,
      y: tableY - 6,
      width: 170,
      height: 24,
      color: rgb(0.92, 0.94, 0.98),
    });
    p2.drawText(key, { x: 56, y: tableY, size: 10, font: fontBold, color: rgb(0.2, 0.25, 0.6) });
    p2.drawText(desc, { x: 232, y: tableY, size: 10.5, font: fontRegular, color: rgb(0.15, 0.2, 0.3) });
    p2.drawLine({
      start: { x: 48, y: tableY - 8 },
      end: { x: 564, y: tableY - 8 },
      thickness: 0.5,
      color: rgb(0.85, 0.88, 0.92),
    });
    tableY -= 32;
  }

  // Footer Page 2
  p2.drawText('FolioFlux Open Source Project — Page 2 of 3', {
    x: 48,
    y: 36,
    size: 9,
    font: fontRegular,
    color: rgb(0.5, 0.55, 0.65),
  });

  // Page 3: Visual Layout & Diagrams
  const p3 = doc.addPage([612, 792]);
  p3.drawText('Architecture & Design Principles', {
    x: 48,
    y: height - 60,
    size: 20,
    font: fontBold,
    color: rgb(0.06, 0.09, 0.16),
  });

  p3.drawText('How FolioFlux maintains uncompromising fidelity and responsiveness:', {
    x: 48,
    y: height - 85,
    size: 11,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.55),
  });

  // Diagram Box 1
  p3.drawRectangle({
    x: 48,
    y: height - 240,
    width: 155,
    height: 120,
    color: rgb(0.95, 0.98, 1.0),
    borderColor: rgb(0.3, 0.5, 0.9),
    borderWidth: 1.5,
  });
  p3.drawText('PDF.js Engine', { x: 60, y: height - 150, size: 13, font: fontBold, color: rgb(0.1, 0.3, 0.8) });
  p3.drawText('Pixel-perfect canvas\nrendering, text layers\nand AcroForm parser.', { x: 60, y: height - 180, size: 9.5, font: fontRegular, color: rgb(0.2, 0.3, 0.4), lineHeight: 14 });

  // Arrow 1
  p3.drawLine({
    start: { x: 210, y: height - 180 },
    end: { x: 238, y: height - 180 },
    thickness: 2,
    color: rgb(0.3, 0.4, 0.6),
  });
  p3.drawLine({
    start: { x: 232, y: height - 175 },
    end: { x: 238, y: height - 180 },
    thickness: 2,
    color: rgb(0.3, 0.4, 0.6),
  });
  p3.drawLine({
    start: { x: 232, y: height - 185 },
    end: { x: 238, y: height - 180 },
    thickness: 2,
    color: rgb(0.3, 0.4, 0.6),
  });

  // Diagram Box 2
  p3.drawRectangle({
    x: 245,
    y: height - 240,
    width: 155,
    height: 120,
    color: rgb(0.95, 1.0, 0.96),
    borderColor: rgb(0.1, 0.7, 0.4),
    borderWidth: 1.5,
  });
  p3.drawText('Interactive Layer', { x: 257, y: height - 150, size: 13, font: fontBold, color: rgb(0.05, 0.5, 0.3) });
  p3.drawText('Vector annotation\noverlay, bezier ink,\nstamps & signatures.', { x: 257, y: height - 180, size: 9.5, font: fontRegular, color: rgb(0.2, 0.3, 0.4), lineHeight: 14 });

  // Arrow 2
  p3.drawLine({
    start: { x: 408, y: height - 180 },
    end: { x: 436, y: height - 180 },
    thickness: 2,
    color: rgb(0.3, 0.4, 0.6),
  });
  p3.drawLine({
    start: { x: 430, y: height - 175 },
    end: { x: 436, y: height - 180 },
    thickness: 2,
    color: rgb(0.3, 0.4, 0.6),
  });
  p3.drawLine({
    start: { x: 430, y: height - 185 },
    end: { x: 436, y: height - 180 },
    thickness: 2,
    color: rgb(0.3, 0.4, 0.6),
  });

  // Diagram Box 3
  p3.drawRectangle({
    x: 442,
    y: height - 240,
    width: 122,
    height: 120,
    color: rgb(0.99, 0.96, 1.0),
    borderColor: rgb(0.6, 0.2, 0.8),
    borderWidth: 1.5,
  });
  p3.drawText('pdf-lib Exporter', { x: 452, y: height - 150, size: 12, font: fontBold, color: rgb(0.5, 0.1, 0.7) });
  p3.drawText('Embeds edits,\nreorders pages,\nflattens forms.', { x: 452, y: height - 180, size: 9, font: fontRegular, color: rgb(0.2, 0.3, 0.4), lineHeight: 13 });

  // Stamp demonstration box
  p3.drawRectangle({
    x: 48,
    y: height - 440,
    width: 516,
    height: 160,
    color: rgb(0.98, 0.98, 0.99),
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 1,
  });

  p3.drawText('Inspection & Verification Section', {
    x: 68,
    y: height - 310,
    size: 14,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25),
  });

  p3.drawText('This sample section provides a designated test area for stamping and digital signatures.\nClick "Stamp" or "Signature" in the toolbar above to place approval marks here.', {
    x: 68,
    y: height - 340,
    size: 10.5,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.45),
    lineHeight: 15,
  });

  p3.drawLine({
    start: { x: 68, y: height - 400 },
    end: { x: 260, y: height - 400 },
    thickness: 1,
    color: rgb(0.7, 0.75, 0.8),
  });
  p3.drawText('Authorized Signature', { x: 68, y: height - 418, size: 9, font: fontRegular, color: rgb(0.5, 0.55, 0.6) });

  p3.drawLine({
    start: { x: 320, y: height - 400 },
    end: { x: 512, y: height - 400 },
    thickness: 1,
    color: rgb(0.7, 0.75, 0.8),
  });
  p3.drawText('Date of Verification', { x: 320, y: height - 418, size: 9, font: fontRegular, color: rgb(0.5, 0.55, 0.6) });

  // Footer Page 3
  p3.drawText('FolioFlux Open Source Project — Page 3 of 3', {
    x: 48,
    y: 36,
    size: 9,
    font: fontRegular,
    color: rgb(0.5, 0.55, 0.65),
  });

  return await doc.save();
}

/**
 * Generates an interactive NDA contract sample PDF with AcroForm fields.
 */
export async function createContractSamplePDF() {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([612, 792]);
  const { width, height } = page.getSize();

  // Header
  page.drawText('MUTUAL NON-DISCLOSURE AGREEMENT', {
    x: 110,
    y: height - 60,
    size: 16,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25),
  });

  page.drawText('Standard Bilateral Agreement (Interactive Fillable Form)', {
    x: 130,
    y: height - 80,
    size: 11,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.55),
  });

  page.drawLine({
    start: { x: 48, y: height - 95 },
    end: { x: width - 48, y: height - 95 },
    thickness: 1.5,
    color: rgb(0.2, 0.25, 0.8),
  });

  // Body paragraphs
  const p1 = 'This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of the date specified below by and between the parties identified herein for the purpose of preventing unauthorized disclosure of confidential information.';
  page.drawText(p1, {
    x: 48,
    y: height - 130,
    size: 10,
    font: fontRegular,
    color: rgb(0.2, 0.25, 0.35),
    maxWidth: 516,
    lineHeight: 14,
  });

  // Form Fields Setup
  const form = doc.getForm();

  // Company 1 Name
  page.drawText('Disclosing Party / Company:', { x: 48, y: height - 185, size: 10, font: fontBold });
  const companyField = form.createTextField('company_name');
  companyField.setText('Acme Technologies Inc.');
  companyField.addToPage(page, { x: 210, y: height - 195, width: 350, height: 22 });

  // Effective Date
  page.drawText('Effective Agreement Date:', { x: 48, y: height - 225, size: 10, font: fontBold });
  const dateField = form.createTextField('effective_date');
  dateField.setText('2026-10-01');
  dateField.addToPage(page, { x: 210, y: height - 235, width: 160, height: 22 });

  // Term (Years)
  page.drawText('Confidentiality Term (Years):', { x: 380, y: height - 225, size: 10, font: fontBold });
  const termField = form.createOptionList('term_years');
  termField.addOptions(['1 Year', '2 Years', '3 Years', '5 Years']);
  termField.select('3 Years');
  termField.addToPage(page, { x: 480, y: height - 235, width: 80, height: 22 });

  // Terms Paragraphs
  const termsText = [
    '1. Confidential Information: "Confidential Information" includes all information or material that has or could have commercial value or other utility in the business in which Disclosing Party is engaged.',
    '2. Obligations of Receiving Party: Receiving Party shall hold and maintain the Confidential Information in strictest confidence for the sole and exclusive benefit of the Disclosing Party.',
    '3. Permitted Disclosures: Receiving Party may disclose Confidential Information to its employees or advisors with a bona fide need to know, provided they agree to be bound by confidentiality obligations no less restrictive than those herein.',
  ];

  let curY = height - 280;
  for (const t of termsText) {
    page.drawText(t, {
      x: 48,
      y: curY,
      size: 9.5,
      font: fontRegular,
      color: rgb(0.2, 0.25, 0.35),
      maxWidth: 516,
      lineHeight: 14,
    });
    curY -= 48;
  }

  // Checkbox: Mutual obligations agreed
  const agreeCheck = form.createCheckBox('terms_agreed');
  agreeCheck.check();
  agreeCheck.addToPage(page, { x: 48, y: height - 440, width: 16, height: 16 });
  page.drawText('I confirm and agree to all terms and conditions outlined in this mutual agreement.', {
    x: 72,
    y: height - 436,
    size: 10,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25),
  });

  // Signature Block
  page.drawRectangle({
    x: 48,
    y: height - 600,
    width: 516,
    height: 130,
    color: rgb(0.98, 0.99, 1.0),
    borderColor: rgb(0.85, 0.88, 0.95),
    borderWidth: 1,
  });

  page.drawText('SIGNATURE EXECUTION BLOCK', {
    x: 64,
    y: height - 490,
    size: 11,
    font: fontBold,
    color: rgb(0.2, 0.25, 0.8),
  });

  page.drawText('Signer Full Name:', { x: 64, y: height - 520, size: 10, font: fontRegular });
  const signerField = form.createTextField('signer_name');
  signerField.setText('Jane Doe');
  signerField.addToPage(page, { x: 170, y: height - 525, width: 180, height: 20 });

  page.drawText('Title / Role:', { x: 370, y: height - 520, size: 10, font: fontRegular });
  const titleField = form.createTextField('signer_title');
  titleField.setText('Chief Technology Officer');
  titleField.addToPage(page, { x: 440, y: height - 525, width: 110, height: 20 });

  page.drawLine({
    start: { x: 64, y: height - 570 },
    end: { x: 260, y: height - 570 },
    thickness: 1,
    color: rgb(0.6, 0.65, 0.7),
  });
  page.drawText('Digital Signature (Apply Signature tool here)', {
    x: 64,
    y: height - 585,
    size: 9,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.5),
  });

  // Footer
  page.drawText('FolioFlux Contract Sample — 100% Client-Side PDF Form Filling & Signing', {
    x: 48,
    y: 36,
    size: 9,
    font: fontRegular,
    color: rgb(0.5, 0.55, 0.65),
  });

  return await doc.save();
}

/**
 * Generates a 2-page landscape presentation slide deck sample PDF (792x612).
 */
export async function createPresentationSamplePDF() {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Slide 1 (Landscape: 792 x 612)
  const s1 = doc.addPage([792, 612]);
  const { width: w1, height: h1 } = s1.getSize();

  // Background header band
  s1.drawRectangle({
    x: 0,
    y: h1 - 140,
    width: w1,
    height: 140,
    color: rgb(0.06, 0.09, 0.16), // #0f172a
  });

  s1.drawText('FolioFlux Architecture & Roadmap Deck', {
    x: 54,
    y: h1 - 70,
    size: 26,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  s1.drawText('High-Performance Open-Source PDF Platform — Landscape Presentation Format', {
    x: 54,
    y: h1 - 100,
    size: 13,
    font: fontRegular,
    color: rgb(0.6, 0.7, 0.9),
  });

  // 3 Metric Cards
  const cards = [
    { title: 'Sub-Millisecond Speed', stat: '< 15ms', desc: 'Hardware-accelerated high-DPI canvas rendering pipeline.' },
    { title: 'Local Privacy Guarantee', stat: '100% Local', desc: 'Zero external cloud roundtrips, tracking, or telemetry.' },
    { title: 'Uncompromising UX', stat: '10+ Tools', desc: 'Inking, forms, signatures, measuring, and watermarks.' },
  ];

  let cardX = 54;
  for (const c of cards) {
    s1.drawRectangle({
      x: cardX,
      y: 180,
      width: 214,
      height: 220,
      color: rgb(0.96, 0.98, 1.0),
      borderColor: rgb(0.8, 0.85, 0.95),
      borderWidth: 1.5,
    });

    s1.drawText(c.title, { x: cardX + 16, y: 360, size: 12, font: fontBold, color: rgb(0.31, 0.27, 0.9) });
    s1.drawText(c.stat, { x: cardX + 16, y: 310, size: 24, font: fontBold, color: rgb(0.06, 0.09, 0.16) });
    s1.drawText(c.desc, { x: cardX + 16, y: 260, size: 10.5, font: fontRegular, color: rgb(0.4, 0.45, 0.55), maxWidth: 180, lineHeight: 15 });

    cardX += 236;
  }

  // Footer Slide 1
  s1.drawText('FolioFlux Presentation Deck — Slide 1 of 2 (Press P for Presentation Mode)', {
    x: 54,
    y: 36,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.5, 0.55, 0.65),
  });

  // Slide 2: Technical Flow & Schematic
  const s2 = doc.addPage([792, 612]);
  s2.drawText('Technical Schematics & Blueprint Layout', {
    x: 54,
    y: h1 - 60,
    size: 20,
    font: fontBold,
    color: rgb(0.06, 0.09, 0.16),
  });

  s2.drawText('Ideal for testing horizontal scrolling, dimension measuring, and diagram annotations.', {
    x: 54,
    y: h1 - 85,
    size: 11,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.55),
  });

  // Blueprint diagram box
  s2.drawRectangle({
    x: 54,
    y: 120,
    width: 684,
    height: 360,
    color: rgb(0.98, 0.99, 1.0),
    borderColor: rgb(0.7, 0.75, 0.85),
    borderWidth: 1,
  });

  s2.drawText('Dimension & Distance Measurement Test Zone (Scale: 1 in = 100 ft)', {
    x: 74,
    y: 445,
    size: 13,
    font: fontBold,
    color: rgb(0.2, 0.25, 0.4),
  });

  // Test rectangle for measuring
  s2.drawRectangle({
    x: 74,
    y: 180,
    width: 320,
    height: 200,
    borderColor: rgb(0.31, 0.27, 0.9),
    borderWidth: 2,
    color: rgb(0.93, 0.95, 1.0),
  });
  s2.drawText('Zone A: Main Processing Hub (320 pt x 200 pt)', { x: 90, y: 350, size: 11, font: fontBold, color: rgb(0.31, 0.27, 0.9) });
  s2.drawText('Try using the Measure / Ruler tool to verify dimensions.', { x: 90, y: 325, size: 9.5, font: fontRegular, color: rgb(0.4, 0.45, 0.55) });

  // Zone B
  s2.drawRectangle({
    x: 430,
    y: 180,
    width: 280,
    height: 200,
    borderColor: rgb(0.1, 0.7, 0.4),
    borderWidth: 2,
    color: rgb(0.94, 0.99, 0.95),
  });
  s2.drawText('Zone B: Native Exporter (280 pt x 200 pt)', { x: 446, y: 350, size: 11, font: fontBold, color: rgb(0.05, 0.5, 0.3) });

  // Footer Slide 2
  s2.drawText('FolioFlux Presentation Deck — Slide 2 of 2', {
    x: 54,
    y: 36,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.5, 0.55, 0.65),
  });

  return await doc.save();
}
