# FolioFlux — Comprehensive User Guide

FolioFlux is a fast, beautiful, and privacy-first open-source PDF viewer and editor. It runs 100% locally with zero server uploads and zero telemetry.

---

## 1. Opening & Viewing Documents

### Opening Files
- **Open Button**: Click the **Open** folder button in the header toolbar to select any `.pdf` file.
- **Drag & Drop**: Drag any PDF file directly into the application window.
- **CLI**: Run `folioflux document.pdf` from your terminal to launch directly into that document.
- **Samples Selector**: Choose from the **Samples ▾** dropdown in the header to switch instantly between:
  - *Tour Guide*: 3-page interactive feature showcase.
  - *Fillable NDA*: Interactive bilateral NDA contract with fillable AcroForm fields and signature block.
  - *Blank Doc*: Create a fresh blank document for sketches and notes.

### Viewing Modes & Layouts
- **Continuous Scroll Mode**: Seamlessly scroll down through multi-page documents.
- **Single Page Mode**: Focus on one page at a time with clean slide transitions.
- **Two-Page Spread (Book Mode)**: View facing pages side-by-side (ideal for wide screens and magazines).
- **Zoom Controls**:
  - Zoom In (`+` or `Ctrl + +`)
  - Zoom Out (`-` or `Ctrl + -`)
  - Fit to Width (`0`)
  - Fit to Page
  - Percentage presets (50%, 75%, 100%, 125%, 150%, 200%)

### Smart Dark Mode & Inverted Reading
Click the **Moon/Dark Mode** button (`D`) to activate Smart Inverted Reading Mode:
- Inverts white document backgrounds into comfortable dark slate.
- Preserves natural color balances on embedded images and photos.
- Eases eye strain during long reading sessions in low-light environments.

### Presentation Mode
Click the **Presentation Mode** button (`P`):
- Expands document page to fit the screen (`fit-page`) against a deep cinematic backdrop.
- Hides all toolbars and sidebars to eliminate distractions during meetings and lectures.
- Use `ArrowRight` / `Space` to advance slides and `ArrowLeft` / `Backspace` to go back.
- A floating controls HUD appears on mouse movement with slide counter and exit button. Press `Esc` or `P` to return to editing.

---

## 2. Annotations & Markup Tools

FolioFlux provides a comprehensive annotation toolstrip right below the header:

### Highlighter & Text Markup
- **Highlighter**: Select highlight colors (Yellow, Green, Cyan, Pink, Orange) with custom opacity and natural multiply blending.
- **Underline & Strikeout**: Mark key text or strike through obsolete clauses.

### Freehand Pen & Ink
- Draw notes, diagrams, or arrows freehand.
- Choose stroke colors, stroke width (1px to 12px), and smooth bezier rendering.
- **Eraser Tool**: Erase ink strokes or delete annotations.

### Text Boxes
- Click anywhere on a page to insert an editable text box.
- Customize font size (10px to 32px), text color, and alignment.
- Drag to reposition or edit text in-place.

### Shapes
- **Rectangles**: Draw bordered boxes or filled highlight zones.
- **Ellipses / Circles**: Circle numbers, terms, or diagram nodes.
- **Arrows & Lines**: Point out important sections.

### Measure & Dimension Tool (Ruler)
- Select the **Measure** tool in the toolstrip.
- Drag between two points on any drawing, floor plan, or document.
- Choose your preferred unit in the suboptions: **Inches (`in`)**, **Millimeters (`mm`)**, or **Points (`pt`)**.
- FolioFlux draws a dimension line with end caps and a high-contrast measurement badge.
- Click any measurement badge to remove it, or export the document to embed dimension markings permanently.

### Sticky Notes & Comments
- Click on any page to drop a yellow sticky note marker.
- Type notes, feedback, or review questions.
- All notes appear in the **Notes** sidebar tab with one-click page jumping.

### Rubber Stamps
- Click the **Stamp** tool to place pre-made stamps:
  - `APPROVED` (Green)
  - `CONFIDENTIAL` (Red)
  - `DRAFT` (Gray)
  - `FINAL` (Blue)
  - `VOID` (Red)
  - `REVIEWED` (Indigo)

### Digital Signatures
- Click the **Signature** tool to open the signature dialog.
- **Draw**: Draw your signature with a mouse, trackpad, or stylus with smooth ink smoothing.
- **Type**: Type your name to generate a cursive calligraphic signature.
- **Upload**: Upload a transparent PNG signature image.
- Click **Apply Signature**, then click anywhere on your document to place and resize it.

### Permanent Redaction
- Select the **Redaction** tool.
- Drag a box over sensitive information (account numbers, names, addresses).
- Redaction burns a permanent solid black barrier directly into the PDF binary upon export, scrubbing the data completely.

### Watermarks & Page Numbers
Click the **Watermark** icon in the toolstrip to open the customization dialog:
- **Watermark**: Enter custom text or select presets (`CONFIDENTIAL`, `DRAFT`, `DO NOT COPY`, `SAMPLE`, `INTERNAL ONLY`). Configure color (Red, Gray, Blue, Amber) and opacity (10% to 50%). FolioFlux renders a centered diagonal watermark across all pages and embeds it on export.
- **Page Numbers**: Add formatted page numbering (e.g. `Page 1 of 10`, `1 / 10`, `- 1 -`) to the bottom-center, bottom-right, or top-right of all document pages.

---

## 3. Interactive AcroForm Filling & Flattening

- Fill in standard PDF form fields: text inputs, checkboxes, radio buttons, and dropdown options.
- Visual highlighting ensures you never miss a required field.
- **Flatten Forms on Save**: Converts active form inputs into permanent text so they cannot be tampered with after signing.

---

## 4. Page Organizer & Manipulation

Click **Organize** in the header or use the **Pages** sidebar tab:
- **Rotate Pages**: Rotate individual pages or all pages 90° Clockwise, Counter-Clockwise, or 180°.
- **Reorder Pages**: Drag-and-drop page cards to reorder pages intuitively.
- **Duplicate Page**: Create an identical copy of any page.
- **Delete Page**: Remove unwanted pages with confirmation.
- **Merge Documents**: Use the CLI `folioflux merge file1.pdf file2.pdf -o merged.pdf` to combine documents.

---

## 5. Full-Text Search

- Press `Ctrl + F` or click the search icon.
- Type any query to instantly highlight all occurrences across all pages.
- Navigate matches with `Enter` (Next), `Shift + Enter` (Previous), or the arrow buttons.
- View match counter (`Match X of Y`).
- View comprehensive match snippets in the **Search** sidebar tab.

---

## 6. Text-to-Speech (TTS) Read Aloud

- Click the **Speaker** icon in the toolbar.
- FolioFlux speaks the text of the current page aloud.
- Controls include Play, Pause, Stop, and speed rate adjustments (0.8x, 1.0x, 1.25x, 1.5x).

---

## 7. Saving, Exporting & Printing

- **Save PDF (`Ctrl + S`)**: Compiles and downloads your modified PDF document with all annotations, signatures, form values, and page rearrangements embedded.
- **Export Formats Dropdown**:
  - **PDF (.pdf)**: Download the compiled document.
  - **Images (.png)**: Export high-resolution PNG renders of pages for presentations or image editors.
  - **Text (.txt)**: Extract and download all textual content across the entire document into a formatted text file.
  - **Form Data (.json)**: Export filled AcroForm field values as structured JSON data for programmatic workflows.
- **Print (`Ctrl + P`)**: Sends high-resolution rendered pages directly to your system print dialog.
- **CLI Commands**:
  - `folioflux info doc.pdf`
  - `folioflux merge doc1.pdf doc2.pdf -o out.pdf`
  - `folioflux split doc.pdf -o ./pages`
  - `folioflux rotate doc.pdf -o upright.pdf --angle 90`

---

## 8. Keyboard Shortcuts Quick Reference

| Shortcut | Description |
| :--- | :--- |
| `Ctrl + O` | Open PDF file |
| `Ctrl + S` | Save & Download modified PDF |
| `Ctrl + P` | Print document |
| `Ctrl + F` | Find in document |
| `Ctrl + Z` | Undo last annotation / edit |
| `Ctrl + Y` | Redo undone action |
| `+` / `-` | Zoom In / Zoom Out |
| `0` | Fit to width / Reset zoom |
| `PageDown` / `]` | Next page |
| `PageUp` / `[` | Previous page |
| `H` | Hand (Pan) tool |
| `V` | Selection cursor tool |
| `P` | Toggle Presentation Mode |
| `D` | Toggle Smart Dark Reading Mode |
| `B` | Toggle Sidebar |
| `Home` / `End` | Jump to First / Last page |
| `j` / `k` | Scroll down / up smoothly |
| `?` | Open Help & Shortcuts dialog |
| `Escape` | Close active dialog or exit presentation |
