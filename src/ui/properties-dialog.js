/**
 * FolioFlux Document Properties Modal
 * Displays metadata, page count, and document specs.
 */

export class PropertiesModal {
  constructor({ pdfEngine }) {
    this.pdfEngine = pdfEngine;
    this.render();
  }

  render() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.style.display = 'none';

    this.overlay.innerHTML = `
      <div class="modal-dialog" style="max-width: 480px;">
        <div class="modal-header">
          <h3 class="modal-title">Document Properties</h3>
          <button class="btn-icon btn-close-modal" title="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div class="modal-body" id="properties-content">
          <!-- Populated on open -->
        </div>

        <div class="modal-footer">
          <button class="btn btn-primary" id="btn-close-properties">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);

    this.overlay.querySelector('.btn-close-modal').addEventListener('click', () => this.close());
    this.overlay.querySelector('#btn-close-properties').addEventListener('click', () => this.close());
  }

  open() {
    const meta = this.pdfEngine.metadata || {};
    const content = this.overlay.querySelector('#properties-content');

    content.innerHTML = `
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr style="border-bottom: 1px solid var(--border);"><td style="padding: 8px 0; color: var(--text-muted); font-weight: 600; width: 120px;">Title:</td><td>${meta.title || 'Untitled'}</td></tr>
        <tr style="border-bottom: 1px solid var(--border);"><td style="padding: 8px 0; color: var(--text-muted); font-weight: 600;">Author:</td><td>${meta.author || 'Unknown'}</td></tr>
        <tr style="border-bottom: 1px solid var(--border);"><td style="padding: 8px 0; color: var(--text-muted); font-weight: 600;">Subject:</td><td>${meta.subject || '—'}</td></tr>
        <tr style="border-bottom: 1px solid var(--border);"><td style="padding: 8px 0; color: var(--text-muted); font-weight: 600;">Pages:</td><td>${this.pdfEngine.numPages || 0}</td></tr>
        <tr style="border-bottom: 1px solid var(--border);"><td style="padding: 8px 0; color: var(--text-muted); font-weight: 600;">Application:</td><td>${meta.creator || 'FolioFlux'}</td></tr>
        <tr style="border-bottom: 1px solid var(--border);"><td style="padding: 8px 0; color: var(--text-muted); font-weight: 600;">PDF Producer:</td><td>${meta.producer || 'FolioFlux Engine'}</td></tr>
      </table>
    `;

    this.overlay.style.display = 'flex';
  }

  close() {
    this.overlay.style.display = 'none';
  }
}
