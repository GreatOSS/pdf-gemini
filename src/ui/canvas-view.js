/**
 * FolioFlux Canvas View Manager
 * Handles multi-page rendering, zooming, panning, text layers, and interactive annotation overlays.
 */

export class CanvasView {
  constructor({ container, pdfEngine, annotationsManager, formEngine, onPageChange, onScaleChange }) {
    this.container = container;
    this.pdfEngine = pdfEngine;
    this.annotationsManager = annotationsManager;
    this.formEngine = formEngine;
    this.onPageChange = onPageChange;
    this.onScaleChange = onScaleChange;

    this.scale = 1.0;
    this.layoutMode = 'continuous'; // continuous, single, two-page
    this.currentPage = 1;
    this.activeTool = 'select';
    this.toolOptions = {};
    this.renderedPages = new Set();
    this.pageWrappers = [];

    // Interaction state for active drawing
    this.isDrawing = false;
    this.drawingPoints = [];
    this.startCoord = null;
    this.activeSvgTemp = null;
    this.isPanning = false;
    this.panStart = { x: 0, y: 0, scrollLeft: 0, scrollTop: 0 };

    this.renderContainer();
    this.bindGlobalEvents();
  }

  renderContainer() {
    this.container.innerHTML = `
      <div class="canvas-container" id="canvas-scroll-container">
        <div class="pages-view-wrapper" id="pages-view-wrapper">
          <!-- Page canvas wrappers injected here -->
        </div>
      </div>
    `;
    this.scrollContainer = this.container.querySelector('#canvas-scroll-container');
    this.wrapper = this.container.querySelector('#pages-view-wrapper');
  }

  bindGlobalEvents() {
    // Scroll listener for detecting current visible page
    this.scrollContainer.addEventListener('scroll', () => {
      this.detectCurrentPage();
      this.renderVisiblePages();
    });

    // Ctrl + Mouse Wheel Zoom
    this.scrollContainer.addEventListener('wheel', (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.15 : 0.15;
        const newScale = Math.max(0.4, Math.min(3.0, (this.scale || 1.0) + delta));
        this.setScale(newScale);
        if (this.onScaleChange) this.onScaleChange(newScale);
      }
    }, { passive: false });

    // Panning with Hand tool
    this.scrollContainer.addEventListener('mousedown', (e) => {
      if (this.activeTool === 'hand' || e.button === 1) { // Hand tool or middle click
        this.isPanning = true;
        this.scrollContainer.classList.add('panning');
        this.panStart = {
          x: e.clientX,
          y: e.clientY,
          scrollLeft: this.scrollContainer.scrollLeft,
          scrollTop: this.scrollContainer.scrollTop,
        };
        e.preventDefault();
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isPanning) {
        const dx = e.clientX - this.panStart.x;
        const dy = e.clientY - this.panStart.y;
        this.scrollContainer.scrollLeft = this.panStart.scrollLeft - dx;
        this.scrollContainer.scrollTop = this.panStart.scrollTop - dy;
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isPanning) {
        this.isPanning = false;
        this.scrollContainer.classList.remove('panning');
      }
    });

    // Listen to annotation changes to update overlay
    if (this.annotationsManager) {
      this.annotationsManager.subscribe((event, data) => {
        if (event === 'change' && data) {
          this.renderAnnotationsForPage(data.pageIndex);
        } else if (event === 'clear') {
          this.renderAllAnnotations();
        }
      });
    }

    this.initSelectionPopup();
  }

  initSelectionPopup() {
    this.selectionPopup = document.createElement('div');
    this.selectionPopup.className = 'selection-popup';
    this.selectionPopup.style.display = 'none';
    this.selectionPopup.innerHTML = `
      <button id="btn-popup-highlight" title="Highlight Selection">
        <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #facc15;"></span>
        <span>Highlight</span>
      </button>
      <button id="btn-popup-copy" title="Copy Text">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>Copy</span>
      </button>
    `;
    document.body.appendChild(this.selectionPopup);

    const updatePopup = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount || this.activeTool !== 'select') {
        this.selectionPopup.style.display = 'none';
        return;
      }
      const range = sel.getRangeAt(0);
      const text = sel.toString().trim();
      if (!text) {
        this.selectionPopup.style.display = 'none';
        return;
      }

      const startEl = (range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement);
      const isInsideDoc = startEl?.closest('.textLayer') || startEl?.closest('.page-canvas-wrapper');
      if (!isInsideDoc) {
        this.selectionPopup.style.display = 'none';
        return;
      }

      const rects = range.getClientRects();
      const rect = rects.length > 0 ? rects[0] : range.getBoundingClientRect();
      if (!rect || (rect.width === 0 && rect.height === 0)) {
        this.selectionPopup.style.display = 'none';
        return;
      }

      this.currentSelectionRects = Array.from(rects).map(r => ({
        left: r.left,
        top: r.top,
        width: r.width,
        height: r.height,
      }));
      this.currentSelectionPageWrap = startEl?.closest('.page-canvas-wrapper');
      this.currentSelectionText = text;

      this.selectionPopup.style.display = 'flex';
      this.selectionPopup.style.left = `${Math.floor(rect.left + rect.width / 2)}px`;
      this.selectionPopup.style.top = `${Math.floor(rect.top)}px`;
    };

    document.addEventListener('selectionchange', () => {
      setTimeout(updatePopup, 30);
    });
    this.scrollContainer.addEventListener('mouseup', () => {
      setTimeout(updatePopup, 30);
    });

    const handleCopy = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const text = this.currentSelectionText || window.getSelection()?.toString();
      if (text) {
        navigator.clipboard.writeText(text);
      }
      this.selectionPopup.style.display = 'none';
      this.currentSelectionRects = null;
      this.currentSelectionPageWrap = null;
    };

    const handleHighlight = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const pageWrap = this.currentSelectionPageWrap;
      const rects = this.currentSelectionRects;
      if (!pageWrap || !rects || rects.length === 0) return;

      const pageIndex = parseInt(pageWrap.dataset.pageIndex, 10);
      const pageRect = pageWrap.getBoundingClientRect();

      for (const r of rects) {
        if (r.width > 2 && r.height > 2) {
          const x = (r.left - pageRect.left) / this.scale;
          const y = (r.top - pageRect.top) / this.scale;
          const width = r.width / this.scale;
          const height = r.height / this.scale;
          this.annotationsManager.addAnnotation(pageIndex, {
            type: 'highlight',
            x, y, width, height,
            color: this.toolOptions.highlighterColor || '#facc15',
            opacity: 0.45,
          });
        }
      }
      if (window.getSelection) window.getSelection().removeAllRanges();
      this.selectionPopup.style.display = 'none';
      this.currentSelectionRects = null;
      this.currentSelectionPageWrap = null;
    };

    const btnCopy = this.selectionPopup.querySelector('#btn-popup-copy');
    const btnHighlight = this.selectionPopup.querySelector('#btn-popup-highlight');
    btnCopy.addEventListener('pointerdown', handleCopy);
    btnCopy.addEventListener('click', handleCopy);
    btnHighlight.addEventListener('pointerdown', handleHighlight);
    btnHighlight.addEventListener('click', handleHighlight);
  }

  async buildPages() {
    this.wrapper.innerHTML = '';
    this.renderedPages.clear();
    this.pageWrappers = [];

    if (!this.pdfEngine || this.pdfEngine.numPages === 0) return;

    this.wrapper.className = `pages-view-wrapper ${this.layoutMode === 'two-page' ? 'two-page-layout' : ''}`;

    for (let i = 0; i < this.pdfEngine.numPages; i++) {
      const pageWrap = document.createElement('div');
      pageWrap.className = 'page-canvas-wrapper';
      pageWrap.dataset.pageIndex = i;

      // Single page mode visibility
      if (this.layoutMode === 'single' && i !== this.currentPage - 1) {
        pageWrap.style.display = 'none';
      }

      // Placeholder sizing until rendered
      pageWrap.style.width = `${Math.floor(612 * this.scale)}px`;
      pageWrap.style.height = `${Math.floor(792 * this.scale)}px`;

      const canvas = document.createElement('canvas');
      canvas.className = 'page-pdf-canvas';

      const textLayer = document.createElement('div');
      textLayer.className = 'textLayer';

      const isDrawingTool = !['select', 'hand'].includes(this.activeTool);
      const annotationOverlay = document.createElement('div');
      annotationOverlay.className = `annotation-overlay-layer ${isDrawingTool ? 'interactive' : ''}`;
      annotationOverlay.style.pointerEvents = isDrawingTool ? 'auto' : 'none';

      const svgOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgOverlay.setAttribute('class', 'annotation-svg-canvas');

      annotationOverlay.appendChild(svgOverlay);
      pageWrap.appendChild(canvas);
      pageWrap.appendChild(textLayer);
      pageWrap.appendChild(annotationOverlay);

      this.wrapper.appendChild(pageWrap);
      this.pageWrappers.push(pageWrap);

      // Attach interaction handlers to page
      this.bindPageInteractions(i, pageWrap, svgOverlay, annotationOverlay);
    }

    await this.renderVisiblePages();
    this.renderAllAnnotations();
  }

  bindPageInteractions(pageIndex, pageWrap, svgOverlay, overlayLayer) {
    const getPagePoint = (e) => {
      const rect = pageWrap.getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;
      const x = (clientX - rect.left) / this.scale;
      const y = (clientY - rect.top) / this.scale;
      return { x: Math.max(0, x), y: Math.max(0, y) };
    };

    pageWrap.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (this.activeTool === 'select' || this.activeTool === 'hand') return;

      const pt = getPagePoint(e);
      this.isDrawing = true;
      this.startCoord = pt;

      if (this.activeTool === 'pen') {
        this.drawingPoints = [pt];
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('stroke', this.toolOptions.color || '#4f46e5');
        path.setAttribute('stroke-width', (this.toolOptions.strokeWidth || 3) * this.scale);
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('fill', 'none');
        path.setAttribute('d', `M ${pt.x * this.scale} ${pt.y * this.scale}`);
        svgOverlay.appendChild(path);
        this.activeSvgTemp = path;
      } else if (this.activeTool === 'rect') {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('stroke', this.toolOptions.color || '#ef4444');
        rect.setAttribute('stroke-width', (this.toolOptions.strokeWidth || 2) * this.scale);
        rect.setAttribute('fill', 'rgba(239, 68, 68, 0.1)');
        svgOverlay.appendChild(rect);
        this.activeSvgTemp = rect;
      } else if (this.activeTool === 'circle') {
        const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        ellipse.setAttribute('stroke', this.toolOptions.color || '#ef4444');
        ellipse.setAttribute('stroke-width', (this.toolOptions.strokeWidth || 2) * this.scale);
        ellipse.setAttribute('fill', 'rgba(239, 68, 68, 0.1)');
        svgOverlay.appendChild(ellipse);
        this.activeSvgTemp = ellipse;
      } else if (this.activeTool === 'arrow') {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('stroke', this.toolOptions.color || '#ef4444');
        line.setAttribute('stroke-width', (this.toolOptions.strokeWidth || 2) * this.scale);
        svgOverlay.appendChild(line);
        this.activeSvgTemp = line;
      } else if (this.activeTool === 'text') {
        this.createTextAnnotation(pageIndex, pt);
        this.isDrawing = false;
      } else if (this.activeTool === 'note') {
        this.createNoteAnnotation(pageIndex, pt);
        this.isDrawing = false;
      } else if (this.activeTool === 'stamp') {
        this.createStampAnnotation(pageIndex, pt);
        this.isDrawing = false;
      } else if (this.activeTool === 'signature') {
        this.createSignatureAnnotation(pageIndex, pt);
        this.isDrawing = false;
      } else if (this.activeTool === 'redact') {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('stroke', '#000000');
        rect.setAttribute('fill', 'rgba(0, 0, 0, 0.8)');
        svgOverlay.appendChild(rect);
        this.activeSvgTemp = rect;
      } else if (this.activeTool === 'highlight') {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('fill', this.toolOptions.highlighterColor || '#facc15');
        rect.setAttribute('fill-opacity', '0.4');
        rect.style.mixBlendMode = 'multiply';
        svgOverlay.appendChild(rect);
        this.activeSvgTemp = rect;
      } else if (this.activeTool === 'measure') {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('stroke', this.toolOptions.color || '#4f46e5');
        line.setAttribute('stroke-width', 2 * this.scale);
        line.setAttribute('stroke-dasharray', '4 2');
        svgOverlay.appendChild(line);
        this.activeSvgTemp = line;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDrawing || !this.startCoord) return;
      const pt = getPagePoint(e);

      if (this.activeTool === 'pen' && this.activeSvgTemp) {
        this.drawingPoints.push(pt);
        let d = `M ${this.drawingPoints[0].x * this.scale} ${this.drawingPoints[0].y * this.scale}`;
        for (let i = 1; i < this.drawingPoints.length; i++) {
          d += ` L ${this.drawingPoints[i].x * this.scale} ${this.drawingPoints[i].y * this.scale}`;
        }
        this.activeSvgTemp.setAttribute('d', d);
      } else if (this.activeTool === 'rect' || this.activeTool === 'redact' || this.activeTool === 'highlight') {
        if (this.activeSvgTemp) {
          const x = Math.min(this.startCoord.x, pt.x) * this.scale;
          const y = Math.min(this.startCoord.y, pt.y) * this.scale;
          const w = Math.abs(pt.x - this.startCoord.x) * this.scale;
          const h = Math.abs(pt.y - this.startCoord.y) * this.scale;
          this.activeSvgTemp.setAttribute('x', x);
          this.activeSvgTemp.setAttribute('y', y);
          this.activeSvgTemp.setAttribute('width', w);
          this.activeSvgTemp.setAttribute('height', h);
        }
      } else if (this.activeTool === 'circle' && this.activeSvgTemp) {
        const cx = ((this.startCoord.x + pt.x) / 2) * this.scale;
        const cy = ((this.startCoord.y + pt.y) / 2) * this.scale;
        const rx = (Math.abs(pt.x - this.startCoord.x) / 2) * this.scale;
        const ry = (Math.abs(pt.y - this.startCoord.y) / 2) * this.scale;
        this.activeSvgTemp.setAttribute('cx', cx);
        this.activeSvgTemp.setAttribute('cy', cy);
        this.activeSvgTemp.setAttribute('rx', rx);
        this.activeSvgTemp.setAttribute('ry', ry);
      } else if (this.activeTool === 'arrow' && this.activeSvgTemp) {
        this.activeSvgTemp.setAttribute('x1', this.startCoord.x * this.scale);
        this.activeSvgTemp.setAttribute('y1', this.startCoord.y * this.scale);
        this.activeSvgTemp.setAttribute('x2', pt.x * this.scale);
        this.activeSvgTemp.setAttribute('y2', pt.y * this.scale);
      } else if (this.activeTool === 'measure' && this.activeSvgTemp) {
        this.activeSvgTemp.setAttribute('x1', this.startCoord.x * this.scale);
        this.activeSvgTemp.setAttribute('y1', this.startCoord.y * this.scale);
        this.activeSvgTemp.setAttribute('x2', pt.x * this.scale);
        this.activeSvgTemp.setAttribute('y2', pt.y * this.scale);
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (!this.isDrawing) return;
      this.isDrawing = false;
      const pt = getPagePoint(e);

      if (this.activeTool === 'pen' && this.drawingPoints.length > 1) {
        this.annotationsManager.addAnnotation(pageIndex, {
          type: 'ink',
          color: this.toolOptions.color || '#4f46e5',
          width: this.toolOptions.strokeWidth || 3,
          points: this.drawingPoints,
        });
      } else if (this.activeTool === 'rect') {
        const x = Math.min(this.startCoord.x, pt.x);
        const y = Math.min(this.startCoord.y, pt.y);
        const width = Math.abs(pt.x - this.startCoord.x);
        const height = Math.abs(pt.y - this.startCoord.y);
        if (width > 5 && height > 5) {
          this.annotationsManager.addAnnotation(pageIndex, {
            type: 'rect',
            x, y, width, height,
            strokeColor: this.toolOptions.color || '#ef4444',
            strokeWidth: this.toolOptions.strokeWidth || 2,
            fillColor: 'transparent',
          });
        }
      } else if (this.activeTool === 'redact') {
        const x = Math.min(this.startCoord.x, pt.x);
        const y = Math.min(this.startCoord.y, pt.y);
        const width = Math.abs(pt.x - this.startCoord.x);
        const height = Math.abs(pt.y - this.startCoord.y);
        if (width > 5 && height > 5) {
          this.annotationsManager.addAnnotation(pageIndex, {
            type: 'redaction',
            x, y, width, height,
            applied: true,
            textOverlay: 'REDACTED',
          });
        }
      } else if (this.activeTool === 'highlight') {
        const x = Math.min(this.startCoord.x, pt.x);
        const y = Math.min(this.startCoord.y, pt.y);
        const width = Math.abs(pt.x - this.startCoord.x);
        const height = Math.abs(pt.y - this.startCoord.y);
        if (width > 4 && height > 4) {
          this.annotationsManager.addAnnotation(pageIndex, {
            type: 'highlight',
            x, y, width, height,
            color: this.toolOptions.highlighterColor || '#facc15',
            opacity: 0.4,
          });
        }
      } else if (this.activeTool === 'circle') {
        const x = Math.min(this.startCoord.x, pt.x);
        const y = Math.min(this.startCoord.y, pt.y);
        const width = Math.abs(pt.x - this.startCoord.x);
        const height = Math.abs(pt.y - this.startCoord.y);
        if (width > 5 && height > 5) {
          this.annotationsManager.addAnnotation(pageIndex, {
            type: 'circle',
            x: (this.startCoord.x + pt.x) / 2,
            y: (this.startCoord.y + pt.y) / 2,
            radiusX: width / 2,
            radiusY: height / 2,
            strokeColor: this.toolOptions.color || '#ef4444',
            strokeWidth: this.toolOptions.strokeWidth || 2,
          });
        }
      } else if (this.activeTool === 'arrow') {
        this.annotationsManager.addAnnotation(pageIndex, {
          type: 'line',
          startX: this.startCoord.x,
          startY: this.startCoord.y,
          endX: pt.x,
          endY: pt.y,
          strokeColor: this.toolOptions.color || '#ef4444',
          strokeWidth: this.toolOptions.strokeWidth || 2,
        });
      } else if (this.activeTool === 'measure') {
        const dx = pt.x - this.startCoord.x;
        const dy = pt.y - this.startCoord.y;
        const distPts = Math.sqrt(dx * dx + dy * dy);
        if (distPts > 5) {
          const unit = this.toolOptions.measureUnit || 'in';
          let label = '';
          if (unit === 'in') {
            label = `${(distPts / 72).toFixed(2)} in`;
          } else if (unit === 'mm') {
            label = `${((distPts / 72) * 25.4).toFixed(1)} mm`;
          } else if (unit === 'ft') {
            label = `${(distPts / 18).toFixed(1)} ft`;
          } else if (unit === 'm') {
            label = `${(distPts / 28.346).toFixed(2)} m`;
          } else {
            label = `${Math.round(distPts)} pt`;
          }
          this.annotationsManager.addAnnotation(pageIndex, {
            type: 'measure',
            startX: this.startCoord.x,
            startY: this.startCoord.y,
            endX: pt.x,
            endY: pt.y,
            distPts,
            label,
            unit,
            color: this.toolOptions.color || '#4f46e5',
          });
        }
      }

      if (this.activeSvgTemp && this.activeSvgTemp.parentNode) {
        this.activeSvgTemp.parentNode.removeChild(this.activeSvgTemp);
      }
      this.activeSvgTemp = null;
      this.drawingPoints = [];
      this.startCoord = null;
    });
  }

  createTextAnnotation(pageIndex, pt) {
    this.annotationsManager.addAnnotation(pageIndex, {
      type: 'text',
      x: pt.x,
      y: pt.y,
      text: 'Type text here',
      fontSize: this.toolOptions.fontSize || 14,
      color: this.toolOptions.color || '#0f172a',
    });

    setTimeout(() => {
      const pageWrap = this.pageWrappers[pageIndex];
      const box = pageWrap?.querySelector('.canvas-textbox-content');
      if (box) {
        box.focus();
        if (window.getSelection && document.createRange) {
          const range = document.createRange();
          range.selectNodeContents(box);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }, 40);
  }

  createNoteAnnotation(pageIndex, pt) {
    this.annotationsManager.addAnnotation(pageIndex, {
      type: 'note',
      x: pt.x,
      y: pt.y,
      text: 'Note comment',
      color: '#facc15',
    });
  }

  createStampAnnotation(pageIndex, pt) {
    const stampType = this.toolOptions.stampType || 'APPROVED';
    this.annotationsManager.addAnnotation(pageIndex, {
      type: 'stamp',
      stampType,
      x: pt.x,
      y: pt.y,
      width: 140,
      height: 44,
    });
  }

  createSignatureAnnotation(pageIndex, pt) {
    if (this.currentSignatureData) {
      this.annotationsManager.addAnnotation(pageIndex, {
        type: 'signature',
        x: pt.x,
        y: pt.y,
        width: 160,
        height: 60,
        dataUrl: this.currentSignatureData,
      });
    } else {
      alert('Please create or draw a signature first via the Signature modal.');
    }
  }

  async renderVisiblePages() {
    if (!this.pdfEngine || this.pageWrappers.length === 0) return;

    const containerRect = this.scrollContainer.getBoundingClientRect();
    const margin = 400; // preload margin

    for (let i = 0; i < this.pageWrappers.length; i++) {
      if (this.layoutMode === 'single' && i !== this.currentPage - 1) continue;

      const pageWrap = this.pageWrappers[i];
      const rect = pageWrap.getBoundingClientRect();

      const isVisible = rect.top < containerRect.bottom + margin && rect.bottom > containerRect.top - margin;
      if (isVisible && !this.renderedPages.has(i)) {
        await this.renderPage(i);
      }
    }
  }

  async renderPage(displayIndex) {
    const pageWrap = this.pageWrappers[displayIndex];
    if (!pageWrap) return;

    const canvas = pageWrap.querySelector('.page-pdf-canvas');
    const textLayer = pageWrap.querySelector('.textLayer');

    try {
      const { viewport } = await this.pdfEngine.renderPageToCanvas(displayIndex, canvas, this.scale);
      this.renderedPages.add(displayIndex);

      pageWrap.style.width = `${Math.floor(viewport.width)}px`;
      pageWrap.style.height = `${Math.floor(viewport.height)}px`;

      // Render Text Layer
      textLayer.innerHTML = '';
      textLayer.style.width = `${Math.floor(viewport.width)}px`;
      textLayer.style.height = `${Math.floor(viewport.height)}px`;
      const allowSelect = (this.activeTool === 'select');
      textLayer.style.pointerEvents = allowSelect ? 'auto' : 'none';
      textLayer.style.userSelect = allowSelect ? 'text' : 'none';

      const textContent = await this.pdfEngine.getTextContent(displayIndex);
      this.renderTextItems(textLayer, textContent, viewport);

      // Render interactive AcroForm fields
      this.renderFormFields(pageWrap, displayIndex, viewport);

      // Render watermark and page numbers
      this.updateWatermarkForPage(pageWrap);
      this.updatePageNumberForPage(pageWrap, displayIndex);
    } catch {
      // Ignore if rendering cancelled
    }
  }

  setWatermark(watermark) {
    this.watermark = watermark;
    this.pageWrappers.forEach(pw => this.updateWatermarkForPage(pw));
  }

  setPageNumbers(pageNumbers) {
    this.pageNumbers = pageNumbers;
    this.pageWrappers.forEach((pw, i) => this.updatePageNumberForPage(pw, i));
  }

  updateWatermarkForPage(pageWrap) {
    let wm = pageWrap.querySelector('.canvas-watermark');
    if (!this.watermark) {
      if (wm) wm.remove();
      return;
    }
    if (!wm) {
      wm = document.createElement('div');
      wm.className = 'canvas-watermark';
      wm.style.position = 'absolute';
      wm.style.inset = '0';
      wm.style.display = 'flex';
      wm.style.alignItems = 'center';
      wm.style.justifyContent = 'center';
      wm.style.pointerEvents = 'none';
      wm.style.userSelect = 'none';
      wm.style.zIndex = '4';
      pageWrap.appendChild(wm);
    }
    wm.style.transform = 'rotate(-35deg)';
    wm.style.fontSize = `${54 * this.scale}px`;
    wm.style.fontWeight = '800';
    wm.style.letterSpacing = '4px';
    wm.style.color = this.watermark.color || '#dc2626';
    wm.style.opacity = this.watermark.opacity || 0.25;
    wm.textContent = this.watermark.text || '';
  }

  updatePageNumberForPage(pageWrap, pageIndex) {
    let pn = pageWrap.querySelector('.canvas-page-number-tag');
    if (!this.pageNumbers) {
      if (pn) pn.remove();
      return;
    }
    if (!pn) {
      pn = document.createElement('div');
      pn.className = 'canvas-page-number-tag';
      pn.style.position = 'absolute';
      pn.style.pointerEvents = 'none';
      pn.style.userSelect = 'none';
      pn.style.fontSize = `${11 * this.scale}px`;
      pn.style.color = '#64748b';
      pn.style.zIndex = '4';
      pageWrap.appendChild(pn);
    }
    const label = this.pageNumbers.format
      .replace('{page}', String(pageIndex + 1))
      .replace('{total}', String(this.pageWrappers.length));

    pn.textContent = label;
    if (this.pageNumbers.position === 'bottom-right') {
      pn.style.bottom = '16px';
      pn.style.right = '24px';
      pn.style.left = 'auto';
      pn.style.top = 'auto';
      pn.style.transform = 'none';
    } else if (this.pageNumbers.position === 'top-right') {
      pn.style.top = '16px';
      pn.style.right = '24px';
      pn.style.left = 'auto';
      pn.style.bottom = 'auto';
      pn.style.transform = 'none';
    } else {
      pn.style.bottom = '16px';
      pn.style.left = '50%';
      pn.style.top = 'auto';
      pn.style.right = 'auto';
      pn.style.transform = 'translateX(-50%)';
    }
  }

  renderFormFields(pageWrap, displayIndex, viewport) {
    if (!this.formEngine) return;
    let formLayer = pageWrap.querySelector('.formLayer');
    if (!formLayer) {
      formLayer = document.createElement('div');
      formLayer.className = 'formLayer';
      formLayer.style.position = 'absolute';
      formLayer.style.inset = '0';
      formLayer.style.pointerEvents = 'none';
      formLayer.style.zIndex = '8';
      pageWrap.appendChild(formLayer);
    }
    formLayer.innerHTML = '';

    const fields = this.formEngine.getFieldsForPage(displayIndex);
    for (const field of fields) {
      if (!field.rect) continue;
      const vRect = viewport.convertToViewportRectangle(field.rect);
      const left = Math.min(vRect[0], vRect[2]);
      const top = Math.min(vRect[1], vRect[3]);
      const width = Math.abs(vRect[0] - vRect[2]);
      const height = Math.abs(vRect[1] - vRect[3]);

      const wrapper = document.createElement('div');
      wrapper.className = 'form-field-wrapper';
      wrapper.style.position = 'absolute';
      wrapper.style.pointerEvents = 'auto';
      wrapper.style.left = `${left}px`;
      wrapper.style.top = `${top}px`;
      wrapper.style.width = `${width}px`;
      wrapper.style.height = `${height}px`;

      const currentVal = this.formEngine.getValue(field.fieldName) ?? field.fieldValue ?? '';

      if (field.checkBox) {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = currentVal === true || currentVal === 'Yes' || currentVal === 'On' || currentVal === 'true';
        checkbox.style.cursor = 'pointer';
        checkbox.addEventListener('change', () => {
          this.formEngine.setValue(field.fieldName, checkbox.checked);
        });
        wrapper.appendChild(checkbox);
      } else if (field.fieldType === 'Ch' && field.options) {
        const select = document.createElement('select');
        select.style.fontSize = `${Math.max(10, Math.floor(height * 0.6))}px`;
        for (const opt of field.options) {
          const option = document.createElement('option');
          option.value = typeof opt === 'string' ? opt : opt.exportValue || opt.displayValue;
          option.textContent = typeof opt === 'string' ? opt : opt.displayValue;
          if (option.value === currentVal || (Array.isArray(currentVal) && currentVal.includes(option.value))) {
            option.selected = true;
          }
          select.appendChild(option);
        }
        select.addEventListener('change', () => {
          this.formEngine.setValue(field.fieldName, select.value);
        });
        wrapper.appendChild(select);
      } else {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = Array.isArray(currentVal) ? currentVal.join('') : currentVal;
        input.style.fontSize = `${Math.max(10, Math.floor(height * 0.62))}px`;
        input.addEventListener('input', () => {
          this.formEngine.setValue(field.fieldName, input.value);
        });
        wrapper.appendChild(input);
      }

      formLayer.appendChild(wrapper);
    }
  }

  renderTextItems(container, textContent, viewport) {
    for (const item of textContent.items) {
      if (!item.str || item.str.trim() === '') continue;

      const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
      const fontHeight = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);

      const span = document.createElement('span');
      span.textContent = item.str;
      span.style.left = `${tx[4]}px`;
      span.style.top = `${tx[5] - fontHeight}px`;
      span.style.fontSize = `${fontHeight}px`;
      span.style.fontFamily = item.fontName || 'sans-serif';

      container.appendChild(span);
    }
  }

  renderAnnotationsForPage(pageIndex) {
    const pageWrap = this.pageWrappers[pageIndex];
    if (!pageWrap) return;

    const svgOverlay = pageWrap.querySelector('.annotation-svg-canvas');
    const overlayLayer = pageWrap.querySelector('.annotation-overlay-layer');

    // Clean previous non-svg annotations
    overlayLayer.querySelectorAll('.canvas-textbox, .canvas-sticky-note, .canvas-stamp, .canvas-signature, .canvas-redaction').forEach(el => el.remove());
    svgOverlay.innerHTML = '';

    const list = this.annotationsManager.getAnnotationsForPage(pageIndex);

    for (const ann of list) {
      if (ann.type === 'ink') {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let d = `M ${ann.points[0].x * this.scale} ${ann.points[0].y * this.scale}`;
        for (let i = 1; i < ann.points.length; i++) {
          d += ` L ${ann.points[i].x * this.scale} ${ann.points[i].y * this.scale}`;
        }
        path.setAttribute('d', d);
        path.setAttribute('stroke', ann.color || '#4f46e5');
        path.setAttribute('stroke-width', (ann.width || 3) * this.scale);
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('fill', 'none');
        svgOverlay.appendChild(path);
      } else if (ann.type === 'rect') {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', ann.x * this.scale);
        rect.setAttribute('y', ann.y * this.scale);
        rect.setAttribute('width', ann.width * this.scale);
        rect.setAttribute('height', ann.height * this.scale);
        rect.setAttribute('stroke', ann.strokeColor || '#ef4444');
        rect.setAttribute('stroke-width', (ann.strokeWidth || 2) * this.scale);
        rect.setAttribute('fill', ann.fillColor || 'transparent');
        svgOverlay.appendChild(rect);
      } else if (ann.type === 'highlight') {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', ann.x * this.scale);
        rect.setAttribute('y', ann.y * this.scale);
        rect.setAttribute('width', ann.width * this.scale);
        rect.setAttribute('height', ann.height * this.scale);
        rect.setAttribute('fill', ann.color || '#facc15');
        rect.setAttribute('fill-opacity', String(ann.opacity || 0.4));
        rect.style.mixBlendMode = 'multiply';
        svgOverlay.appendChild(rect);
      } else if (ann.type === 'circle') {
        const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        ellipse.setAttribute('cx', ann.x * this.scale);
        ellipse.setAttribute('cy', ann.y * this.scale);
        ellipse.setAttribute('rx', ann.radiusX * this.scale);
        ellipse.setAttribute('ry', ann.radiusY * this.scale);
        ellipse.setAttribute('stroke', ann.strokeColor || '#ef4444');
        ellipse.setAttribute('stroke-width', (ann.strokeWidth || 2) * this.scale);
        ellipse.setAttribute('fill', 'transparent');
        svgOverlay.appendChild(ellipse);
      } else if (ann.type === 'line') {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', ann.startX * this.scale);
        line.setAttribute('y1', ann.startY * this.scale);
        line.setAttribute('x2', ann.endX * this.scale);
        line.setAttribute('y2', ann.endY * this.scale);
        line.setAttribute('stroke', ann.strokeColor || '#ef4444');
        line.setAttribute('stroke-width', (ann.strokeWidth || 2) * this.scale);
        svgOverlay.appendChild(line);
      } else if (ann.type === 'measure') {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', ann.startX * this.scale);
        line.setAttribute('y1', ann.startY * this.scale);
        line.setAttribute('x2', ann.endX * this.scale);
        line.setAttribute('y2', ann.endY * this.scale);
        line.setAttribute('stroke', ann.color || '#4f46e5');
        line.setAttribute('stroke-width', 2 * this.scale);
        svgOverlay.appendChild(line);

        const dx = (ann.endX - ann.startX) * this.scale;
        const dy = (ann.endY - ann.startY) * this.scale;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = (-dy / len) * (6 * this.scale);
        const ny = (dx / len) * (6 * this.scale);

        const cap1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        cap1.setAttribute('x1', ann.startX * this.scale - nx);
        cap1.setAttribute('y1', ann.startY * this.scale - ny);
        cap1.setAttribute('x2', ann.startX * this.scale + nx);
        cap1.setAttribute('y2', ann.startY * this.scale + ny);
        cap1.setAttribute('stroke', ann.color || '#4f46e5');
        cap1.setAttribute('stroke-width', 2 * this.scale);
        svgOverlay.appendChild(cap1);

        const cap2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        cap2.setAttribute('x1', ann.endX * this.scale - nx);
        cap2.setAttribute('y1', ann.endY * this.scale - ny);
        cap2.setAttribute('x2', ann.endX * this.scale + nx);
        cap2.setAttribute('y2', ann.endY * this.scale + ny);
        cap2.setAttribute('stroke', ann.color || '#4f46e5');
        cap2.setAttribute('stroke-width', 2 * this.scale);
        svgOverlay.appendChild(cap2);

        const badge = document.createElement('div');
        badge.className = 'canvas-measure-badge';
        const midX = ((ann.startX + ann.endX) / 2) * this.scale;
        const midY = ((ann.startY + ann.endY) / 2) * this.scale;
        badge.style.position = 'absolute';
        badge.style.left = `${midX}px`;
        badge.style.top = `${midY}px`;
        badge.style.transform = 'translate(-50%, -50%)';
        badge.style.padding = '2px 6px';
        badge.style.borderRadius = '4px';
        badge.style.backgroundColor = ann.color || '#4f46e5';
        badge.style.color = '#ffffff';
        badge.style.fontSize = `${10 * this.scale}px`;
        badge.style.fontWeight = '700';
        badge.style.pointerEvents = 'auto';
        badge.style.cursor = 'pointer';
        badge.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
        badge.textContent = ann.label;
        badge.title = 'Click to delete measurement';
        badge.addEventListener('click', (e) => {
          e.stopPropagation();
          this.annotationsManager.deleteAnnotation(pageIndex, ann.id);
        });
        overlayLayer.appendChild(badge);
      } else if (ann.type === 'text') {
        const box = document.createElement('div');
        box.className = 'canvas-textbox';
        box.style.left = `${ann.x * this.scale}px`;
        box.style.top = `${ann.y * this.scale}px`;
        box.style.fontSize = `${(ann.fontSize || 14) * this.scale}px`;
        box.style.color = ann.color || '#0f172a';
        box.innerHTML = `<div class="canvas-textbox-content" contenteditable="true">${ann.text}</div>`;
        const contentEl = box.querySelector('.canvas-textbox-content');
        if (contentEl) {
          contentEl.addEventListener('input', () => {
            ann.text = contentEl.innerText;
          });
          contentEl.addEventListener('blur', () => {
            ann.text = contentEl.innerText.trim() || ann.text;
          });
        }
        this.attachDragHandler(box, ann, pageIndex);
        overlayLayer.appendChild(box);
      } else if (ann.type === 'note') {
        const note = document.createElement('div');
        note.className = 'canvas-sticky-note';
        note.style.left = `${ann.x * this.scale}px`;
        note.style.top = `${ann.y * this.scale}px`;
        note.title = ann.text;
        note.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"></path></svg>`;
        note.addEventListener('click', (e) => {
          e.stopPropagation();
          let popover = note.querySelector('.note-popover');
          if (popover) {
            popover.remove();
            return;
          }
          popover = document.createElement('div');
          popover.className = 'note-popover';
          popover.addEventListener('mousedown', (ev) => ev.stopPropagation());
          popover.innerHTML = `
            <textarea class="note-popover-text" placeholder="Add note...">${ann.text || ''}</textarea>
            <div class="note-popover-footer">
              <button class="btn-delete-note" title="Delete note">Delete</button>
              <button class="btn-save-note">Done</button>
            </div>
          `;
          note.appendChild(popover);
          const textarea = popover.querySelector('.note-popover-text');
          textarea.focus();
          textarea.addEventListener('input', () => {
            ann.text = textarea.value;
            note.title = ann.text;
          });
          popover.querySelector('.btn-save-note').addEventListener('click', (ev) => {
            ev.stopPropagation();
            ann.text = textarea.value;
            note.title = ann.text;
            popover.remove();
          });
          popover.querySelector('.btn-delete-note').addEventListener('click', (ev) => {
            ev.stopPropagation();
            this.annotationsManager.deleteAnnotation(pageIndex, ann.id);
          });
        });
        this.attachDragHandler(note, ann, pageIndex);
        overlayLayer.appendChild(note);
      } else if (ann.type === 'stamp') {
        const stamp = document.createElement('div');
        const stType = (ann.stampType || 'APPROVED').toLowerCase();
        stamp.className = `canvas-stamp ${stType}`;
        stamp.style.left = `${ann.x * this.scale}px`;
        stamp.style.top = `${ann.y * this.scale}px`;
        stamp.style.fontSize = `${16 * this.scale}px`;
        stamp.textContent = (ann.stampType || 'APPROVED').toUpperCase();
        this.attachDragHandler(stamp, ann, pageIndex);
        overlayLayer.appendChild(stamp);
      } else if (ann.type === 'signature' && ann.dataUrl) {
        const sig = document.createElement('div');
        sig.className = 'canvas-signature';
        sig.style.left = `${ann.x * this.scale}px`;
        sig.style.top = `${ann.y * this.scale}px`;
        sig.style.width = `${(ann.width || 160) * this.scale}px`;
        sig.innerHTML = `<img src="${ann.dataUrl}" alt="Signature" />`;
        this.attachDragHandler(sig, ann, pageIndex);
        overlayLayer.appendChild(sig);
      } else if (ann.type === 'redaction') {
        const red = document.createElement('div');
        red.className = 'canvas-redaction';
        red.style.left = `${ann.x * this.scale}px`;
        red.style.top = `${ann.y * this.scale}px`;
        red.style.width = `${ann.width * this.scale}px`;
        red.style.height = `${ann.height * this.scale}px`;
        red.textContent = 'REDACTED';
        overlayLayer.appendChild(red);
      }
    }
  }

  attachDragHandler(element, ann, pageIndex) {
    let isDragging = false;
    let startX = 0, startY = 0;
    let initLeft = 0, initTop = 0;

    element.addEventListener('mousedown', (e) => {
      if (e.target.isContentEditable || e.target.closest('.note-popover')) return;
      if (e.button !== 0) return;
      e.stopPropagation();

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initLeft = parseFloat(element.style.left) || 0;
      initTop = parseFloat(element.style.top) || 0;
      element.style.zIndex = '35';

      const onMouseMove = (moveEvt) => {
        if (!isDragging) return;
        const dx = moveEvt.clientX - startX;
        const dy = moveEvt.clientY - startY;
        element.style.left = `${initLeft + dx}px`;
        element.style.top = `${initTop + dy}px`;
      };

      const onMouseUp = () => {
        if (!isDragging) return;
        isDragging = false;
        element.style.zIndex = '';
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);

        const finalLeft = parseFloat(element.style.left) || 0;
        const finalTop = parseFloat(element.style.top) || 0;
        this.annotationsManager.updateAnnotation(pageIndex, ann.id, {
          x: finalLeft / this.scale,
          y: finalTop / this.scale,
        });
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
  }

  renderAllAnnotations() {
    for (let i = 0; i < this.pageWrappers.length; i++) {
      this.renderAnnotationsForPage(i);
    }
  }

  detectCurrentPage() {
    const containerTop = this.scrollContainer.scrollTop;
    let closestPage = 1;
    let minDiff = Infinity;

    for (let i = 0; i < this.pageWrappers.length; i++) {
      const top = this.pageWrappers[i].offsetTop;
      const diff = Math.abs(top - containerTop);
      if (diff < minDiff) {
        minDiff = diff;
        closestPage = i + 1;
      }
    }

    if (this.currentPage !== closestPage) {
      this.currentPage = closestPage;
      this.onPageChange(this.currentPage);
    }
  }

  scrollToPage(pageNumber) {
    const idx = pageNumber - 1;
    if (this.layoutMode === 'single') {
      this.pageWrappers.forEach((pw, i) => {
        pw.style.display = i === idx ? 'block' : 'none';
      });
      this.currentPage = pageNumber;
      this.renderVisiblePages();
      this.onPageChange(this.currentPage);
      return;
    }

    const targetWrap = this.pageWrappers[idx];
    if (targetWrap) {
      this.scrollContainer.scrollTo({
        top: targetWrap.offsetTop - 20,
        behavior: 'smooth',
      });
      this.currentPage = pageNumber;
      this.onPageChange(this.currentPage);
    }
  }

  setScale(newScale) {
    if (newScale === 'fit-width') {
      const containerWidth = this.scrollContainer.clientWidth - 80;
      this.scale = Math.max(0.2, Math.min(3.0, containerWidth / 612));
    } else if (newScale === 'fit-page') {
      const containerHeight = this.scrollContainer.clientHeight - 80;
      this.scale = Math.max(0.2, Math.min(3.0, containerHeight / 792));
    } else {
      this.scale = parseFloat(newScale);
    }

    this.renderedPages.clear();
    this.buildPages();
  }

  setLayoutMode(mode) {
    this.layoutMode = mode;
    if (mode === 'two-page') {
      const containerWidth = this.scrollContainer.clientWidth - 80;
      const fitTwo = Math.max(0.3, Math.min(1.5, containerWidth / (612 * 2 + 30)));
      if (this.scale * (612 * 2 + 30) > containerWidth) {
        this.scale = fitTwo;
        if (this.onScaleChange) this.onScaleChange(this.scale);
      }
    }
    this.buildPages();
  }

  setTool(tool, options = {}) {
    this.activeTool = tool;
    this.toolOptions = { ...this.toolOptions, ...options };

    this.scrollContainer.classList.toggle('hand-tool', tool === 'hand');

    // Deselect any native text selection when switching away from select tool
    if (tool !== 'select') {
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      }
    }

    const allowSelect = (tool === 'select');
    this.wrapper.querySelectorAll('.textLayer').forEach(tl => {
      tl.style.pointerEvents = allowSelect ? 'auto' : 'none';
      tl.style.userSelect = allowSelect ? 'text' : 'none';
    });

    const isDrawingTool = !['select', 'hand'].includes(tool);
    this.wrapper.querySelectorAll('.annotation-overlay-layer').forEach(ol => {
      ol.classList.toggle('interactive', isDrawingTool);
      ol.style.pointerEvents = isDrawingTool ? 'auto' : 'none';
    });
  }
}
