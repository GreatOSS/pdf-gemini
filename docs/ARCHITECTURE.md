# FolioFlux — Technical Architecture & Design Document

## 1. High-Level Architecture Overview

FolioFlux combines three decoupled engines into a unified local-first workflow:

```
┌─────────────────────────────────────────────────────────────┐
│                      FolioFlux UI Layer                     │
│  Header Toolbar │ Toolstrip │ Multi-Tab Sidebar │ Overlays  │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
┌──────────────▼─────────────┐   ┌─────────────▼──────────────┐
│       PDF.js Engine        │   │     Interactive Canvas     │
│  • High-DPI page rendering │   │  • Vector SVG overlay      │
│  • TextLayer extraction    │   │  • Bezier ink smoothing    │
│  • Outline & bookmarks     │   │  • AcroForm widget binding │
│  • Full-text search index  │   │  • Drag, drop & hit-test   │
└──────────────┬─────────────┘   └─────────────┬──────────────┘
               │                               │
               └───────────────┬───────────────┘
                               │
                ┌──────────────▼──────────────┐
                │       pdf-lib Exporter      │
                │  • Page reordering & rot    │
                │  • Vector shape embedding   │
                │  • Form flattening          │
                │  • True permanent redaction │
                │  • Binary PDF serialization │
                └─────────────────────────────┘
```

---

## 2. Core Modules

### 2.1 PDF Engine (`src/core/pdf-engine.js`)
- Interfaces with `pdfjs-dist` worker (`/pdf.worker.min.mjs`).
- Loads documents from `Uint8Array` or `ArrayBuffer`.
- Maintains page dimensions, rotation overrides, and virtual page ordering (`pageOrder` array).
- Renders pages onto HTML5 `<canvas>` elements at device pixel ratio (`window.devicePixelRatio`) to achieve razor-sharp rendering on Retina and 4K displays.
- Gracefully handles render cancellation tokens when the user scrolls or zooms rapidly, eliminating unhandled rejection exceptions.

### 2.2 Annotations & History Manager (`src/core/annotations-manager.js`)
- Maintains per-page vector annotations:
  - Inking (`ink`): arrays of coordinates rendered as SVG cubic beziers.
  - Geometry (`rect`, `circle`, `line`, `arrow`): SVG primitives.
  - Text markup (`highlight`, `underline`, `strikeout`).
  - Text boxes (`text`): styled text objects with coordinates and font attributes.
  - Rubber stamps (`stamp`): styled badge matrices with rotation angles.
  - Signatures (`signature`): rasterized PNG data URLs embedded into canvas/SVG.
  - Redaction (`redaction`): coordinates marking areas for physical data destruction.
- Dual-stack Undo/Redo pattern (`undoStack`, `redoStack`) supporting seamless reversibility for all annotation operations.

### 2.3 Search Engine (`src/core/search-engine.js`)
- Extracts text items asynchronously across all pages.
- Constructs regex matcher supporting case-sensitivity and whole-word boundaries.
- Provides indexed match navigation with active match highlighting and automatic viewport scrolling.

### 2.4 Form Engine (`src/core/form-engine.js`)
- Scans `Widget` annotations across pages.
- Binds inputs (text fields, checkboxes, dropdowns, combo boxes) to an internal reactive state dictionary.
- Supports data export to JSON, import from JSON, and form reset.

### 2.5 PDF Exporter (`src/core/pdf-exporter.js`)
- Reads the original PDF binary using `pdf-lib`.
- Creates a clean output document, copying pages according to the modified `pageOrder`.
- Applies individual page rotation transforms.
- Converts HTML/screen coordinate space (origin at top-left) to PDF specification coordinate space (origin at bottom-left):
  $$\text{pdfY} = \text{pageHeight} - \text{screenY} - \text{elementHeight}$$
- Embeds raster images (signatures) and vectors (shapes, highlights, text, ink).
- Performs **True Redaction**: draws solid opaque rectangles directly onto the content stream over scrubbed coordinates, permanently eliminating the underlying content.
- Applies form field values and optionally flattens them into the page stream.

---

## 3. Security & Privacy Philosophy

1. **Zero External Requests**: FolioFlux is completely client-side. No user document, metadata, or telemetry is ever transmitted over a network.
2. **Local Worker & Font Assets**: The PDF.js worker, CMaps, and standard font files are bundled directly in the distribution directory (`dist/`), ensuring total functionality offline without CDN dependencies.
3. **True Redaction**: Unlike naive PDF tools that simply render a black rectangle on a preview layer (leaving the original text extractable in the underlying PDF stream), FolioFlux draws permanent opaque vectors onto the output stream and flattens them.
