# FolioFlux 📄⚡

[Open the web app](https://greatoss.github.io/pdf-gemini/)

> **The Modern, Lightning-Fast Open-Source PDF Viewer & Editor with an Uncompromising Focus on Flawless User Experience.**

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Platform: Linux / Desktop / Web](https://img.shields.io/badge/Platform-Linux%20%7C%20Desktop%20%7C%20Web-indigo.svg)](#)
[![Privacy: 100% Local](https://img.shields.io/badge/Privacy-100%25%20Local%20%7C%20Zero%20Telemetry-emerald.svg)](#)

---

## Overview

**FolioFlux** is designed from the ground up to solve the frustrations of existing PDF tools: bloated interfaces, paywalled basic features, sluggish rendering, and intrusive cloud syncing. 

FolioFlux delivers an instant-startup, distraction-free PDF reading and editing workstation that processes 100% of your documents locally in your browser or desktop window.

---

## Key Features

### 📖 Flawless Reading & Viewing
- **Multiple Layout Modes**: Continuous vertical scrolling, single-page presentation view, and two-page (book spread) view.
- **Smart Dark Reading Mode**: Inverts white document backgrounds into comfortable dark slate while preserving the natural colors and contrast of embedded images and graphics.
- **High-DPI Razor-Sharp Rendering**: Automatically scales canvas rasterization to match your display's pixel density (`window.devicePixelRatio`).
- **Smooth Zoom & Navigation**: Fit to Width, Fit to Page, preset zoom levels (50% to 200%), or custom percentage scaling.
- **Text-to-Speech (TTS)**: Built-in accessible read-aloud controller with variable speech rate (0.8x to 1.5x).

### ✏️ Comprehensive Annotation & Markup Suite
- **Highlighter**: Multi-color highlighting (Yellow, Green, Cyan, Pink, Orange) with natural multiply blending.
- **Text Markup**: Underline and strikeout with custom styling.
- **Freehand Pen & Ink**: Sketch notes, arrows, and diagrams with smooth bezier curve interpolation, adjustable stroke widths, and an eraser tool.
- **Text Insertion**: Click anywhere to place draggable, resizable text boxes with font sizing and color options.
- **Vector Shapes**: Rectangles, circles/ellipses, arrows, and lines with customizable borders and fills.
- **Sticky Notes & Comments**: Drop pin notes anywhere on a page; view and jump through all notes via the sidebar comments list.
- **Rubber Stamps**: Pre-configured authentic stamps (`APPROVED`, `CONFIDENTIAL`, `DRAFT`, `FINAL`, `VOID`, `REVIEWED`).
- **Digital Signatures**: Draw signatures with a mouse or stylus, type calligraphic script signatures, or upload transparent PNG signatures.
- **Permanent Redaction**: Permanently blacks out and scrubs sensitive information directly from the PDF stream upon export.

### 📋 Interactive AcroForm Support
- Fill in text fields, toggle checkboxes and radio buttons, and select dropdown options.
- Form field highlighting ensures you never miss a required entry.
- **Form Flattening**: Lock and flatten form entries on save to prevent tampering.

### 🗂️ Folio Page Organizer
- **Interactive Thumbnails**: Live visual thumbnails for every page in the sidebar.
- **Drag-and-Drop Reordering**: Rearrange pages intuitively.
- **Page Rotation**: Rotate individual pages or all pages by 90° CW, 90° CCW, or 180°.
- **Duplicate, Delete & Insert**: Manage document structure with one click.
- **Merge & Split**: Combine multiple documents or extract specific page ranges.

### 🔍 Full-Text Search
- Instant `Ctrl + F` search across all document pages.
- Highlight all occurrences with active match tracking (`Match X of Y`).
- Jump smoothly between matches with keyboard navigation (`Enter` / `Shift + Enter`).

### 🔒 100% Privacy & Zero Telemetry
- No file uploads.
- No third-party tracking or analytics.
- Runs completely offline.

---

## Quick Start

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Launch

```bash
# Clone the repository
git clone https://github.com/GreatOSS/pdf-gemini.git
cd pdf-gemini

# Install dependencies
npm install

# Build static assets
npm run build

# Launch the desktop / browser app
npm start
# or open a specific document:
./bin/folioflux.js my-document.pdf
```

### Command-Line Utility (CLI)

FolioFlux includes a powerful command-line interface for common PDF tasks:

```bash
# View PDF metadata, page count, and dimensions
./bin/folioflux.js info document.pdf

# Merge multiple PDF documents into one
./bin/folioflux.js merge chapter1.pdf chapter2.pdf chapter3.pdf -o book.pdf

# Split a PDF into individual page files
./bin/folioflux.js split report.pdf -o ./output-pages

# Rotate all pages in a document
./bin/folioflux.js rotate scanned.pdf -o upright.pdf --angle 90

# Start headless server on custom port
./bin/folioflux.js serve --port 5000
```

---

## Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `Ctrl + O` | Open PDF file |
| `Ctrl + S` | Save & Download modified PDF |
| `Ctrl + P` | Print document |
| `Ctrl + F` | Find / Search in document |
| `Ctrl + Z` / `Ctrl + Y` | Undo / Redo |
| `+` / `-` | Zoom In / Zoom Out |
| `0` | Fit to width / Reset zoom |
| `PageDown` / `]` | Next page |
| `PageUp` / `[` | Previous page |
| `H` | Hand (Pan) tool |
| `V` | Selection cursor tool |
| `D` | Toggle Smart Dark Reading Mode |
| `B` | Toggle Sidebar |
| `?` | Open Help & Shortcuts cheat sheet |

---

## Documentation

- [Naming Decision & Conflict Checks](docs/NAMING.md)
- [Comprehensive User Guide](docs/USER_GUIDE.md)
- [Technical Architecture](docs/ARCHITECTURE.md)
- [Hands-on Testing & Verification](docs/TESTING.md)

---

## License

FolioFlux is licensed under the [Apache License 2.0](LICENSE).

## GitHub Pages

Pushes to `main` run tests and build the app for `/pdf-gemini/`, then deploy `dist/` with GitHub Actions. The workflow can also be started manually. PDF documents continue to be processed locally in the browser.
