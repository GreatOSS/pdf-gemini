/**
 * FolioFlux Watermark & Page Numbering Modal
 * Applies diagonal text watermarks and formatted page numbers across pages.
 */

export class WatermarkModal {
  constructor({ onApplyWatermark, onRemoveWatermark, onApplyPageNumbers, onRemovePageNumbers }) {
    this.onApplyWatermark = onApplyWatermark;
    this.onRemoveWatermark = onRemoveWatermark;
    this.onApplyPageNumbers = onApplyPageNumbers;
    this.onRemovePageNumbers = onRemovePageNumbers;
    this.isOpen = false;
    this.activeTab = 'watermark';

    this.render();
    this.bindEvents();
  }

  render() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.style.display = 'none';

    this.overlay.innerHTML = `
      <div class="modal-dialog" style="max-width: 500px;">
        <div class="modal-header">
          <h3 class="modal-title">Watermarks & Page Numbers</h3>
          <button class="btn-icon btn-close-modal" title="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="sidebar-tabs" style="margin-bottom: 16px; border-radius: 6px; overflow: hidden;">
            <button class="sidebar-tab active" id="tab-wm">Watermark</button>
            <button class="sidebar-tab" id="tab-pn">Page Numbers</button>
          </div>

          <!-- Watermark View -->
          <div id="view-wm">
            <div style="margin-bottom: 12px;">
              <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Watermark Text:</label>
              <input type="text" id="wm-text-input" value="CONFIDENTIAL" style="width: 100%; padding: 6px 8px; border: 1px solid var(--border); border-radius: 6px; font-weight: 700;" />
            </div>

            <div style="margin-bottom: 12px;">
              <span style="font-size: 11px; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 6px;">Presets:</span>
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                <button class="btn wm-preset" data-text="CONFIDENTIAL">CONFIDENTIAL</button>
                <button class="btn wm-preset" data-text="DRAFT">DRAFT</button>
                <button class="btn wm-preset" data-text="DO NOT COPY">DO NOT COPY</button>
                <button class="btn wm-preset" data-text="SAMPLE">SAMPLE</button>
                <button class="btn wm-preset" data-text="INTERNAL ONLY">INTERNAL ONLY</button>
              </div>
            </div>

            <div style="display: flex; gap: 16px; margin-bottom: 14px;">
              <div>
                <label style="display: block; font-size: 11px; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;">Color:</label>
                <div style="display: flex; gap: 4px;">
                  <button class="color-dot-btn active wm-color" data-color="#dc2626" style="background: #dc2626;" title="Red"></button>
                  <button class="color-dot-btn wm-color" data-color="#4b5563" style="background: #4b5563;" title="Gray"></button>
                  <button class="color-dot-btn wm-color" data-color="#2563eb" style="background: #2563eb;" title="Blue"></button>
                  <button class="color-dot-btn wm-color" data-color="#d97706" style="background: #d97706;" title="Amber"></button>
                </div>
              </div>

              <div style="flex: 1;">
                <label style="display: block; font-size: 11px; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;">Opacity: <span id="wm-opacity-label">25%</span></label>
                <input type="range" id="wm-opacity-slider" min="10" max="50" value="25" style="width: 100%; accent-color: var(--primary);" />
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 12px;">
              <button class="btn" id="btn-remove-wm" style="color: var(--danger);">Remove Watermark</button>
              <button class="btn btn-primary" id="btn-apply-wm">Apply Watermark</button>
            </div>
          </div>

          <!-- Page Numbers View -->
          <div id="view-pn" style="display: none;">
            <div style="margin-bottom: 12px;">
              <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Format:</label>
              <select id="pn-format-select" style="width: 100%; padding: 6px 8px; border: 1px solid var(--border); border-radius: 6px;">
                <option value="Page {page} of {total}">Page 1 of 10</option>
                <option value="{page} / {total}">1 / 10</option>
                <option value="Page {page}">Page 1</option>
                <option value="- {page} -">- 1 -</option>
              </select>
            </div>

            <div style="margin-bottom: 14px;">
              <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Position:</label>
              <select id="pn-position-select" style="width: 100%; padding: 6px 8px; border: 1px solid var(--border); border-radius: 6px;">
                <option value="bottom-center">Bottom Center</option>
                <option value="bottom-right">Bottom Right</option>
                <option value="top-right">Top Right</option>
              </select>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 12px;">
              <button class="btn" id="btn-remove-pn" style="color: var(--danger);">Remove Numbers</button>
              <button class="btn btn-primary" id="btn-apply-pn">Apply Page Numbers</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
  }

  bindEvents() {
    this.overlay.querySelector('.btn-close-modal').addEventListener('click', () => this.close());

    const tabWm = this.overlay.querySelector('#tab-wm');
    const tabPn = this.overlay.querySelector('#tab-pn');
    const viewWm = this.overlay.querySelector('#view-wm');
    const viewPn = this.overlay.querySelector('#view-pn');

    tabWm.addEventListener('click', () => {
      tabWm.classList.add('active');
      tabPn.classList.remove('active');
      viewWm.style.display = 'block';
      viewPn.style.display = 'none';
      this.activeTab = 'watermark';
    });

    tabPn.addEventListener('click', () => {
      tabPn.classList.add('active');
      tabWm.classList.remove('active');
      viewPn.style.display = 'block';
      viewWm.style.display = 'none';
      this.activeTab = 'pagenumbers';
    });

    // Preset buttons
    this.overlay.querySelectorAll('.wm-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        this.overlay.querySelector('#wm-text-input').value = btn.dataset.text;
      });
    });

    // Color buttons
    let selectedColor = '#dc2626';
    this.overlay.querySelectorAll('.wm-color').forEach(btn => {
      btn.addEventListener('click', () => {
        this.overlay.querySelectorAll('.wm-color').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedColor = btn.dataset.color;
      });
    });

    // Opacity slider
    const opSlider = this.overlay.querySelector('#wm-opacity-slider');
    const opLabel = this.overlay.querySelector('#wm-opacity-label');
    opSlider.addEventListener('input', () => {
      opLabel.textContent = `${opSlider.value}%`;
    });

    // Apply Watermark
    this.overlay.querySelector('#btn-apply-wm').addEventListener('click', () => {
      const text = this.overlay.querySelector('#wm-text-input').value.trim() || 'CONFIDENTIAL';
      const opacity = parseInt(opSlider.value, 10) / 100;
      this.onApplyWatermark({ text, color: selectedColor, opacity });
      this.close();
    });

    // Remove Watermark
    this.overlay.querySelector('#btn-remove-wm').addEventListener('click', () => {
      this.onRemoveWatermark();
      this.close();
    });

    // Apply Page Numbers
    this.overlay.querySelector('#btn-apply-pn').addEventListener('click', () => {
      const format = this.overlay.querySelector('#pn-format-select').value;
      const position = this.overlay.querySelector('#pn-position-select').value;
      this.onApplyPageNumbers({ format, position });
      this.close();
    });

    // Remove Page Numbers
    this.overlay.querySelector('#btn-remove-pn').addEventListener('click', () => {
      this.onRemovePageNumbers();
      this.close();
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
