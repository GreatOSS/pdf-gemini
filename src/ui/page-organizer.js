/**
 * FolioFlux Fullscreen Page Organizer Modal
 * Visual grid for reordering, rotating, deleting, and inserting pages.
 */

export class PageOrganizerModal {
  constructor({ pdfEngine, onApply }) {
    this.pdfEngine = pdfEngine;
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
            <button class="btn" id="btn-org-rotate-all">Rotate All (90° CW)</button>
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
    this.overlay.querySelector('#btn-org-done').addEventListener('click', () => {
      this.close();
      this.onApply();
    });

    this.overlay.querySelector('#btn-org-rotate-all').addEventListener('click', () => {
      this.pdfEngine.rotateAllPages(90);
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
          <div style="display: flex; gap: 4px;">
            <button class="btn-icon btn-rotate-cw" title="Rotate CW" data-index="${i}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
              </svg>
            </button>
            <button class="btn-icon btn-dup" title="Duplicate Page" data-index="${i}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
            <button class="btn-icon btn-del" title="Delete Page" data-index="${i}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      `;

      tile.prepend(canvas);
      grid.appendChild(tile);

      tile.querySelector('.btn-rotate-cw').addEventListener('click', () => {
        this.pdfEngine.rotatePage(i, 90);
        this.refreshGrid();
      });

      tile.querySelector('.btn-dup').addEventListener('click', () => {
        this.pdfEngine.duplicatePage(i);
        this.refreshGrid();
      });

      tile.querySelector('.btn-del').addEventListener('click', () => {
        if (this.pdfEngine.numPages <= 1) {
          alert('Cannot delete the only page in the document.');
          return;
        }
        this.pdfEngine.deletePage(i);
        this.refreshGrid();
      });

      this.renderTileCanvas(i, canvas);
    }
  }

  async renderTileCanvas(displayIndex, canvas) {
    try {
      const origIndex = this.pdfEngine.pageOrder[displayIndex];
      const page = await this.pdfEngine.getPage(origIndex + 1);
      const rotation = (page.rotate + (this.pdfEngine.pageRotations.get(origIndex) || 0)) % 360;

      const viewport = page.getViewport({ scale: 0.3, rotation });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
    } catch {}
  }
}
