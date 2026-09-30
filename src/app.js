/**
 * FolioFlux Main Application Controller
 * Orchestrates PDF engine, viewports, annotations, modals, and user interactions.
 */

import { PDFEngine } from './core/pdf-engine.js';
import { AnnotationsManager } from './core/annotations-manager.js';
import { SearchEngine } from './core/search-engine.js';
import { FormEngine } from './core/form-engine.js';
import { PDFExporter } from './core/pdf-exporter.js';
import { createTourSamplePDF, createContractSamplePDF, createPresentationSamplePDF } from './core/samples.js';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

import { Toolbar } from './ui/toolbar.js';
import { Sidebar } from './ui/sidebar.js';
import { CanvasView } from './ui/canvas-view.js';
import { SearchBar } from './ui/search-bar.js';
import { SignatureModal } from './ui/signature-modal.js';
import { PageOrganizerModal } from './ui/page-organizer.js';
import { PropertiesModal } from './ui/properties-dialog.js';
import { ShortcutsModal } from './ui/shortcuts-dialog.js';
import { TTSController } from './ui/tts-controller.js';
import { WatermarkModal } from './ui/watermark-modal.js';
import { PasswordModal } from './ui/password-dialog.js';

export class FolioFluxApp {
  constructor() {
    this.pdfEngine = new PDFEngine();
    this.annotationsManager = new AnnotationsManager();
    this.searchEngine = new SearchEngine(this.pdfEngine);
    this.formEngine = new FormEngine(this.pdfEngine);

    this.watermark = null;
    this.pageNumbers = null;
    this.isDarkMode = false;
    this.isDocInvert = false;
    this.readingMode = 'light'; // light, dark, sepia

    window.showToast = this.showToast.bind(this);

    this.initUI();
    this.bindKeyboardShortcuts();
    this.bindDropZone();

    // Check for initial document provided by CLI or load welcome tour sample
    this.initDocument();
  }

  async initDocument() {
    try {
      const resp = await fetch('/api/initial-document');
      if (resp.ok) {
        const buffer = await resp.arrayBuffer();
        const disposition = resp.headers.get('Content-Disposition') || '';
        const match = disposition.match(/filename="(.+)"/);
        const fileName = match ? match[1] : 'document.pdf';
        await this.loadDocumentBytes(new Uint8Array(buffer), fileName);
        return;
      }
    } catch {}

    // Fallback: auto-load welcome tour sample so the app is immediately alive and ready to use
    await this.loadSampleTour();
  }

  initUI() {
    const headerContainer = document.getElementById('header-mount');
    const sidebarContainer = document.getElementById('sidebar-mount');
    const canvasContainer = document.getElementById('canvas-mount');

    // Toolbar
    this.toolbar = new Toolbar({
      container: headerContainer,
      onAction: (action, data) => this.handleToolbarAction(action, data),
      onToolChange: (tool, options) => {
        this.canvasView.setTool(tool, options);
        if (tool === 'signature' && !this.canvasView.currentSignatureData) {
          this.signatureModal.open();
        }
      },
    });

    // Canvas View
    this.canvasView = new CanvasView({
      container: canvasContainer,
      pdfEngine: this.pdfEngine,
      annotationsManager: this.annotationsManager,
      formEngine: this.formEngine,
      onPageChange: (pageNum) => {
        this.toolbar.setCurrentPage(pageNum);
        this.sidebar.setActivePage(pageNum - 1);
        if (this.isPresentationMode) {
          this.updatePresentationHud();
        }
      },
      onScaleChange: (scale) => {
        this.toolbar.setZoom(scale);
      },
      onOpenSignatureModal: (pageIndex, pt) => {
        this.pendingSignaturePoint = { pageIndex, pt };
        this.signatureModal.open();
      },
    });

    // Sidebar
    this.sidebar = new Sidebar({
      container: sidebarContainer,
      pdfEngine: this.pdfEngine,
      annotationsManager: this.annotationsManager,
      searchEngine: this.searchEngine,
      onAction: (action, data) => this.handleSidebarAction(action, data),
    });

    // Floating Search Bar
    this.searchBar = new SearchBar({
      container: document.body,
      searchEngine: this.searchEngine,
      onJumpToMatch: (match) => {
        this.canvasView.scrollToPage(match.pageIndex + 1);
      },
    });

    // Modals
    this.signatureModal = new SignatureModal({
      onApply: (dataUrl) => {
        this.canvasView.currentSignatureData = dataUrl;
        if (this.pendingSignaturePoint) {
          const { pageIndex, pt } = this.pendingSignaturePoint;
          this.canvasView.createSignatureAnnotation(pageIndex, pt);
          this.pendingSignaturePoint = null;
          this.showToast('Signature placed on document!');
        } else {
          this.showToast('Signature ready! Click anywhere on a page to stamp it.');
        }
      },
    });

    this.organizerModal = new PageOrganizerModal({
      pdfEngine: this.pdfEngine,
      annotationsManager: this.annotationsManager,
      onApply: async () => {
        await this.canvasView.buildPages();
        await this.sidebar.updateContent();
        this.toolbar.setDocumentInfo({
          numPages: this.pdfEngine.numPages,
          currentPage: this.canvasView.currentPage,
        });
      },
    });

    this.propertiesModal = new PropertiesModal({
      pdfEngine: this.pdfEngine,
      onSave: (meta) => {
        this.toolbar.setDocumentInfo({
          title: meta.title,
          numPages: this.pdfEngine.numPages,
          currentPage: this.canvasView.currentPage,
        });
        this.showToast('Document metadata updated!');
      },
    });
    this.shortcutsModal = new ShortcutsModal();
    this.passwordModal = new PasswordModal();
    this.ttsController = new TTSController({
      pdfEngine: this.pdfEngine,
      getCurrentPage: () => this.canvasView.currentPage,
    });

    this.watermarkModal = new WatermarkModal({
      onApplyWatermark: (wm) => {
        this.watermark = wm;
        this.canvasView.setWatermark(wm);
        this.showToast(`Watermark "${wm.text}" applied!`);
      },
      onRemoveWatermark: () => {
        this.watermark = null;
        this.canvasView.setWatermark(null);
        this.showToast('Watermark removed.');
      },
      onApplyPageNumbers: (pn) => {
        this.pageNumbers = pn;
        this.canvasView.setPageNumbers(pn);
        this.showToast('Page numbering applied!');
      },
      onRemovePageNumbers: () => {
        this.pageNumbers = null;
        this.canvasView.setPageNumbers(null);
        this.showToast('Page numbering removed.');
      },
    });
  }

  async handleToolbarAction(action, data) {
    if (action === 'toggle-sidebar') {
      this.sidebar.toggleCollapse();
    } else if (action === 'open-signature-modal') {
      this.signatureModal.open();
    } else if (action === 'open-watermark-modal') {
      this.watermarkModal.open();
    } else if (action === 'prev-page') {
      const p = Math.max(1, this.canvasView.currentPage - 1);
      this.canvasView.scrollToPage(p);
    } else if (action === 'next-page') {
      const p = Math.min(this.pdfEngine.numPages, this.canvasView.currentPage + 1);
      this.canvasView.scrollToPage(p);
    } else if (action === 'goto-page') {
      const p = Math.max(1, Math.min(this.pdfEngine.numPages, data));
      this.canvasView.scrollToPage(p);
    } else if (action === 'zoom-in') {
      const newScale = Math.min(3.0, (this.canvasView.scale || 1.0) + 0.25);
      this.canvasView.setScale(newScale);
      this.toolbar.setZoom(newScale);
    } else if (action === 'zoom-out') {
      const newScale = Math.max(0.4, (this.canvasView.scale || 1.0) - 0.25);
      this.canvasView.setScale(newScale);
      this.toolbar.setZoom(newScale);
    } else if (action === 'set-zoom') {
      this.canvasView.setScale(data);
    } else if (action === 'set-layout-mode') {
      this.canvasView.setLayoutMode(data);
    } else if (action === 'undo') {
      this.annotationsManager.undo();
    } else if (action === 'redo') {
      this.annotationsManager.redo();
    } else if (action === 'toggle-search') {
      this.searchBar.toggle();
    } else if (action === 'organize-pages') {
      this.organizerModal.open();
    } else if (action === 'toggle-tts') {
      this.ttsController.toggle();
    } else if (action === 'toggle-dark') {
      this.cycleReadingMode();
    } else if (action === 'show-properties') {
      this.propertiesModal.open();
    } else if (action === 'print-document') {
      this.printDocument();
    } else if (action === 'show-shortcuts') {
      this.shortcutsModal.open();
    } else if (action === 'toggle-presentation') {
      this.togglePresentationMode();
    } else if (action === 'load-sample') {
      if (data === 'tour') this.loadSampleTour();
      else if (data === 'nda') this.loadSampleContract();
      else if (data === 'slides') this.loadSamplePresentation();
      else if (data === 'blank') this.loadBlankDocument();
    } else if (action === 'export-format') {
      if (data === 'pdf') this.savePDF();
      else if (data === 'png') this.exportImages();
      else if (data === 'txt') this.exportText();
      else if (data === 'json') this.exportFormData();
      else if (data === 'annotations') this.exportAnnotations();
    } else if (action === 'open-file') {
      this.loadFile(data);
    } else if (action === 'save-pdf') {
      this.savePDF();
    } else if (action === 'reset-form') {
      this.formEngine.reset();
      this.showToast('All form fields cleared.', 'info');
    } else if (action === 'import-form') {
      this.importFormData(data);
    } else if (action === 'show-options-menu') {
      this.shortcutsModal.open();
    } else if (action === 'rename-doc') {
      if (this.pdfEngine.metadata) {
        this.pdfEngine.metadata.title = data;
      }
    }
  }

  async handleSidebarAction(action, data) {
    if (action === 'goto-page') {
      this.canvasView.scrollToPage(data);
    } else if (action === 'rotate-page') {
      this.pdfEngine.rotatePage(data.pageIndex, data.degrees);
      await this.canvasView.renderPage(data.pageIndex);
      this.sidebar.updateContent();
    } else if (action === 'rotate-all') {
      this.pdfEngine.rotateAllPages(data || 90);
      await this.canvasView.buildPages();
      this.sidebar.updateContent();
    } else if (action === 'delete-page') {
      if (this.pdfEngine.numPages <= 1) {
        this.showToast('Cannot delete the only page in the document.', 'warning');
        return;
      }
      this.pdfEngine.deletePage(data);
      this.annotationsManager.deletePage(data);
      await this.canvasView.buildPages();
      this.sidebar.updateContent();
      this.toolbar.setDocumentInfo({
        numPages: this.pdfEngine.numPages,
        currentPage: Math.min(this.canvasView.currentPage, this.pdfEngine.numPages),
      });
    } else if (action === 'reorder-page') {
      this.pdfEngine.reorderPage(data.sourceIndex, data.targetIndex);
      this.annotationsManager.reorderPage(data.sourceIndex, data.targetIndex);
      await this.canvasView.buildPages();
      this.sidebar.updateContent();
    }
  }

  async loadDocumentBytes(bytes, fileName = 'document.pdf') {
    this.hideWelcome();
    this.annotationsManager.clear();

    const onPassword = async (updatePassword, reason) => {
      try {
        const pwd = await this.passwordModal.prompt(reason);
        updatePassword(pwd);
      } catch {
        updatePassword(new Error('Password prompt cancelled.'));
      }
    };

    const meta = await this.pdfEngine.loadDocument(bytes, fileName, onPassword);
    await this.formEngine.loadFields();

    this.toolbar.setDocumentInfo({
      title: meta.title || fileName,
      numPages: this.pdfEngine.numPages,
      currentPage: 1,
    });

    await this.canvasView.buildPages();
    await this.sidebar.updateContent();

    this.showToast(`Loaded ${fileName} (${this.pdfEngine.numPages} pages)`);
  }

  async loadFile(file) {
    if (!file) return;
    const buffer = await file.arrayBuffer();
    await this.loadDocumentBytes(new Uint8Array(buffer), file.name);
  }

  async loadSampleTour() {
    const bytes = await createTourSamplePDF();
    await this.loadDocumentBytes(bytes, 'FolioFlux-Quickstart-Guide.pdf');
  }

  async loadSampleContract() {
    const bytes = await createContractSamplePDF();
    await this.loadDocumentBytes(bytes, 'Mutual-NDA-Interactive-Form.pdf');
  }

  async loadSamplePresentation() {
    const bytes = await createPresentationSamplePDF();
    await this.loadDocumentBytes(bytes, 'FolioFlux-Landscape-Slides.pdf');
  }

  async loadBlankDocument() {
    try {
      const doc = await PDFDocument.create();
      const page = doc.addPage([612, 792]);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      page.drawText('FolioFlux Blank Document', {
        x: 50,
        y: 740,
        size: 18,
        font,
        color: rgb(0.2, 0.25, 0.35),
      });
      const bytes = await doc.save();
      await this.loadDocumentBytes(bytes, 'Blank-Document.pdf');
    } catch (err) {
      console.error('Error creating blank doc:', err);
    }
  }

  async exportImages() {
    try {
      this.showToast('Exporting current page image...');
      const curPageIdx = this.canvasView.currentPage - 1;
      const origIndex = this.pdfEngine.pageOrder[curPageIdx];
      const page = await this.pdfEngine.getPage(origIndex + 1);
      const viewport = page.getViewport({ scale: 2.0 });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const title = (this.pdfEngine.metadata?.title || 'page').replace(/[^a-zA-Z0-9_-]/g, '_');
        a.download = `${title}-page-${curPageIdx + 1}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showToast(`Page ${curPageIdx + 1} exported as PNG!`);
      }, 'image/png');
    } catch (err) {
      console.error('Export image error:', err);
      this.showToast('Failed to export image: ' + err.message, 'error');
    }
  }

  async exportText() {
    try {
      this.showToast('Extracting plain text...');
      let fullText = `FolioFlux Plain Text Export\nDocument: ${this.pdfEngine.metadata?.title || 'Untitled'}\nPages: ${this.pdfEngine.numPages}\n\n`;

      for (let i = 0; i < this.pdfEngine.numPages; i++) {
        fullText += `==================== PAGE ${i + 1} ====================\n\n`;
        const content = await this.pdfEngine.getTextContent(i);
        const pageText = content.items.map(it => it.str).join(' ');
        fullText += pageText + '\n\n';
      }

      const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const title = (this.pdfEngine.metadata?.title || 'document').replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `${title}-extracted-text.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      this.showToast('Document text exported as .txt!');
    } catch (err) {
      console.error('Export text error:', err);
      this.showToast('Failed to extract text: ' + err.message, 'error');
    }
  }

  exportFormData() {
    try {
      const data = this.formEngine.exportData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const title = (this.pdfEngine.metadata?.title || 'form').replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `${title}-form-data.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      this.showToast('Form data exported as JSON!');
    } catch (err) {
      console.error('Export form data error:', err);
      this.showToast('Failed to export form data: ' + err.message, 'error');
    }
  }

  importFormData(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (typeof parsed !== 'object' || parsed === null) {
          throw new Error('Invalid JSON format');
        }
        this.formEngine.importData(parsed);
        const count = Object.keys(parsed).length;
        this.showToast(`Imported ${count} form field${count === 1 ? '' : 's'}!`, 'success');
      } catch (err) {
        console.error('Import form data error:', err);
        this.showToast('Failed to import form data: ' + err.message, 'error');
      }
    };
    reader.onerror = () => {
      this.showToast('Failed to read form data file', 'error');
    };
    reader.readAsText(file);
  }

  exportAnnotations() {
    try {
      const allAnnotations = this.annotationsManager.getAllAnnotations();
      const payload = {
        document: this.pdfEngine.metadata?.title || 'document',
        exportedAt: new Date().toISOString(),
        totalAnnotations: allAnnotations.length,
        annotations: allAnnotations,
      };
      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const title = (this.pdfEngine.metadata?.title || 'document').replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `${title}-annotations.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      this.showToast('Annotations exported as JSON!');
    } catch (err) {
      console.error('Export annotations error:', err);
      this.showToast('Failed to export annotations: ' + err.message, 'error');
    }
  }

  async savePDF() {
    try {
      this.showToast('Compiling and saving PDF...');
      const outputBytes = await PDFExporter.exportDocument({
        pdfEngine: this.pdfEngine,
        annotationsManager: this.annotationsManager,
        formEngine: this.formEngine,
        flattenForms: true,
        watermark: this.watermark,
        pageNumbers: this.pageNumbers,
      });

      const blob = new Blob([outputBytes], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const title = (this.pdfEngine.metadata?.title || 'document').replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `${title}-edited.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      this.showToast('PDF successfully saved & downloaded!');
    } catch (err) {
      console.error('Failed to save PDF:', err);
      this.showToast('Error saving PDF: ' + err.message, 'error');
    }
  }

  printDocument() {
    window.print();
  }

  cycleReadingMode() {
    if (!this.readingMode || this.readingMode === 'light') {
      this.readingMode = 'dark';
      this.isDocInvert = true;
      document.body.classList.remove('doc-sepia');
      document.body.classList.add('doc-invert');
      document.body.setAttribute('data-theme', 'dark');
      this.showToast('Smart Dark Reading Mode ON');
    } else if (this.readingMode === 'dark') {
      this.readingMode = 'sepia';
      this.isDocInvert = false;
      document.body.classList.remove('doc-invert');
      document.body.classList.add('doc-sepia');
      document.body.setAttribute('data-theme', 'light');
      this.showToast('Warm Paper / Sepia Mode ON');
    } else {
      this.readingMode = 'light';
      this.isDocInvert = false;
      document.body.classList.remove('doc-invert', 'doc-sepia');
      document.body.setAttribute('data-theme', 'light');
      this.showToast('Standard Reading Mode');
    }
  }

  togglePresentationMode() {
    this.isPresentationMode = !this.isPresentationMode;
    document.body.classList.toggle('presentation-mode', this.isPresentationMode);

    if (this.isPresentationMode) {
      this.canvasView.setLayoutMode('single');
      this.canvasView.setScale('fit-page');
      this.renderPresentationHud();
      this.showToast('Presentation Mode (Press Esc or P to exit)');
    } else {
      const hud = document.getElementById('presentation-hud');
      if (hud) hud.remove();
      this.canvasView.setLayoutMode('continuous');
      this.canvasView.setScale(1.0);
    }
  }

  renderPresentationHud() {
    let hud = document.getElementById('presentation-hud');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'presentation-hud';
      hud.className = 'presentation-hud';
      document.body.appendChild(hud);
    }
    hud.innerHTML = `
      <button id="hud-prev" title="Previous Slide">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
      <span id="hud-page" style="font-size: 13px; font-weight: 600;">${this.canvasView.currentPage} / ${this.pdfEngine.numPages}</span>
      <button id="hud-next" title="Next Slide">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>
      <button id="hud-exit" title="Exit Presentation" style="margin-left: 8px; font-size: 12px; font-weight: 600; padding: 2px 8px; background: rgba(255,255,255,0.2); border-radius: 4px;">Exit</button>
    `;

    hud.querySelector('#hud-prev').addEventListener('click', () => {
      this.canvasView.scrollToPage(Math.max(1, this.canvasView.currentPage - 1));
      this.updatePresentationHud();
    });
    hud.querySelector('#hud-next').addEventListener('click', () => {
      this.canvasView.scrollToPage(Math.min(this.pdfEngine.numPages, this.canvasView.currentPage + 1));
      this.updatePresentationHud();
    });
    hud.querySelector('#hud-exit').addEventListener('click', () => {
      this.togglePresentationMode();
    });
  }

  updatePresentationHud() {
    const pageSpan = document.getElementById('hud-page');
    if (pageSpan) {
      pageSpan.textContent = `${this.canvasView.currentPage} / ${this.pdfEngine.numPages}`;
    }
  }

  showOptionsMenu() {
    this.shortcutsModal.open();
  }

  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Don't capture when typing in inputs
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'o' || e.key === 'O') {
          e.preventDefault();
          document.getElementById('file-input').click();
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          this.savePDF();
        } else if (e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          this.printDocument();
        } else if (e.key === 'i' || e.key === 'I') {
          e.preventDefault();
          this.propertiesModal.open();
        } else if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          this.searchBar.open();
        } else if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          if (e.shiftKey) this.annotationsManager.redo();
          else this.annotationsManager.undo();
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          this.annotationsManager.redo();
        }
      } else {
        if (e.key === '?' || e.key === 'F1') {
          e.preventDefault();
          this.shortcutsModal.open();
        } else if (e.key === '+' || e.key === '=') {
          this.handleToolbarAction('zoom-in');
        } else if (e.key === '-') {
          this.handleToolbarAction('zoom-out');
        } else if (e.key === '0') {
          this.canvasView.setScale('fit-width');
        } else if (e.key === 'PageDown' || e.key === ']') {
          this.handleToolbarAction('next-page');
        } else if (e.key === 'PageUp' || e.key === '[') {
          this.handleToolbarAction('prev-page');
        } else if (e.key === 'd' || e.key === 'D') {
          this.cycleReadingMode();
        } else if (e.key === 'b' || e.key === 'B') {
          this.sidebar.toggleCollapse();
        } else if (e.key === 'h' || e.key === 'H') {
          this.toolbar.setActiveTool('hand');
        } else if (e.key === 'v' || e.key === 'V') {
          this.toolbar.setActiveTool('select');
        } else if (e.key === 'e' || e.key === 'E') {
          this.toolbar.setActiveTool('highlight');
        } else if (e.key === 't' || e.key === 'T') {
          this.toolbar.setActiveTool('text');
        } else if (e.key === 'n' || e.key === 'N') {
          this.toolbar.setActiveTool('note');
        } else if (e.key === 'r' || e.key === 'R') {
          this.toolbar.setActiveTool('rect');
        } else if (e.key === 'c' || e.key === 'C') {
          this.toolbar.setActiveTool('circle');
        } else if (e.key === 'm' || e.key === 'M') {
          this.toolbar.setActiveTool('measure');
        } else if (e.key === 'p' || e.key === 'P') {
          this.togglePresentationMode();
        } else if (e.key === 'Escape') {
          if (this.isPresentationMode) this.togglePresentationMode();
          this.shortcutsModal.close();
          this.propertiesModal.close();
          this.passwordModal?.close();
          this.watermarkModal?.close();
          this.organizerModal?.close();
          this.signatureModal?.close();
          this.searchBar?.close();
        } else if (e.key === 'ArrowRight' || (e.key === ' ' && this.isPresentationMode)) {
          this.handleToolbarAction('next-page');
        } else if (e.key === 'ArrowLeft') {
          this.handleToolbarAction('prev-page');
        } else if (e.key === 'Home') {
          this.canvasView.scrollToPage(1);
        } else if (e.key === 'End') {
          this.canvasView.scrollToPage(this.pdfEngine.numPages);
        } else if (e.key === 'j') {
          this.canvasView.scrollContainer.scrollTop += 80;
        } else if (e.key === 'k') {
          this.canvasView.scrollContainer.scrollTop -= 80;
        } else if (e.key === '?') {
          this.shortcutsModal.open();
        }
      }
    });
  }

  bindDropZone() {
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });

    window.addEventListener('drop', (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file && (file.type === 'application/pdf' || file.name.endsWith('.pdf'))) {
        this.loadFile(file);
      }
    });
  }

  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'toast-error' : type === 'warning' ? 'toast-warning' : type === 'success' ? 'toast-success' : ''}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  hideWelcome() {
    const welcome = document.getElementById('welcome-screen');
    if (welcome) welcome.style.display = 'none';
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new FolioFluxApp();
});
