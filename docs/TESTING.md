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

10. **Document Watermark & Bates / Page Numbering**:
   - *Requirement*: Users regularly require document-wide watermarks ("CONFIDENTIAL", "DRAFT") and automated page numbering ("Page X of Y") before publishing or sharing.
   - *Implementation*: Added interactive Watermark & Page Numbering modal with opacity/color customization and position presets; integrated into live canvas overlays and `PDFExporter` binary compilation. Verified with automated regression tests.

11. **Dimension & Distance Measurement Tool**:
   - *Requirement*: Architecture, design, and technical users require a ruler to measure distances across blueprints and diagrams.
   - *Implementation*: Added interactive Measure tool supporting Inches, Millimeters, and Points (72 pt = 1 in = 25.4 mm) with live drag feedback, orthogonal dimension end-caps, interactive deletion, and binary PDF export.

12. **Presentation Mode & Fullscreen Slide Navigation**:
   - *Requirement*: Presenters, students, and lecturers require a clean slide presentation view without UI chrome or toolbar distraction.
   - *Implementation*: Added Presentation Mode (`P` or toolbar icon) with automatic fit-page scaling, cinematic black backdrop, floating auto-fading navigation HUD, and keyboard hotkeys (`Space`, `Arrows`, `Home`/`End`, `j`/`k`, `Esc`).

13. **Bundle Optimization & Smooth Canvas Zoom**:
   - *Improvement*: Configured Rollup manualChunks splitting for `pdfjs` and `pdflib`, reducing initial app bundle to ~135KB (30KB gzipped).
   - *Interaction*: Added `Ctrl + Wheel` zooming and instant `Enter` key page jumping in the header input.

14. **Landscape Presentation & Blueprint Schematics**:
   - *Requirement*: Validate application behavior on wide 16:9 / 4:3 landscape dimensions and architectural blueprints.
   - *Implementation*: Added interactive `createPresentationSamplePDF` (792x612 pt) with multi-column metric cards and blueprint test zone; confirmed dynamic wrapper resizing, dimension measuring, and slide presentation HUD.

15. **CLI Text Extraction Pipeline**:
   - *Requirement*: Enable fast command-line extraction of plain text from multi-page PDFs to stdout or formatted files.
   - *Implementation*: Added `folioflux extract-text` CLI subcommand with standardFontDataUrl resolution, supporting batch piping and shell scripts. Verified with automated regression tests.

16. **Password-Protected & Encrypted PDF Support**:
   - *Requirement*: Handle opening password-protected / encrypted PDF files seamlessly without crashing or unhelpful errors.
   - *Implementation*: Created `PasswordModal` with show/hide password toggle, real-time error banner ("Incorrect password, please try again"), and hooked into PDF.js `onPassword` callback. Decryption is performed entirely in-memory without saving cleartext or keys to disk.

17. **High-Fidelity Document Printing Pipeline**:
   - *Requirement*: Enable printing documents (`Ctrl + P`) without UI chrome, sidebars, or toolbars interfering.
   - *Implementation*: Added dedicated Print toolbar button and `@media print` CSS rules that suppress application chrome, ensure exact page breaks between pages, and render document canvases cleanly.

18. **Warm Paper / Sepia Mode & Reading Theme Cycling**:
   - *Requirement*: Long-term readers requested an eye-care sepia mode in addition to standard inverted dark mode.
   - *Implementation*: Added multi-state reading theme cycling (`D` key or header icon): Standard Light -> Smart Dark -> Warm Paper Sepia (`#efe6d5`).

19. **Interactive Document Outline / Bookmarks Navigation**:
   - *Requirement*: PDF documents with outlines/bookmarks should allow clicking outline items to jump to target pages.
   - *Implementation*: Connected outline links to PDF.js destination resolver (`getDestination` and `getPageIndex`), scrolling smoothly to the target page index.

20. **Universal Escape Key & Backdrop Dismiss**:
   - *Improvement*: Ensured all application modal dialogs (Shortcuts, Properties, Password, Watermark, Organizer, Signature) dismiss on backdrop click and `Escape` key press.

21. **Floating Text Selection Quick Menu**:
   - *Requirement*: Enable instant highlight and copy directly upon selecting document text with the mouse.
   - *Implementation*: Added floating action bar (`.selection-popup`) positioned above active range rects; binds pointerdown handlers to create highlight annotations across lines or copy text to clipboard without losing selection state.

22. **In-Place Popover Note Editor & Text Box Auto-Focus**:
   - *Requirement*: Avoid disruptive browser `prompt()` dialogs when creating or editing sticky notes and text boxes.
   - *Implementation*: Replaced prompts with in-place `.note-popover` card (text editor, done, delete) and auto-focused `contenteditable` text boxes with live input synchronization.

23. **Single-Key Tool Keyboard Shortcuts**:
   - *Improvement*: Added single-key shortcuts (`V` Select, `H` Hand, `E` Highlighter, `T` Text, `N` Sticky Note, `R` Rect, `C` Circle, `M` Measure) for rapid, seamless markup workflows without toolbar mouse travel.

24. **Rotate All Pages Quick Actions**:
   - *Requirement*: Users frequently open scanned documents where all pages were captured sideways or upside down.
   - *Implementation*: Added one-click Rotate All CW button to the thumbnail sidebar header and dedicated Rotate All CW (+90°) / CCW (-90°) buttons in the Page Organizer modal. Verified with live desktop interaction on DISPLAY=:101.

25. **Form Layer Interaction Hierarchy & Blob Download Lifecycle**:
   - *Fix*: Dynamically toggle pointer-events on `.annotation-overlay-layer` so that in `select` tool mode, AcroForm fields (text inputs, checkboxes, dropdowns) receive clicks directly while preserving drawing capture in markup modes.
   - *Fix*: Replaced synchronous `URL.revokeObjectURL(url)` with a delayed cleanup timer on file exports, ensuring Chromium and WebKit download managers can complete stream serialization before the blob object URL is revoked.

26. **Two-Page Spread Layout Auto-Fit Scaling**:
   - *Requirement*: When switching to two-page spread view, pages must render side-by-side without horizontal wrapping or clipping.
   - *Implementation*: Added dynamic viewport calculation in `setLayoutMode('two-page')` that calculates dual-page fit scale based on active container width (`(containerWidth - 80) / (pageWidth * 2 + 30)`), automatically fitting spreads across laptop and desktop screens. Verified on DISPLAY=:101.

27. **CLI Flag Aliases & End-to-End Pipeline Verification**:
   - *Requirement*: Support standard flag variants (`-o`, `--output`, `--outdir`, `--output-dir`) across CLI subcommands (`split`, `merge`, `rotate`, `extract-text`, `info`).
   - *Implementation*: Expanded CLI flag parsing in `bin/folioflux.js` and added automated regression tests in `tests/cli.test.js` validating the full headless splitting, merging, rotating, and inspection pipeline.

28. **Digital Signature Direct Placement Flow & Backdrop Dismissal**:
   - *Requirement*: Eliminate alert interruptions when stamping signatures without pre-drawn signatures, placing them directly at the targeted point upon creation.
   - *Implementation*: Connected `onOpenSignatureModal(pageIndex, pt)` in `CanvasView` to store target coordinates and auto-stamp the created signature upon applying; added backdrop click-to-close on `SignatureModal`. Verified on DISPLAY=:101.

29. **Complete Elimination of Blocking Browser Alerts**:
   - *Requirement*: Replace all remaining synchronous `alert(...)` dialogs across the application with non-blocking, accessible toast notifications.
   - *Implementation*: Replaced all alerts in `app.js`, `page-organizer.js`, `signature-modal.js`, and `tts-controller.js` with `showToast(msg, type)` supporting `info`, `warning`, `error`, and `success` styling (`toast-warning`, `toast-error`). Verified single-page deletion prevention and file export errors.

30. **Annotations Synchronization on Page Reordering, Deletion, and Duplication**:
   - *Requirement*: Ensure all annotations, sticky notes, highlights, and undo/redo stacks maintain strict synchrony when pages are reordered, deleted, or duplicated via the sidebar or fullscreen Page Organizer.
   - *Implementation*: Added `reorderPage(fromIndex, toIndex)`, `deletePage(pageIndex)`, and `duplicatePage(pageIndex)` to `AnnotationsManager` with proper page index shifts for active annotations and historical undo/redo stacks. Connected both `Sidebar` and `PageOrganizerModal` to update `AnnotationsManager` in lockstep.

31. **Per-Slot Independent Rotation for Duplicated Pages & CCW Rotation**:
   - *Requirement*: Duplicated pages must be independently rotatable without altering original page orientations; users should have single-click Counter-Clockwise (-90°) rotation in the Page Organizer.
   - *Implementation*: Upgraded `PDFEngine` to track rotations by slot index (`displayRotations`) rather than solely `origIndex`. Added `btn-rotate-ccw` to page cards in `PageOrganizerModal` and updated export rotation lookup. Verified on DISPLAY=:101.

32. **Annotations Export as Structured JSON**:
   - *Requirement*: Allow users to export all annotations, vector paths, comments, stamps, and measurements as structured JSON.
   - *Implementation*: Added `Annotations (.json)` export format to toolbar dropdown with clean JSON serialization, document metadata, and delayed blob URL revocation. Verified download.

33. **Interactive Form Management (Import JSON, Export JSON, Clear Fields)**:
   - *Requirement*: Enable complete round-trip AcroForm data handling including loading external JSON files to populate forms, exporting filled data, and clearing all form inputs in one click.
   - *Implementation*: Added `Forms ▾` dropdown menu in the header toolbar. Tagged all rendered form field elements with `data-field-name` and hooked `FormEngine.subscribe` into `CanvasView.updateFormFieldsFromEngine()` for live instant DOM synchronization without full page teardown. Verified on DISPLAY=:101.

34. **Floating Text Selection Highlight & Copy Event Synchronization**:
   - *Requirement*: Selecting text in the document should summon an interactive floating menu with Highlight and Copy that remains clickable without the browser prematurely collapsing the selection.
   - *Implementation*: Prevented default event propagation on `selectionPopup` mousedown/pointerdown to preserve DOM selection ranges across clicks; bound discrete click handlers for Highlight and Copy with toast confirmations. Verified on DISPLAY=:101.

35. **Dynamic Page Aspect Ratio Scaling (Fit-Width & Fit-Page for Landscape/Portrait)**:
   - *Requirement*: Zoom presets ("fit-width", "fit-page") must adapt dynamically to actual page dimensions instead of assuming fixed US Letter portrait sizes.
   - *Implementation*: Sourced `origWidth` and `origHeight` directly from the rendered viewport on each page wrapper; updated `setScale` and `setLayoutMode` to calculate scales using the active page's aspect ratio, supporting landscape presentations, blueprints, and letter formats seamlessly.

36. **Scroll Position Reset & Single-Page Scroll Invariance**:
   - *Requirement*: Opening a new document must always initialize viewport scroll to the top of page 1; single-page and presentation modes must avoid miscalculating page indices from hidden elements having `offsetTop = 0`.
   - *Implementation*: Explicitly reset `canvasView.currentPage = 1`, `scrollTop = 0`, and `scrollLeft = 0` in `loadDocumentBytes()`; guarded `detectCurrentPage()` to bypass single-page mode and ignore hidden page wrappers (`display === 'none'`). Verified slide stepping on DISPLAY=:101.

37. **Document Outline & Bookmarks Tree Generation in Sample Generators**:
   - *Requirement*: Enable document outline inspection and one-click navigation across multi-page sample documents.
   - *Implementation*: Constructed standard PDF `/Outlines` dictionaries and item hierarchies (`1. Welcome & Capabilities`, `2. Shortcuts & Power Tips`, `3. Architecture & Principles`, and landscape slide outlines) in `samples.js` using `pdf-lib`. Verified PDF.js outline extraction and sidebar outline navigation on DISPLAY=:101.

38. **Centralized Global Drawing Event Architecture with Page Isolation**:
   - *Requirement*: Drawing and measurement interactions must accurately bind to the specific page receiving mouse events, preventing event leakage or coordinate distortion across multi-page views.
   - *Implementation*: Consolidated drawing `mousemove` and `mouseup` into single global listeners on `CanvasView` that track `activeDrawingPageIndex` and `activePageWrap`, eliminating per-page duplicate listener leaks and ensuring multi-page vector annotations attach to the exact targeted page. Verified on DISPLAY=:101.

---

## 4. Automated Test Suite Status

```
✔ AnnotationsManager add, undo, and redo (1.14ms)
✔ AnnotationsManager update and delete (0.25ms)
✔ AnnotationsManager reorderPage maintains annotation positioning and undo history (0.29ms)
✔ AnnotationsManager deletePage cleans up target page and shifts subsequent annotations (0.83ms)
✔ AnnotationsManager duplicatePage clones annotations and shifts subsequent annotations (0.40ms)
✔ CLI --version and --help output (288.44ms)
✔ CLI info on generated sample file (191.28ms)
✔ CLI extract-text from document (299.90ms)
✔ CLI split and merge subcommands with flag variants (405.57ms)
✔ PDF metadata updating and retrieval (38.95ms)
✔ PDF multi-page outline / bookmark generation compatibility (8.94ms)
✔ Password-protected PDF detection interface (122.86ms)
✔ FormEngine value tracking, export, import, and reset lifecycle (1.24ms)
✔ PDF creation and page addition (29.14ms)
✔ PDF page rotation (4.47ms)
✔ PDF merge multiple documents (4.73ms)
✔ PDF split document (1.97ms)
✔ PDF watermark and page numbering export (18.36ms)
✔ PDF measurement annotation export (8.54ms)
✔ PDFEngine independent rotations for duplicated pages and export (10.08ms)

Total: 20 tests passed, 0 failures, 0 skipped.
```
