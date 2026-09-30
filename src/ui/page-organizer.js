/**
 * FolioFlux Fullscreen Page Organizer Modal
 * Visual grid for reordering, rotating, deleting, and inserting pages.
 */

export class PageOrganizerModal {
  constructor({ pdfEngine, annotationsManager, onApply }) {
    this.pdfEngine = pdfEngine;
    this.annotationsManager = annotationsManager;
    this.onApply = onApply;
    this.isOpen = false;

    this.render();
    this.bindEvents();
  }

  render() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.style.display = 'none';

    this.overlay.innerHTML = `
      <div class="modal-dialog" style="max-width: 880px; width: 95%; height: 80vh;">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">Organize Pages</h3>
            <span style="font-size: 12px; color: var(--text-muted);">Drag and drop pages to reorder, or use quick rotate and delete tools.</span>
          </div>
          <button class="btn-icon btn-close-modal" title="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div class="modal-body" style="background-color: var(--bg-canvas); padding: 24px;">
          <div id="organizer-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px;">
            <!-- Page tiles -->
          </div>
        </div>

        <div class="modal-footer" style="justify-content: space-between;">
          <div style="display: flex; gap: 8px;">
            <button class="btn" id="btn-org-rotate-all">Rotate All CW (+90°)</button>
            <button class="btn" id="btn-org-rotate-all-ccw">Rotate All CCW (-90°)</button>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn" id="btn-org-cancel">Cancel</button>
            <button class="btn btn-primary" id="btn-org-done">Done</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
  }

  bindEvents() {
    this.overlay.querySelector('.btn-close-modal').addEventListener('click', () => this.close());
    this.overlay.querySelector('#btn-org-cancel').addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
    this.overlay.querySelector('#btn-org-done').addEventListener('click', () => {
      this.close();
      this.onApply();
    });

    this.overlay.querySelector('#btn-org-rotate-all').addEventListener('click', () => {
      this.pdfEngine.rotateAllPages(90);
      this.refreshGrid();
    });

    this.overlay.querySelector('#btn-org-rotate-all-ccw').addEventListener('click', () => {
      this.pdfEngine.rotateAllPages(-90);
      this.refreshGrid();
    });
  }

  async open() {
    this.overlay.style.display = 'flex';
    this.isOpen = true;
    await this.refreshGrid();
  }

  close() {
    this.overlay.style.display = 'none';
    this.isOpen = false;
  }

  async refreshGrid() {
    const grid = this.overlay.querySelector('#organizer-grid');
    grid.innerHTML = '';

    for (let i = 0; i < this.pdfEngine.numPages; i++) {
      const tile = document.createElement('div');
      tile.className = 'thumbnail-card';
      tile.style.backgroundColor = 'var(--bg-surface)';
      tile.style.padding = '10px';
      tile.dataset.pageIndex = i;

      const canvas = document.createElement('canvas');
      canvas.width = 140;
      canvas.height = 190;

      tile.innerHTML = `
        <div class="thumbnail-footer" style="margin-top: 8px;">
          <span style="font-weight: 700;">Page ${i + 1}</span>
          <div style="display: flex; gap: 2px;">
            <button class="btn-icon btn-move-left" title="Move Left" data-index="${i}" ${i === 0 ? 'disabled style="opacity: 0.3;"' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button class="btn-icon btn-move-right" title="Move Right" data-index="${i}" ${i === this.pdfEngine.numPages - 1 ? 'disabled style="opacity: 0.3;"' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
            <button class="btn-icon btn-rotate-ccw" title="Rotate CCW (-90°)" data-index="${i}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                <path d="M2.5 2v6h6M2.66 15.57a10 10 0 1 0 .57-8.38l-5.67-5.67"></path>
              </svg>
            </button>
            <button class="btn-icon btn-rotate-cw" title="Rotate CW (+90°)" data-index="${i}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
              </svg>
            </button>
            <button class="btn-icon btn-dup" title="Duplicate Page" data-index="${i}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
            <button class="btn-icon btn-del" title="Delete Page" data-index="${i}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      `;

      tile.prepend(canvas);
      grid.appendChild(tile);

      const leftBtn = tile.querySelector('.btn-move-left');
      if (leftBtn && i > 0) {
        leftBtn.addEventListener('click', () => {
          this.pdfEngine.reorderPage(i, i - 1);
          if (this.annotationsManager) this.annotationsManager.reorderPage(i, i - 1);
          this.refreshGrid();
        });
      }

      const rightBtn = tile.querySelector('.btn-move-right');
      if (rightBtn && i < this.pdfEngine.numPages - 1) {
        rightBtn.addEventListener('click', () => {
          this.pdfEngine.reorderPage(i, i + 1);
          if (this.annotationsManager) this.annotationsManager.reorderPage(i, i + 1);
          this.refreshGrid();
        });
      }

      tile.draggable = true;
      tile.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', String(i));
        tile.style.opacity = '0.5';
      });
      tile.addEventListener('dragend', () => {
        tile.style.opacity = '1.0';
      });
      tile.addEventListener('dragover', (e) => {
        e.preventDefault();
        tile.style.border = '2px dashed var(--primary)';
      });
      tile.addEventListener('dragleave', () => {
        tile.style.border = '2px solid transparent';
      });
      tile.addEventListener('drop', (e) => {
        e.preventDefault();
        tile.style.border = '2px solid transparent';
        const srcIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (!isNaN(srcIndex) && srcIndex !== i) {
          this.pdfEngine.reorderPage(srcIndex, i);
          if (this.annotationsManager) this.annotationsManager.reorderPage(srcIndex, i);
          this.refreshGrid();
        }
      });

      tile.querySelector('.btn-rotate-ccw').addEventListener('click', () => {
        this.pdfEngine.rotatePage(i, -90);
        this.refreshGrid();
      });

      tile.querySelector('.btn-rotate-cw').addEventListener('click', () => {
        this.pdfEngine.rotatePage(i, 90);
        this.refreshGrid();
      });

      tile.querySelector('.btn-dup').addEventListener('click', () => {
        this.pdfEngine.duplicatePage(i);
        if (this.annotationsManager) this.annotationsManager.duplicatePage(i);
        this.refreshGrid();
      });

      tile.querySelector('.btn-del').addEventListener('click', () => {
        if (this.pdfEngine.numPages <= 1) {
          if (typeof window.showToast === 'function') {
            window.showToast('Cannot delete the only page in the document.', 'warning');
          }
          return;
        }
        this.pdfEngine.deletePage(i);
        if (this.annotationsManager) this.annotationsManager.deletePage(i);
        this.refreshGrid();
      });

      this.renderTileCanvas(i, canvas);
    }
  }

  async renderTileCanvas(displayIndex, canvas) {
    try {
      const origIndex = this.pdfEngine.pageOrder[displayIndex];
      const page = await this.pdfEngine.getPage(origIndex + 1);
      const rotation = (page.rotate + this.pdfEngine.getPageRotation(displayIndex)) % 360;

      const viewport = page.getViewport({ scale: 0.3, rotation });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
    } catch {}
  }
}
