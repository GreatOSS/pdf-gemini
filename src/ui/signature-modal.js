/**
 * FolioFlux Digital Signature Dialog
 * Allows drawing a signature, typing cursive signature, or uploading a signature file.
 */

export class SignatureModal {
  constructor({ onApply }) {
    this.onApply = onApply;
    this.isOpen = false;
    this.activeTab = 'draw';
    this.signatureData = null;

    this.render();
    this.bindEvents();
  }

  render() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.style.display = 'none';

    this.overlay.innerHTML = `
      <div class="modal-dialog" style="max-width: 520px;">
        <div class="modal-header">
          <h3 class="modal-title">Create Digital Signature</h3>
          <button class="btn-icon btn-close-modal" title="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="sidebar-tabs" style="margin-bottom: 16px; border-radius: 6px; overflow: hidden;">
            <button class="sidebar-tab active" id="tab-draw-sig">Draw</button>
            <button class="sidebar-tab" id="tab-type-sig">Type</button>
            <button class="sidebar-tab" id="tab-upload-sig">Upload</button>
          </div>

          <!-- Draw View -->
          <div id="view-draw-sig">
            <div class="signature-canvas-container">
              <canvas id="sig-pad-canvas" class="signature-canvas" width="480" height="180"></canvas>
              <div class="signature-line"></div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
              <span style="font-size: 11px; color: var(--text-muted);">Sign with mouse, trackpad, or pen</span>
              <button class="btn" id="btn-clear-sig">Clear</button>
            </div>
          </div>

          <!-- Type View -->
          <div id="view-type-sig" style="display: none;">
            <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px;">Your Name:</label>
            <input type="text" id="type-sig-input" placeholder="e.g. Jane Doe" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 6px; margin-bottom: 12px;" />
            <div id="type-sig-preview" style="height: 120px; border: 1px solid var(--border); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-family: 'Brush Script MT', 'Segoe Script', cursive, sans-serif; font-size: 36px; color: #1e3a8a;">
              Jane Doe
            </div>
          </div>

          <!-- Upload View -->
          <div id="view-upload-sig" style="display: none; text-align: center;">
            <input type="file" id="sig-file-upload" accept="image/png,image/jpeg,image/svg+xml" style="display: none;" />
            <button class="btn btn-primary" id="btn-browse-sig-img" style="margin-bottom: 12px;">Browse Image</button>
            <div id="upload-sig-preview" style="max-height: 120px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 12px; color: var(--text-muted);">Select PNG or JPEG signature with transparent background</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn" id="btn-cancel-sig">Cancel</button>
          <button class="btn btn-primary" id="btn-apply-sig">Apply Signature</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
  }

  bindEvents() {
    const closeBtn = this.overlay.querySelector('.btn-close-modal');
    const cancelBtn = this.overlay.querySelector('#btn-cancel-sig');
    const applyBtn = this.overlay.querySelector('#btn-apply-sig');
    const clearBtn = this.overlay.querySelector('#btn-clear-sig');

    closeBtn.addEventListener('click', () => this.close());
    cancelBtn.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    // Tab switching
    const drawTab = this.overlay.querySelector('#tab-draw-sig');
    const typeTab = this.overlay.querySelector('#tab-type-sig');
    const uploadTab = this.overlay.querySelector('#tab-upload-sig');

    const drawView = this.overlay.querySelector('#view-draw-sig');
    const typeView = this.overlay.querySelector('#view-type-sig');
    const uploadView = this.overlay.querySelector('#view-upload-sig');

    const switchTab = (tabName) => {
      this.activeTab = tabName;
      drawTab.classList.toggle('active', tabName === 'draw');
      typeTab.classList.toggle('active', tabName === 'type');
      uploadTab.classList.toggle('active', tabName === 'upload');

      drawView.style.display = tabName === 'draw' ? 'block' : 'none';
      typeView.style.display = tabName === 'type' ? 'block' : 'none';
      uploadView.style.display = tabName === 'upload' ? 'block' : 'none';
    };

    drawTab.addEventListener('click', () => switchTab('draw'));
    typeTab.addEventListener('click', () => switchTab('type'));
    uploadTab.addEventListener('click', () => switchTab('upload'));

    // Canvas drawing
    const canvas = this.overlay.querySelector('#sig-pad-canvas');
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let hasDrawn = false;

    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height),
      };
    };

    canvas.addEventListener('mousedown', (e) => {
      isDrawing = true;
      hasDrawn = true;
      const p = getPos(e);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDrawing) return;
      const p = getPos(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    });

    window.addEventListener('mouseup', () => {
      isDrawing = false;
    });

    clearBtn.addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasDrawn = false;
    });

    // Type signature input preview
    const typeInput = this.overlay.querySelector('#type-sig-input');
    const typePreview = this.overlay.querySelector('#type-sig-preview');
    typeInput.addEventListener('input', () => {
      typePreview.textContent = typeInput.value || 'Your Name';
    });

    // Upload signature
    const uploadInput = this.overlay.querySelector('#sig-file-upload');
    const browseBtn = this.overlay.querySelector('#btn-browse-sig-img');
    const uploadPreview = this.overlay.querySelector('#upload-sig-preview');

    browseBtn.addEventListener('click', () => uploadInput.click());
    uploadInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          this.uploadedDataUrl = reader.result;
          uploadPreview.innerHTML = `<img src="${reader.result}" style="max-height: 100px; max-width: 100%;" />`;
        };
        reader.readAsDataURL(file);
      }
    });

    // Apply button
    applyBtn.addEventListener('click', () => {
      let dataUrl = null;

      if (this.activeTab === 'draw') {
        if (!hasDrawn) {
          alert('Please sign on the canvas first.');
          return;
        }
        dataUrl = canvas.toDataURL('image/png');
      } else if (this.activeTab === 'type') {
        const text = typeInput.value.trim() || 'Jane Doe';
        // Render text to canvas to get image dataUrl
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 400;
        tempCanvas.height = 120;
        const tCtx = tempCanvas.getContext('2d');
        tCtx.font = "italic 44px 'Brush Script MT', 'Segoe Script', cursive, sans-serif";
        tCtx.fillStyle = '#1e3a8a';
        tCtx.fillText(text, 20, 80);
        dataUrl = tempCanvas.toDataURL('image/png');
      } else if (this.activeTab === 'upload') {
        if (!this.uploadedDataUrl) {
          alert('Please choose an image file first.');
          return;
        }
        dataUrl = this.uploadedDataUrl;
      }

      if (dataUrl) {
        this.onApply(dataUrl);
        this.close();
      }
    });
  }

  open() {
    this.overlay.style.display = 'flex';
    this.isOpen = true;
  }

  close() {
    this.overlay.style.display = 'none';
    this.isOpen = false;
  }
}
