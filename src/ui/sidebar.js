/**
 * FolioFlux Multi-Tab Sidebar
 * Thumbnails, Document Outline, Annotations & Comments, and Search Results.
 */

export class Sidebar {
  constructor({ container, pdfEngine, annotationsManager, searchEngine, onAction }) {
    this.container = container;
    this.pdfEngine = pdfEngine;
    this.annotationsManager = annotationsManager;
    this.searchEngine = searchEngine;
    this.onAction = onAction;

    this.activeTab = 'thumbnails'; // thumbnails, outline, annotations, search
    this.isCollapsed = false;

    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <aside class="app-sidebar" id="app-sidebar">
        <div class="sidebar-tabs">
          <button class="sidebar-tab active" data-tab="thumbnails" title="Thumbnails">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Pages</span>
          </button>

          <button class="sidebar-tab" data-tab="outline" title="Table of Contents / Bookmarks">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
            <span>Outline</span>
          </button>

          <button class="sidebar-tab" data-tab="annotations" title="Annotations & Comments">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Notes</span>
          </button>

          <button class="sidebar-tab" data-tab="search" title="Search Results">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span>Search</span>
          </button>
        </div>

        <div class="sidebar-content" id="sidebar-content">
          <!-- Active tab content -->
        </div>
      </aside>
    `;
  }

  bindEvents() {
    this.container.querySelectorAll('.sidebar-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.container.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeTab = tab.dataset.tab;
        this.updateContent();
      });
    });

    if (this.annotationsManager) {
      this.annotationsManager.subscribe(() => {
        if (this.activeTab === 'annotations') {
          this.updateContent();
        }
      });
    }

    if (this.searchEngine) {
      this.searchEngine.subscribe(() => {
        if (this.activeTab === 'search') {
          this.updateContent();
        }
      });
    }
  }

  toggleCollapse() {
    const sidebar = this.container.querySelector('#app-sidebar');
    this.isCollapsed = !this.isCollapsed;
    sidebar.classList.toggle('collapsed', this.isCollapsed);
  }

  async updateContent() {
    const content = this.container.querySelector('#sidebar-content');
    if (!content) return;

    if (!this.pdfEngine || this.pdfEngine.numPages === 0) {
      content.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px 10px; font-size: 13px;">No document open</div>`;
      return;
    }

    if (this.activeTab === 'thumbnails') {
      await this.renderThumbnails(content);
    } else if (this.activeTab === 'outline') {
      this.renderOutline(content);
    } else if (this.activeTab === 'annotations') {
      this.renderAnnotations(content);
    } else if (this.activeTab === 'search') {
      this.renderSearch(content);
    }
  }

  async renderThumbnails(container) {
    container.innerHTML = `<div class="thumbnail-list" id="thumbnail-list"></div>`;
    const list = container.querySelector('#thumbnail-list');

    for (let i = 0; i < this.pdfEngine.numPages; i++) {
      const card = document.createElement('div');
      card.className = `thumbnail-card ${i === 0 ? 'active' : ''}`;
      card.dataset.pageIndex = i;
      card.draggable = true;

      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 160;

      card.innerHTML = `
        <div class="thumbnail-footer">
          <span>Page ${i + 1}</span>
          <div class="thumbnail-actions">
            <button class="btn-icon btn-rotate-cw" title="Rotate 90° CW" data-index="${i}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
              </svg>
            </button>
            <button class="btn-icon btn-delete-page" title="Delete Page" data-index="${i}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      `;

      card.prepend(canvas);
      list.appendChild(card);

      // Click to scroll to page
      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        this.container.querySelectorAll('.thumbnail-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.onAction('goto-page', i + 1);
      });

      // Actions
      const rotBtn = card.querySelector('.btn-rotate-cw');
      rotBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onAction('rotate-page', { pageIndex: i, degrees: 90 });
      });

      const delBtn = card.querySelector('.btn-delete-page');
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onAction('delete-page', i);
      });

      // Render thumbnail asynchronously
      this.renderThumbnailCanvas(i, canvas);
    }

    // Drag and Drop reordering
    let dragSrcIndex = null;
    list.querySelectorAll('.thumbnail-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        dragSrcIndex = parseInt(card.dataset.pageIndex, 10);
        e.dataTransfer.effectAllowed = 'move';
        card.style.opacity = '0.5';
      });

      card.addEventListener('dragend', () => {
        card.style.opacity = '1.0';
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        const dropTargetIndex = parseInt(card.dataset.pageIndex, 10);
        if (dragSrcIndex !== null && dragSrcIndex !== dropTargetIndex) {
          this.onAction('reorder-page', { sourceIndex: dragSrcIndex, targetIndex: dropTargetIndex });
        }
      });
    });
  }

  async renderThumbnailCanvas(displayIndex, canvas) {
    try {
      const origIndex = this.pdfEngine.pageOrder[displayIndex];
      const page = await this.pdfEngine.getPage(origIndex + 1);
      const rotation = (page.rotate + (this.pdfEngine.pageRotations.get(origIndex) || 0)) % 360;

      const viewport = page.getViewport({ scale: 0.25, rotation });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
    } catch {
      // Ignored if cancelled
    }
  }

  renderOutline(container) {
    const outline = this.pdfEngine.outline || [];
    if (outline.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px 10px; font-size: 13px;">No outline / bookmarks in this document.</div>`;
      return;
    }

    const renderItems = (items) => {
      let html = '<ul class="outline-tree">';
      for (const item of items) {
        html += `<li class="outline-item">
          <a class="outline-link" data-dest='${item.dest ? JSON.stringify(item.dest) : ""}'>
            <span>📄</span>
            <span>${item.title}</span>
          </a>`;
        if (item.items && item.items.length > 0) {
          html += renderItems(item.items);
        }
        html += `</li>`;
      }
      html += '</ul>';
      return html;
    };

    container.innerHTML = renderItems(outline);

    container.querySelectorAll('.outline-link').forEach(link => {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        const destRaw = link.dataset.dest;
        if (!destRaw || !this.pdfEngine?.pdfDoc) return;
        try {
          let dest = JSON.parse(destRaw);
          if (typeof dest === 'string') {
            dest = await this.pdfEngine.pdfDoc.getDestination(dest);
          }
          if (Array.isArray(dest) && dest[0]) {
            const pageRef = dest[0];
            const pageIndex = await this.pdfEngine.pdfDoc.getPageIndex(pageRef);
            const displayIndex = this.pdfEngine.pageOrder.indexOf(pageIndex);
            if (displayIndex !== -1) {
              this.onAction('goto-page', displayIndex + 1);
            }
          }
        } catch (err) {
          console.error('Failed to navigate outline item:', err);
        }
      });
    });
  }

  renderAnnotations(container) {
    const all = this.annotationsManager.getAllAnnotations();
    if (all.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px 10px; font-size: 13px;">No annotations or notes yet.<br>Use the toolbar above to add highlights, drawings, stamps, notes, or signatures.</div>`;
      return;
    }

    let html = `<div style="margin-bottom: 12px; font-size: 12px; font-weight: 600; color: var(--text-muted);">${all.length} Annotation${all.length > 1 ? 's' : ''}</div>`;

    for (const ann of all) {
      let previewText = ann.type.toUpperCase();
      if (ann.text) previewText = ann.text;
      else if (ann.stampType) previewText = `Stamp: ${ann.stampType}`;
      else if (ann.type === 'ink') previewText = 'Freehand Drawing';
      else if (ann.type === 'signature') previewText = 'Digital Signature';
      else if (ann.type === 'redaction') previewText = 'Redacted Area';

      html += `
        <div class="annotation-list-item" data-page="${ann.pageIndex}" data-id="${ann.id}">
          <div class="annotation-item-header">
            <span style="text-transform: capitalize; color: var(--primary); font-weight: 700;">${ann.type}</span>
            <span>Page ${ann.pageIndex + 1}</span>
          </div>
          <div class="annotation-item-text">${previewText}</div>
        </div>
      `;
    }

    container.innerHTML = html;

    container.querySelectorAll('.annotation-list-item').forEach(item => {
      item.addEventListener('click', () => {
        const pageIdx = parseInt(item.dataset.page, 10);
        this.onAction('goto-page', pageIdx + 1);
      });
    });
  }

  renderSearch(container) {
    const matches = this.searchEngine.matches;
    const query = this.searchEngine.query;

    if (!query) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px 10px; font-size: 13px;">Press Ctrl+F or click Find in the toolbar to search for text.</div>`;
      return;
    }

    if (matches.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px 10px; font-size: 13px;">No matches found for "${query}"</div>`;
      return;
    }

    let html = `<div style="margin-bottom: 12px; font-size: 12px; font-weight: 600; color: var(--text-muted);">Found ${matches.length} matches for "${query}"</div>`;

    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const start = Math.max(0, m.startIndex - 20);
      const end = Math.min(m.text.length, m.endIndex + 20);
      const snippet = m.text.substring(start, end);

      html += `
        <div class="annotation-list-item" data-index="${i}" data-page="${m.pageIndex}">
          <div class="annotation-item-header">
            <span style="color: var(--primary); font-weight: 700;">Match ${i + 1}</span>
            <span>Page ${m.pageIndex + 1}</span>
          </div>
          <div class="annotation-item-text">...${snippet}...</div>
        </div>
      `;
    }

    container.innerHTML = html;

    container.querySelectorAll('.annotation-list-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.dataset.index, 10);
        this.searchEngine.currentIndex = idx;
        this.searchEngine.notify();
      });
    });
  }

  setActivePage(pageIndex) {
    this.container.querySelectorAll('.thumbnail-card').forEach(card => {
      const idx = parseInt(card.dataset.pageIndex, 10);
      card.classList.toggle('active', idx === pageIndex);
    });
  }
}
