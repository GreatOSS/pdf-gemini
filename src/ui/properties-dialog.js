/**
 * FolioFlux Document Properties Modal
 * Displays and allows editing document metadata (Title, Author, Subject, Keywords).
 */

export class PropertiesModal {
  constructor({ pdfEngine, onSave }) {
    this.pdfEngine = pdfEngine;
    this.onSave = onSave;
    this.render();
  }

  render() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.style.display = 'none';

    this.overlay.innerHTML = `
      <div class="modal-dialog" style="max-width: 500px;">
        <div class="modal-header">
          <h3 class="modal-title">Document Properties & Metadata</h3>
          <button class="btn-icon btn-close-modal" title="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div class="modal-body" id="properties-content">
          <!-- Populated on open -->
        </div>

        <div class="modal-footer" style="justify-content: space-between;">
          <button class="btn" id="btn-cancel-properties">Cancel</button>
          <button class="btn btn-primary" id="btn-save-properties">Save Metadata</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);

    this.overlay.querySelector('.btn-close-modal').addEventListener('click', () => this.close());
    this.overlay.querySelector('#btn-cancel-properties').addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
    this.overlay.querySelector('#btn-save-properties').addEventListener('click', () => {
      const title = this.overlay.querySelector('#prop-title')?.value.trim();
      const author = this.overlay.querySelector('#prop-author')?.value.trim();
      const subject = this.overlay.querySelector('#prop-subject')?.value.trim();
      const keywords = this.overlay.querySelector('#prop-keywords')?.value.trim();

      if (this.pdfEngine.metadata) {
        this.pdfEngine.metadata = {
          ...this.pdfEngine.metadata,
          title: title || this.pdfEngine.metadata.title,
          author: author || this.pdfEngine.metadata.author,
          subject: subject || this.pdfEngine.metadata.subject,
          keywords: keywords || this.pdfEngine.metadata.keywords,
        };
      }

      if (this.onSave) {
        this.onSave(this.pdfEngine.metadata);
      }

      this.close();
    });
  }

  open() {
    const meta = this.pdfEngine.metadata || {};
    const content = this.overlay.querySelector('#properties-content');

    content.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px; font-size: 13px;">
        <div>
          <label style="display: block; font-weight: 600; margin-bottom: 4px;">Document Title:</label>
          <input type="text" id="prop-title" value="${meta.title || ''}" style="width: 100%; padding: 6px 8px; border: 1px solid var(--border); border-radius: 6px;" />
        </div>
        <div>
          <label style="display: block; font-weight: 600; margin-bottom: 4px;">Author / Organization:</label>
          <input type="text" id="prop-author" value="${meta.author || ''}" style="width: 100%; padding: 6px 8px; border: 1px solid var(--border); border-radius: 6px;" />
        </div>
        <div>
          <label style="display: block; font-weight: 600; margin-bottom: 4px;">Subject / Description:</label>
          <input type="text" id="prop-subject" value="${meta.subject || ''}" style="width: 100%; padding: 6px 8px; border: 1px solid var(--border); border-radius: 6px;" />
        </div>
        <div>
          <label style="display: block; font-weight: 600; margin-bottom: 4px;">Keywords (comma separated):</label>
          <input type="text" id="prop-keywords" value="${meta.keywords || ''}" style="width: 100%; padding: 6px 8px; border: 1px solid var(--border); border-radius: 6px;" />
        </div>
        <div style="background-color: var(--bg-surface-secondary); padding: 10px; border-radius: 6px; margin-top: 6px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: var(--text-muted); font-size: 12px;">
            <span>Page Count:</span>
            <span style="font-weight: 600; color: var(--text-main);">${this.pdfEngine.numPages || 0} pages</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: var(--text-muted); font-size: 12px;">
            <span>PDF Producer:</span>
            <span style="font-weight: 600; color: var(--text-main);">${meta.producer || 'FolioFlux Engine'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; color: var(--text-muted); font-size: 12px;">
            <span>Created By:</span>
            <span style="font-weight: 600; color: var(--text-main);">${meta.creator || 'FolioFlux'}</span>
          </div>
        </div>
      </div>
    `;

    this.overlay.style.display = 'flex';
  }

  close() {
    this.overlay.style.display = 'none';
  }
}
