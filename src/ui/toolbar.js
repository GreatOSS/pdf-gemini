/**
 * FolioFlux Toolbar Component
 * Header navigation, document operations, view mode, zoom, and annotation tool selector.
 */

export class Toolbar {
  constructor({ container, onAction, onToolChange }) {
    this.container = container;
    this.onAction = onAction;
    this.onToolChange = onToolChange;
    this.currentTool = 'select'; // select, hand, highlight, underline, strikeout, pen, text, note, rect, circle, arrow, line, stamp, signature, redact, eraser
    this.toolOptions = {
      color: '#4f46e5',
      strokeWidth: 3,
      fontSize: 14,
      fillColor: 'transparent',
      stampType: 'APPROVED',
      highlighterColor: '#facc15',
    };

    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <header class="app-header">
        <div class="header-left">
          <div class="brand">
            <div class="brand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <span>FolioFlux</span>
          </div>

          <button id="btn-toggle-sidebar" class="btn-icon" data-tooltip="Toggle Sidebar (B)" title="Toggle Sidebar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
          </button>

          <div class="doc-title-container">
            <input type="text" id="doc-title-input" class="doc-title-input" value="Welcome to FolioFlux" title="Rename Document" style="max-width: 140px;" />
          </div>
        </div>

        <div class="header-center">
          <!-- Page Nav -->
          <div class="page-nav">
            <button id="btn-prev-page" class="btn-icon" data-tooltip="Previous Page (PageUp)" title="Previous Page">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <input type="number" id="page-num-input" class="page-num-input" value="1" min="1" max="1" />
            <span class="page-count-text">/ <span id="page-count">1</span></span>
            <button id="btn-next-page" class="btn-icon" data-tooltip="Next Page (PageDown)" title="Next Page">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>

          <div class="divider"></div>

          <!-- Zoom Controls -->
          <div class="zoom-controls">
            <button id="btn-zoom-out" class="btn-icon" data-tooltip="Zoom Out (-)" title="Zoom Out">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            <select id="zoom-select" class="zoom-select">
              <option value="0.5">50%</option>
              <option value="0.75">75%</option>
              <option value="1.0" selected>100%</option>
              <option value="1.25">125%</option>
              <option value="1.5">150%</option>
              <option value="2.0">200%</option>
              <option value="fit-width">Fit Width</option>
              <option value="fit-page">Fit Page</option>
            </select>
            <button id="btn-zoom-in" class="btn-icon" data-tooltip="Zoom In (+)" title="Zoom In">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>

          <div class="divider"></div>

          <!-- Layout Mode -->
          <div class="tool-group">
            <button id="btn-layout-continuous" class="btn-icon active" data-tooltip="Continuous Scroll" title="Continuous Scroll">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="7" y="2" width="10" height="6" rx="1"></rect>
                <rect x="7" y="10" width="10" height="6" rx="1"></rect>
                <rect x="7" y="18" width="10" height="4" rx="1"></rect>
              </svg>
            </button>
            <button id="btn-layout-single" class="btn-icon" data-tooltip="Single Page" title="Single Page">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="5" y="3" width="14" height="18" rx="2"></rect>
              </svg>
            </button>
            <button id="btn-layout-two-page" class="btn-icon" data-tooltip="Two-Page Spread" title="Two-Page Spread">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="4" width="9" height="16" rx="1"></rect>
                <rect x="13" y="4" width="9" height="16" rx="1"></rect>
              </svg>
            </button>
          </div>
        </div>

        <div class="header-right">
          <!-- History Undo / Redo -->
          <button id="btn-undo" class="btn-icon" data-tooltip="Undo (Ctrl+Z)" title="Undo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 7v6h6"></path>
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>
            </svg>
          </button>
          <button id="btn-redo" class="btn-icon" data-tooltip="Redo (Ctrl+Y)" title="Redo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 7v6h-6"></path>
              <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"></path>
            </svg>
          </button>

          <div class="divider"></div>

          <!-- Search Button -->
          <button id="btn-search-toggle" class="btn-icon" data-tooltip="Find in Document (Ctrl+F)" title="Search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>

          <!-- Organize Pages -->
          <button id="btn-organize-pages" class="btn-icon" data-tooltip="Organize Pages" title="Organize Pages">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </button>

          <!-- TTS Read Aloud -->
          <button id="btn-tts" class="btn-icon" data-tooltip="Read Aloud (TTS)" title="Read Aloud">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
          </button>

          <!-- Dark / Smart Invert Mode -->
          <button id="btn-toggle-dark" class="btn-icon" data-tooltip="Smart Dark Reading Mode (D)" title="Dark Mode">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </button>

          <!-- Samples Selector -->
          <select id="select-samples" class="zoom-select" style="font-weight: 600; color: var(--primary); border: 1px solid var(--border); padding: 3px 6px; border-radius: 6px;" title="Sample Documents">
            <option value="" disabled selected>Samples ▾</option>
            <option value="tour">Tour Guide</option>
            <option value="nda">Fillable NDA</option>
            <option value="blank">Blank Doc</option>
          </select>

          <!-- Open File -->
          <input type="file" id="file-input" accept=".pdf,application/pdf" style="display: none;" />
          <button id="btn-open-file" class="btn-icon" data-tooltip="Open PDF (Ctrl+O)" title="Open PDF">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>

          <!-- Save Button -->
          <button id="btn-save-pdf" class="btn btn-primary" title="Save Edited PDF (Ctrl+S)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            <span>Save</span>
          </button>

          <!-- Export Formats -->
          <select id="select-export" class="zoom-select" style="border: 1px solid var(--border); padding: 3px 6px; border-radius: 6px; font-weight: 500;" title="Export Formats">
            <option value="" disabled selected>Export ▾</option>
            <option value="pdf">PDF (.pdf)</option>
            <option value="png">Images (.png)</option>
            <option value="txt">Text (.txt)</option>
            <option value="json">Form Data (.json)</option>
          </select>

          <!-- Help & Shortcuts Menu -->
          <button id="btn-more-options" class="btn-icon" data-tooltip="Help & Shortcuts (?)" title="Help">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </button>
        </div>
      </header>

      <!-- Annotation Toolstrip -->
      <div class="toolstrip">
        <div class="tool-group">
          <!-- Selection & Hand -->
          <button id="tool-select" class="btn-icon active" data-tooltip="Select / Cursor (V)" title="Select">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3l7 18 3-7 7-3L3 3z"></path>
            </svg>
          </button>
          <button id="tool-hand" class="btn-icon" data-tooltip="Hand / Pan Tool (H)" title="Pan">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path>
              <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"></path>
              <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"></path>
              <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path>
            </svg>
          </button>
        </div>

        <div class="divider"></div>

        <div class="tool-group">
          <!-- Highlighter -->
          <button id="tool-highlight" class="btn-icon" data-tooltip="Highlighter" title="Highlight">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m9 11-6 6v3h3l6-6"></path>
              <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L15 4a2 2 0 0 1 2.8 0l4.2 4.2a2 2 0 0 1 0 2.8Z"></path>
            </svg>
          </button>

          <!-- Freehand Pen -->
          <button id="tool-pen" class="btn-icon" data-tooltip="Freehand Pen / Ink" title="Draw">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
              <path d="M2 2l7.586 7.586"></path>
              <circle cx="11" cy="11" r="2"></circle>
            </svg>
          </button>

          <!-- Text Box -->
          <button id="tool-text" class="btn-icon" data-tooltip="Add Text Box" title="Text">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="4 7 4 4 20 4 20 7"></polyline>
              <line x1="9" y1="20" x2="15" y2="20"></line>
              <line x1="12" y1="4" x2="12" y2="20"></line>
            </svg>
          </button>

          <!-- Sticky Note -->
          <button id="tool-note" class="btn-icon" data-tooltip="Sticky Note / Comment" title="Sticky Note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"></path>
              <path d="M15 3v6h6"></path>
            </svg>
          </button>

          <!-- Shapes: Rect, Circle, Arrow, Line -->
          <button id="tool-rect" class="btn-icon" data-tooltip="Rectangle" title="Rectangle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"></rect>
            </svg>
          </button>

          <button id="tool-circle" class="btn-icon" data-tooltip="Ellipse / Circle" title="Circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
            </svg>
          </button>

          <button id="tool-arrow" class="btn-icon" data-tooltip="Arrow Line" title="Arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="19" x2="19" y2="5"></line>
              <polyline points="9 5 19 5 19 15"></polyline>
            </svg>
          </button>
        </div>

        <div class="divider"></div>

        <div class="tool-group">
          <!-- Rubber Stamp -->
          <button id="tool-stamp" class="btn-icon" data-tooltip="Rubber Stamp (Approved / Confidential)" title="Stamp">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 22h14"></path>
              <path d="M19.27 13.73A2.5 2.5 0 0 0 17.5 13h-11A2.5 2.5 0 0 0 4 15.5V17h16v-1.5c0-.66-.26-1.3-.73-1.77Z"></path>
              <path d="M14 13V8.5C14 7.12 12.88 6 11.5 6S9 7.12 9 8.5V13"></path>
            </svg>
          </button>

          <!-- Digital Signature -->
          <button id="tool-signature" class="btn-icon" data-tooltip="Digital Signature" title="Signature">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
          </button>

          <!-- Permanent Redaction -->
          <button id="tool-redact" class="btn-icon" data-tooltip="Permanent Area Redaction" title="Redaction">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor"></rect>
            </svg>
          </button>

          <!-- Eraser -->
          <button id="tool-eraser" class="btn-icon" data-tooltip="Eraser Tool" title="Eraser">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"></path>
              <path d="M22 21H7"></path>
              <path d="m5 11 9 9"></path>
            </svg>
          </button>
        </div>

        <!-- Suboptions area dynamically tailored for active tool -->
        <div id="tool-suboptions" class="tool-suboptions">
          <!-- Populated by updateSuboptions() -->
        </div>
      </div>
    `;
  }

  bindEvents() {
    // Tool buttons
    const tools = ['select', 'hand', 'highlight', 'pen', 'text', 'note', 'rect', 'circle', 'arrow', 'stamp', 'signature', 'redact', 'eraser'];
    for (const t of tools) {
      const btn = this.container.querySelector(`#tool-${t}`);
      if (btn) {
        btn.addEventListener('click', () => this.setActiveTool(t));
      }
    }

    // Header actions
    this.container.querySelector('#btn-toggle-sidebar').addEventListener('click', () => this.onAction('toggle-sidebar'));
    this.container.querySelector('#btn-prev-page').addEventListener('click', () => this.onAction('prev-page'));
    this.container.querySelector('#btn-next-page').addEventListener('click', () => this.onAction('next-page'));
    this.container.querySelector('#page-num-input').addEventListener('change', (e) => this.onAction('goto-page', parseInt(e.target.value, 10)));
    this.container.querySelector('#btn-zoom-in').addEventListener('click', () => this.onAction('zoom-in'));
    this.container.querySelector('#btn-zoom-out').addEventListener('click', () => this.onAction('zoom-out'));
    this.container.querySelector('#zoom-select').addEventListener('change', (e) => this.onAction('set-zoom', e.target.value));

    // Layout buttons
    this.container.querySelector('#btn-layout-continuous').addEventListener('click', () => this.setLayoutMode('continuous'));
    this.container.querySelector('#btn-layout-single').addEventListener('click', () => this.setLayoutMode('single'));
    this.container.querySelector('#btn-layout-two-page').addEventListener('click', () => this.setLayoutMode('two-page'));

    // Undo / Redo
    this.container.querySelector('#btn-undo').addEventListener('click', () => this.onAction('undo'));
    this.container.querySelector('#btn-redo').addEventListener('click', () => this.onAction('redo'));

    // Search
    this.container.querySelector('#btn-search-toggle').addEventListener('click', () => this.onAction('toggle-search'));

    // Organize pages
    this.container.querySelector('#btn-organize-pages').addEventListener('click', () => this.onAction('organize-pages'));

    // TTS
    this.container.querySelector('#btn-tts').addEventListener('click', () => this.onAction('toggle-tts'));

    // Dark Mode
    this.container.querySelector('#btn-toggle-dark').addEventListener('click', () => this.onAction('toggle-dark'));

    // Samples Dropdown
    const sampleSelect = this.container.querySelector('#select-samples');
    if (sampleSelect) {
      sampleSelect.addEventListener('change', (e) => {
        this.onAction('load-sample', e.target.value);
        sampleSelect.selectedIndex = 0;
      });
    }

    // Export Dropdown
    const exportSelect = this.container.querySelector('#select-export');
    if (exportSelect) {
      exportSelect.addEventListener('change', (e) => {
        this.onAction('export-format', e.target.value);
        exportSelect.selectedIndex = 0;
      });
    }

    // File Open
    const fileInput = this.container.querySelector('#file-input');
    this.container.querySelector('#btn-open-file').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files?.[0]) {
        this.onAction('open-file', e.target.files[0]);
      }
    });

    // Save
    this.container.querySelector('#btn-save-pdf').addEventListener('click', () => this.onAction('save-pdf'));

    // More Options / Shortcuts modal
    this.container.querySelector('#btn-more-options').addEventListener('click', () => this.onAction('show-options-menu'));

    // Doc title editing
    this.container.querySelector('#doc-title-input').addEventListener('change', (e) => {
      this.onAction('rename-doc', e.target.value);
    });

    this.updateSuboptions();
  }

  setActiveTool(tool) {
    this.currentTool = tool;
    this.container.querySelectorAll('.toolstrip .btn-icon').forEach(btn => btn.classList.remove('active'));
    const activeBtn = this.container.querySelector(`#tool-${tool}`);
    if (activeBtn) activeBtn.classList.add('active');

    this.updateSuboptions();
    this.onToolChange(this.currentTool, this.toolOptions);
  }

  setLayoutMode(mode) {
    ['continuous', 'single', 'two-page'].forEach(m => {
      this.container.querySelector(`#btn-layout-${m}`).classList.remove('active');
    });
    this.container.querySelector(`#btn-layout-${mode}`).classList.add('active');
    this.onAction('set-layout-mode', mode);
  }

  updateSuboptions() {
    const sub = this.container.querySelector('#tool-suboptions');
    if (!sub) return;

    if (this.currentTool === 'highlight') {
      sub.innerHTML = `
        <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">Color:</span>
        <button class="color-dot-btn active" data-color="#facc15" style="background: #facc15;" title="Yellow"></button>
        <button class="color-dot-btn" data-color="#4ade80" style="background: #4ade80;" title="Green"></button>
        <button class="color-dot-btn" data-color="#38bdf8" style="background: #38bdf8;" title="Blue"></button>
        <button class="color-dot-btn" data-color="#f472b6" style="background: #f472b6;" title="Pink"></button>
        <button class="color-dot-btn" data-color="#fb923c" style="background: #fb923c;" title="Orange"></button>
      `;
    } else if (this.currentTool === 'pen') {
      sub.innerHTML = `
        <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">Stroke:</span>
        <button class="color-dot-btn active" data-color="#4f46e5" style="background: #4f46e5;" title="Indigo"></button>
        <button class="color-dot-btn" data-color="#dc2626" style="background: #dc2626;" title="Red"></button>
        <button class="color-dot-btn" data-color="#16a34a" style="background: #16a34a;" title="Green"></button>
        <button class="color-dot-btn" data-color="#0f172a" style="background: #0f172a;" title="Black"></button>
        <input type="range" id="pen-width-slider" class="size-slider" min="1" max="12" value="${this.toolOptions.strokeWidth}" title="Stroke Width" />
        <span id="pen-width-label" style="font-size: 11px; min-width: 18px;">${this.toolOptions.strokeWidth}px</span>
      `;
    } else if (this.currentTool === 'text') {
      sub.innerHTML = `
        <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">Size:</span>
        <select id="text-size-select" style="padding: 2px 4px; border-radius: 4px; border: 1px solid var(--border);">
          <option value="10">10px</option>
          <option value="12">12px</option>
          <option value="14" selected>14px</option>
          <option value="18">18px</option>
          <option value="24">24px</option>
          <option value="32">32px</option>
        </select>
        <button class="color-dot-btn active" data-color="#0f172a" style="background: #0f172a;" title="Black"></button>
        <button class="color-dot-btn" data-color="#4f46e5" style="background: #4f46e5;" title="Indigo"></button>
        <button class="color-dot-btn" data-color="#dc2626" style="background: #dc2626;" title="Red"></button>
      `;
    } else if (this.currentTool === 'rect' || this.currentTool === 'circle' || this.currentTool === 'arrow') {
      sub.innerHTML = `
        <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">Border:</span>
        <button class="color-dot-btn active" data-color="#dc2626" style="background: #dc2626;" title="Red"></button>
        <button class="color-dot-btn" data-color="#4f46e5" style="background: #4f46e5;" title="Indigo"></button>
        <button class="color-dot-btn" data-color="#16a34a" style="background: #16a34a;" title="Green"></button>
        <button class="color-dot-btn" data-color="#0f172a" style="background: #0f172a;" title="Black"></button>
        <input type="range" id="shape-width-slider" class="size-slider" min="1" max="8" value="${this.toolOptions.strokeWidth}" title="Border Width" />
      `;
    } else if (this.currentTool === 'stamp') {
      sub.innerHTML = `
        <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">Stamp:</span>
        <select id="stamp-select" style="padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border); font-weight: 600;">
          <option value="APPROVED">APPROVED</option>
          <option value="CONFIDENTIAL">CONFIDENTIAL</option>
          <option value="DRAFT">DRAFT</option>
          <option value="FINAL">FINAL</option>
          <option value="VOID">VOID</option>
          <option value="REVIEWED">REVIEWED</option>
        </select>
      `;
    } else if (this.currentTool === 'signature') {
      sub.innerHTML = `
        <button class="btn" id="btn-open-sig-modal" style="padding: 2px 8px; font-size: 11px;">Create / Change Signature...</button>
      `;
      const btn = sub.querySelector('#btn-open-sig-modal');
      if (btn) {
        btn.addEventListener('click', () => this.onAction('open-signature-modal'));
      }
    } else {
      sub.innerHTML = ``;
    }

    // Attach suboption listeners
    sub.querySelectorAll('.color-dot-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sub.querySelectorAll('.color-dot-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const color = btn.dataset.color;
        if (this.currentTool === 'highlight') {
          this.toolOptions.highlighterColor = color;
        } else {
          this.toolOptions.color = color;
        }
        this.onToolChange(this.currentTool, this.toolOptions);
      });
    });

    const penSlider = sub.querySelector('#pen-width-slider');
    if (penSlider) {
      penSlider.addEventListener('input', (e) => {
        this.toolOptions.strokeWidth = parseInt(e.target.value, 10);
        const lbl = sub.querySelector('#pen-width-label');
        if (lbl) lbl.textContent = `${this.toolOptions.strokeWidth}px`;
        this.onToolChange(this.currentTool, this.toolOptions);
      });
    }

    const shapeSlider = sub.querySelector('#shape-width-slider');
    if (shapeSlider) {
      shapeSlider.addEventListener('input', (e) => {
        this.toolOptions.strokeWidth = parseInt(e.target.value, 10);
        this.onToolChange(this.currentTool, this.toolOptions);
      });
    }

    const textSizeSelect = sub.querySelector('#text-size-select');
    if (textSizeSelect) {
      textSizeSelect.addEventListener('change', (e) => {
        this.toolOptions.fontSize = parseInt(e.target.value, 10);
        this.onToolChange(this.currentTool, this.toolOptions);
      });
    }

    const stampSelect = sub.querySelector('#stamp-select');
    if (stampSelect) {
      stampSelect.addEventListener('change', (e) => {
        this.toolOptions.stampType = e.target.value;
        this.onToolChange(this.currentTool, this.toolOptions);
      });
    }
  }

  setDocumentInfo({ title, numPages, currentPage = 1 }) {
    const titleInput = this.container.querySelector('#doc-title-input');
    if (titleInput && title) titleInput.value = title;

    const countSpan = this.container.querySelector('#page-count');
    if (countSpan) countSpan.textContent = numPages;

    const numInput = this.container.querySelector('#page-num-input');
    if (numInput) {
      numInput.value = currentPage;
      numInput.max = numPages;
    }
  }

  setCurrentPage(pageNumber) {
    const numInput = this.container.querySelector('#page-num-input');
    if (numInput) numInput.value = pageNumber;
  }

  setZoom(scale) {
    const select = this.container.querySelector('#zoom-select');
    if (select) {
      const match = Array.from(select.options).find(o => Math.abs(parseFloat(o.value) - scale) < 0.05);
      if (match) select.value = match.value;
    }
  }
}
