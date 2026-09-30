import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker source
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  pdfjsLib.GlobalWorkerOptions.cMapUrl = '/cmaps/';
  pdfjsLib.GlobalWorkerOptions.cMapPacked = true;
  pdfjsLib.GlobalWorkerOptions.standardFontDataUrl = '/standard_fonts/';
}

export class PDFEngine {
  constructor() {
    this.pdfDoc = null;
    this.rawData = null;
    this.numPages = 0;
    this.pageRotations = new Map(); // pageIndex -> rotation degrees (0, 90, 180, 270)
    this.displayRotations = []; // slot-based rotation degrees matching pageOrder
    this.pageOrder = []; // array of original page indices
    this.metadata = {};
    this.outline = [];
    this.renderTasks = new Map(); // pageIndex -> active renderTask
  }

  /**
   * Loads a PDF document from Uint8Array or ArrayBuffer.
   * @param {Uint8Array|ArrayBuffer} data
   * @param {string} name
   * @param {Function} [onPassword] Optional callback (updatePassword, reason) for encrypted PDFs
   */
  async loadDocument(data, name = 'document.pdf', onPassword = null) {
    this.destroy();

    // Copy buffer to prevent detached buffer issues
    if (data instanceof ArrayBuffer) {
      this.rawData = new Uint8Array(data.slice(0));
    } else if (data instanceof Uint8Array) {
      this.rawData = new Uint8Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
    } else {
      throw new Error('Unsupported data format for PDFEngine.loadDocument');
    }

    // Make an independent copy for PDF.js since workers can detach the buffer
    const workerData = new Uint8Array(this.rawData.slice(0));

    const loadingTask = pdfjsLib.getDocument({
      data: workerData,
      cMapUrl: '/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: '/standard_fonts/',
    });

    if (typeof onPassword === 'function') {
      loadingTask.onPassword = onPassword;
    }

    this.pdfDoc = await loadingTask.promise;
    this.numPages = this.pdfDoc.numPages;
    this.fileName = name;

    // Initialize page ordering and default rotations
    this.pageOrder = Array.from({ length: this.numPages }, (_, i) => i);
    this.displayRotations = Array.from({ length: this.numPages }, () => 0);
    this.pageRotations.clear();

    // Fetch metadata
    try {
      const meta = await this.pdfDoc.getMetadata();
      this.metadata = {
        title: meta.info?.Title || name,
        author: meta.info?.Author || 'Unknown',
        subject: meta.info?.Subject || '',
        keywords: meta.info?.Keywords || '',
        creator: meta.info?.Creator || 'FolioFlux',
        producer: meta.info?.Producer || 'FolioFlux Engine',
        creationDate: meta.info?.CreationDate || '',
        pages: this.numPages,
      };
    } catch {
      this.metadata = { title: name, pages: this.numPages };
    }

    // Fetch outline / bookmarks
    try {
      this.outline = (await this.pdfDoc.getOutline()) || [];
    } catch {
      this.outline = [];
    }

    return this.metadata;
  }

  /**
   * Gets a specific page proxy by its original page number (1-indexed).
   */
  async getPage(pageNumber) {
    if (!this.pdfDoc) throw new Error('No PDF document loaded');
    return await this.pdfDoc.getPage(pageNumber);
  }

  /**
   * Gets effective rotation for a displayed page index.
   */
  getPageRotation(displayIndex) {
    if (this.displayRotations && typeof this.displayRotations[displayIndex] === 'number') {
      return (this.displayRotations[displayIndex] || 0) % 360;
    }
    const origIndex = this.pageOrder[displayIndex];
    return (this.pageRotations.get(origIndex) || 0) % 360;
  }

  /**
   * Rotates a page by deltaDegrees (typically 90 or -90).
   */
  rotatePage(displayIndex, deltaDegrees = 90) {
    if (!this.displayRotations || this.displayRotations.length !== this.pageOrder.length) {
      this.displayRotations = Array.from({ length: this.pageOrder.length }, (_, i) => {
        const orig = this.pageOrder[i];
        return this.pageRotations.get(orig) || 0;
      });
    }
    const current = this.displayRotations[displayIndex] || 0;
    const next = (current + deltaDegrees + 360) % 360;
    this.displayRotations[displayIndex] = next;

    const origIndex = this.pageOrder[displayIndex];
    this.pageRotations.set(origIndex, next);
    return next;
  }

  /**
   * Rotates all pages by deltaDegrees.
   */
  rotateAllPages(deltaDegrees = 90) {
    for (let i = 0; i < this.pageOrder.length; i++) {
      this.rotatePage(i, deltaDegrees);
    }
  }

  /**
   * Reorders pages by moving page from sourceIndex to targetIndex.
   */
  reorderPage(sourceIndex, targetIndex) {
    if (sourceIndex === targetIndex) return;
    const [moved] = this.pageOrder.splice(sourceIndex, 1);
    this.pageOrder.splice(targetIndex, 0, moved);
    if (this.displayRotations) {
      const [rot] = this.displayRotations.splice(sourceIndex, 1);
      this.displayRotations.splice(targetIndex, 0, rot);
    }
  }

  /**
   * Deletes a page at displayIndex.
   */
  deletePage(displayIndex) {
    if (this.pageOrder.length <= 1) {
      throw new Error('Cannot delete the only page in the document.');
    }
    this.pageOrder.splice(displayIndex, 1);
    if (this.displayRotations) {
      this.displayRotations.splice(displayIndex, 1);
    }
    this.numPages = this.pageOrder.length;
  }

  /**
   * Duplicates a page at displayIndex.
   */
  duplicatePage(displayIndex) {
    const origIndex = this.pageOrder[displayIndex];
    this.pageOrder.splice(displayIndex + 1, 0, origIndex);
    if (this.displayRotations) {
      const curRot = this.displayRotations[displayIndex] || 0;
      this.displayRotations.splice(displayIndex + 1, 0, curRot);
    }
    this.numPages = this.pageOrder.length;
  }

  /**
   * Cancels any active render task for a given display index.
   */
  cancelRender(displayIndex) {
    if (this.renderTasks.has(displayIndex)) {
      try {
        this.renderTasks.get(displayIndex).cancel();
      } catch {
        // ignore cancellation errors
      }
      this.renderTasks.delete(displayIndex);
    }
  }

  /**
   * Renders a page to an HTML canvas at high DPI.
   */
  async renderPageToCanvas(displayIndex, canvas, scale = 1.0) {
    this.cancelRender(displayIndex);

    const origIndex = this.pageOrder[displayIndex];
    const page = await this.getPage(origIndex + 1);
    const rotation = (page.rotate + this.getPageRotation(displayIndex)) % 360;

    const viewport = page.getViewport({ scale, rotation });
    const pixelRatio = window.devicePixelRatio || 1;

    canvas.width = Math.floor(viewport.width * pixelRatio);
    canvas.height = Math.floor(viewport.height * pixelRatio);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const renderTask = page.render({
      canvasContext: ctx,
      viewport: viewport,
      intent: 'display',
    });

    this.renderTasks.set(displayIndex, renderTask);

    try {
      await renderTask.promise;
      this.renderTasks.delete(displayIndex);
      return { viewport, page };
    } catch (err) {
      if (err.name !== 'RenderingCancelledException') {
        console.error('Render page error:', err);
      }
      throw err;
    }
  }

  /**
   * Extracts text content and geometry for text selection and search highlights.
   */
  async getTextContent(displayIndex) {
    const origIndex = this.pageOrder[displayIndex];
    const page = await this.getPage(origIndex + 1);
    return await page.getTextContent();
  }

  /**
   * Destroys current document and releases memory.
   */
  destroy() {
    for (const [, task] of this.renderTasks) {
      try {
        task.cancel();
      } catch {}
    }
    this.renderTasks.clear();

    if (this.pdfDoc) {
      try {
        this.pdfDoc.destroy();
      } catch {}
      this.pdfDoc = null;
    }
    this.rawData = null;
    this.pageRotations.clear();
    this.displayRotations = [];
    this.pageOrder = [];
  }
}
