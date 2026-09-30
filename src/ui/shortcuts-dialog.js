/**
 * FolioFlux Keyboard Shortcuts & Help Modal
 */

export class ShortcutsModal {
  constructor() {
    this.render();
  }

  render() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.style.display = 'none';

    this.overlay.innerHTML = `
      <div class="modal-dialog" style="max-width: 580px;">
        <div class="modal-header">
          <h3 class="modal-title">FolioFlux Help & Shortcuts</h3>
          <button class="btn-icon btn-close-modal" title="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div class="modal-body" style="font-size: 13px;">
          <h4 style="margin-bottom: 10px; color: var(--primary);">Keyboard Shortcuts</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
            <div style="background: var(--bg-surface-secondary); padding: 8px 12px; border-radius: 6px;">
              <strong>Ctrl + O</strong>: Open PDF
            </div>
            <div style="background: var(--bg-surface-secondary); padding: 8px 12px; border-radius: 6px;">
              <strong>Ctrl + S</strong>: Save & Download PDF
            </div>
            <div style="background: var(--bg-surface-secondary); padding: 8px 12px; border-radius: 6px;">
              <strong>Ctrl + P</strong>: Print Document
            </div>
            <div style="background: var(--bg-surface-secondary); padding: 8px 12px; border-radius: 6px;">
              <strong>Ctrl + I</strong>: Document Properties
            </div>
            <div style="background: var(--bg-surface-secondary); padding: 8px 12px; border-radius: 6px;">
              <strong>Ctrl + F</strong>: Find / Search
            </div>
            <div style="background: var(--bg-surface-secondary); padding: 8px 12px; border-radius: 6px;">
              <strong>Ctrl + Z / Y</strong>: Undo / Redo
            </div>
            <div style="background: var(--bg-surface-secondary); padding: 8px 12px; border-radius: 6px;">
              <strong>? / F1</strong>: Help & Shortcuts
            </div>
            <div style="background: var(--bg-surface-secondary); padding: 8px 12px; border-radius: 6px;">
              <strong>+ / -</strong>: Zoom In / Zoom Out
            </div>
            <div style="background: var(--bg-surface-secondary); padding: 8px 12px; border-radius: 6px;">
              <strong>0</strong>: Fit to Width
            </div>
            <div style="background: var(--bg-surface-secondary); padding: 8px 12px; border-radius: 6px;">
              <strong>V / H</strong>: Select / Hand Tool
            </div>
            <div style="background: var(--bg-surface-secondary); padding: 8px 12px; border-radius: 6px;">
              <strong>E</strong>: Highlighter Tool
            </div>
            <div style="background: var(--bg-surface-secondary); padding: 8px 12px; border-radius: 6px;">
              <strong>T / N</strong>: Text Box / Sticky Note
            </div>
            <div style="background: var(--bg-surface-secondary); padding: 8px 12px; border-radius: 6px;">
              <strong>R / C</strong>: Rectangle / Circle Shapes
            </div>
            <div style="background: var(--bg-surface-secondary); padding: 8px 12px; border-radius: 6px;">
              <strong>M</strong>: Measure / Ruler Tool
            </div>
            <div style="background: var(--bg-surface-secondary); padding: 8px 12px; border-radius: 6px;">
              <strong>[ / ]</strong>: Rotate Page (CCW / CW)
            </div>
            <div style="background: var(--bg-surface-secondary); padding: 8px 12px; border-radius: 6px;">
              <strong>D</strong>: Reading Mode (Light/Dark/Sepia)
            </div>
            <div style="background: var(--bg-surface-secondary); padding: 8px 12px; border-radius: 6px;">
              <strong>B</strong>: Toggle Sidebar
            </div>
            <div style="background: var(--bg-surface-secondary); padding: 8px 12px; border-radius: 6px;">
              <strong>F</strong>: Toggle Fullscreen
            </div>
            <div style="background: var(--bg-surface-secondary); padding: 8px 12px; border-radius: 6px;">
              <strong>P</strong>: Presentation Mode
            </div>
            <div style="background: var(--bg-surface-secondary); padding: 8px 12px; border-radius: 6px;">
              <strong>Home / End</strong>: First / Last Page
            </div>
            <div style="background: var(--bg-surface-secondary); padding: 8px 12px; border-radius: 6px;">
              <strong>j / k</strong>: Smooth Scroll Down / Up
            </div>
            <div style="background: var(--bg-surface-secondary); padding: 8px 12px; border-radius: 6px;">
              <strong>Ctrl + Wheel</strong>: Smooth Zoom In / Out
            </div>
          </div>

          <h4 style="margin-bottom: 8px; color: var(--primary);">About FolioFlux</h4>
          <p style="color: var(--text-muted); line-height: 1.5;">
            FolioFlux is a fast, beautiful, and secure open-source PDF viewer and editor.
            All processing is done entirely on your local machine with zero server roundtrips or cloud telemetry.
          </p>
        </div>

        <div class="modal-footer">
          <button class="btn btn-primary" id="btn-close-shortcuts">Got it</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);

    this.overlay.querySelector('.btn-close-modal').addEventListener('click', () => this.close());
    this.overlay.querySelector('#btn-close-shortcuts').addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
  }

  open() {
    this.overlay.style.display = 'flex';
  }

  close() {
    this.overlay.style.display = 'none';
  }
}
