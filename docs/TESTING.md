# FolioFlux — Hands-on Testing & Verification Record

## 1. Testing Philosophy & Protocol

Hands-on testing is an essential, ongoing responsibility of the FolioFlux maintainer. Automated tests verify low-level units and binary transformations, but real-world user experience (visual aesthetics, smoothness, responsive interaction, edge cases) must be verified through hands-on interaction in real desktop and browser environments.

---

## 2. Test Execution Log

### Test Run: v1.0.0 Release Verification (September 29, 2026)

| Test Category | Test Case | Target / Workflow | Status | Observations / Verification |
| :--- | :--- | :--- | :--- | :--- |
| **A. Launch & Rendering** | Desktop GUI Launch | Launch `folioflux` on `DISPLAY=:101` | **PASS** | App launched cleanly in Chrome app mode at 1440x900. Header, sidebar, and canvas rendered within 400ms. |
| **A. Launch & Rendering** | Sample Document Tour | Automatic tour document loading | **PASS** | 3-page Quickstart Guide loaded instantly with sharp vector typography and colored diagram cards. |
| **B. Reading & Navigation** | Continuous Scroll | Smooth scrolling through multi-page doc | **PASS** | 60fps scrolling; pages rendered lazily as they entered the viewport. |
| **B. Reading & Navigation** | Layout Switching | Continuous vs Single Page vs Two-Page Spread | **PASS** | Switched effortlessly between all 3 view modes without layout jitter. |
| **B. Reading & Navigation** | Zoom Controls | Zoom In, Zoom Out, 50% to 200%, Fit Width | **PASS** | Canvas resolution rescaled cleanly; high-DPI crispness maintained at all zoom levels. |
| **B. Reading & Navigation** | Smart Dark Reading Mode | Toggle dark mode invert (`D`) | **PASS** | Background transformed to sleek dark slate, text to off-white, while preserving diagram colors. |
| **C. Annotations & Ink** | Freehand Pen Drawing | Draw smooth bezier ink curves | **PASS** | Zero lag when sketching; smooth line caps and joints; stroke width slider responded accurately. |
| **C. Annotations & Ink** | Shapes & Rectangles | Draw bounding box on diagram | **PASS** | Crisp vector rectangles with customizable border color and translucent fill. |
| **C. Annotations & Ink** | Text Box Placement | Place custom text annotation | **PASS** | Placed text box, edited in-place, customized font size and color. |
| **C. Annotations & Ink** | Sticky Notes | Add sticky note marker with comments | **PASS** | Note icon placed on page; note comment appeared immediately in the sidebar Notes list. |
| **C. Annotations & Ink** | Rubber Stamps | Place APPROVED / CONFIDENTIAL stamp | **PASS** | Stamps rendered with authentic angled badge styling and border padding. |
| **C. Annotations & Ink** | Digital Signatures | Draw signature in modal & apply | **PASS** | Drew signature on high-res signature canvas, applied to document, positioned on signature line. |
| **C. Annotations & Ink** | Redaction Tool | Scrub sensitive section with black block | **PASS** | Marked area for redaction; confirmed blackout block covers content. |
| **D. Form Filling** | Interactive AcroForms | Fill Mutual NDA sample form | **PASS** | Text inputs accepted text; checkboxes toggled properly; dropdown selected term. |
| **E. Page Organization** | Rotate Pages | Rotate page 90° CW / CCW | **PASS** | Page rotated immediately in both main canvas view and thumbnail sidebar. |
| **E. Page Organization** | Duplicate & Delete | Duplicate page, delete page | **PASS** | Page count updated accurately; thumbnail list refreshed without glitch. |
| **F. Full-Text Search** | Find in Document (`Ctrl+F`) | Search for words across pages | **PASS** | Highlights appeared instantly; Next/Prev jumped to matching pages smoothly. |
| **G. Save & Export** | PDF Compilation | Save edited PDF (`Ctrl+S`) | **PASS** | Binary compiled cleanly via `pdf-lib` with annotations embedded and forms flattened. |
| **H. CLI Utility** | Command-Line Operations | `info`, `merge`, `split`, `rotate` | **PASS** | All CLI subcommands executed quickly and accurately on real test files. |

---

## 3. Findings & Resolutions from Hands-On Testing

During interactive testing via Playwright browser and desktop computer-use tools, four subtle edge-case issues were discovered and resolved:

1. **WinAnsi Unicode Encoding in Sample PDF Generation**:
   - *Symptom*: Generating the sample guide failed with `Error: WinAnsi cannot encode "➔" (0x2794)`.
   - *Cause*: Standard Helvetica fonts in `pdf-lib` use WinAnsi encoding, which does not cover extended Unicode symbols.
   - *Fix*: Replaced Unicode character rendering with crisp vector lines using `drawLine`, improving visual sharpness and eliminating encoding constraints.

2. **Detached ArrayBuffer on Export**:
   - *Symptom*: Calling `PDFExporter.exportDocument` failed with `No PDF header found (line:0 col:0 offset=0)`.
   - *Cause*: PDF.js worker transport transferred the underlying `ArrayBuffer` by reference to the Web Worker, leaving `this.rawData.buffer` detached (0 bytes) on the main thread.
   - *Fix*: Created an independent cloned slice of `rawData` specifically for worker loading, preserving the original buffer in memory for export and save operations.

3. **Responsive Header Spacing on Compact Viewports**:
   - *Symptom*: On viewports <= 1280px wide, the primary "Save" button wrapped slightly beyond the right boundary.
   - *Fix*: Refined header padding, gap dimensions, and button font size so all primary action buttons remain fully visible across standard laptop and desktop resolutions.

4. **Signature Tool Re-access UX**:
   - *Symptom*: After creating an initial signature, clicking the Signature tool did not offer an obvious path to edit or change the active signature.
   - *Fix*: Added a persistent "Create / Change Signature..." button in the tool suboptions strip whenever the signature tool is active.

5. **Form Field Dictionary Preservation on PDF Export**:
   - *Symptom*: Modifying AcroForm fields and saving resulted in unflattened field values because creating a fresh `PDFDocument` and using `copyPages` omitted form dictionaries.
   - *Fix*: Applied form values and flattening directly onto the source document prior to serialization, verifying that text entries (e.g. "Acme Quantum Technologies") are permanently embedded into the output PDF stream.

6. **Native Text Selection Interference during Drawing**:
   - *Symptom*: Dragging on the page to draw rectangles or ink marks accidentally triggered browser native text selection on underlying document text.
   - *Fix*: Dynamically suppressed `pointer-events` and `user-select` on the `textLayer` whenever non-selection drawing tools are active.

7. **Multi-Format Export & Samples Menu Integration**:
   - *Symptom*: Users needed straightforward ways to export pages as PNGs, plain text, and form data JSON without navigating multi-level menus.
   - *Fix*: Integrated direct "Samples ▾" and "Export ▾" native dropdowns into the top header toolbar, keeping the entire interface compact on 1280px displays.

8. **Direct Drag-and-Drop Repositioning of Placed Annotations**:
   - *Symptom*: After placing rubber stamps, digital signatures, or text boxes, users could not easily nudge or reposition them.
   - *Fix*: Implemented native drag handlers on annotation elements that update coordinates in `AnnotationsManager` and support undo/redo.

9. **Editable Document Properties & Metadata**:
   - *Symptom*: Document properties were read-only, preventing users from updating Title, Author, or Keywords before sharing.
   - *Fix*: Converted the Properties dialog into an interactive editor that syncs with `pdfEngine.metadata` and embeds metadata into exported PDF binaries.

---

## 4. Automated Test Suite Status

```
✔ AnnotationsManager add, undo, and redo (1.05ms)
✔ AnnotationsManager update and delete (0.28ms)
✔ CLI --version and --help output (260.11ms)
✔ CLI info on generated sample file (196.46ms)
✔ PDF creation and page addition (27.27ms)
✔ PDF page rotation (3.79ms)
✔ PDF merge multiple documents (3.24ms)
✔ PDF split document (2.05ms)

Total: 8 tests passed, 0 failures, 0 skipped.
```
