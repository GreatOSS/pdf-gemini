/**
 * FolioFlux Password Modal
 * Prompts user for password when opening encrypted/password-protected PDF files.
 */

export class PasswordModal {
  constructor() {
    this.resolvePromise = null;
    this.rejectPromise = null;
    this.render();
  }

  render() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.style.display = 'none';

    this.overlay.innerHTML = `
      <div class="modal-dialog" style="max-width: 420px;">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" style="color: var(--primary);">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <h3 class="modal-title">Password Required</h3>
          </div>
          <button class="btn-icon btn-close-modal" title="Cancel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <form id="password-form" class="modal-body" style="display: flex; flex-direction: column; gap: 14px;">
          <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5; margin: 0;">
            This document is encrypted. Please enter the password to unlock and view its content.
          </p>

          <div id="password-error" style="display: none; background: rgba(239, 68, 68, 0.1); border: 1px solid var(--danger); color: var(--danger); padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 500;">
            Incorrect password. Please try again.
          </div>

          <div style="position: relative; display: flex; align-items: center;">
            <input
              type="password"
              id="password-input"
              class="form-control"
              placeholder="Enter password..."
              autocomplete="current-password"
              style="width: 100%; padding: 9px 36px 9px 12px; font-size: 14px; border: 1px solid var(--border); border-radius: 6px; outline: none; background: var(--bg-surface); color: var(--text-main);"
              required
            />
            <button
              type="button"
              id="btn-toggle-visibility"
              class="btn-icon"
              style="position: absolute; right: 4px; padding: 4px;"
              title="Show/Hide Password"
            >
              <svg id="eye-show" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <svg id="eye-hide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="display: none;">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            </button>
          </div>

          <div class="modal-footer" style="padding-top: 8px; padding-bottom: 0;">
            <button type="button" class="btn" id="btn-cancel-password">Cancel</button>
            <button type="submit" class="btn btn-primary" id="btn-submit-password">Unlock Document</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(this.overlay);

    const form = this.overlay.querySelector('#password-form');
    const input = this.overlay.querySelector('#password-input');
    const cancelBtn = this.overlay.querySelector('#btn-cancel-password');
    const closeBtn = this.overlay.querySelector('.btn-close-modal');
    const toggleBtn = this.overlay.querySelector('#btn-toggle-visibility');
    const eyeShow = this.overlay.querySelector('#eye-show');
    const eyeHide = this.overlay.querySelector('#eye-hide');

    toggleBtn.addEventListener('click', () => {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      eyeShow.style.display = isPassword ? 'none' : 'block';
      eyeHide.style.display = isPassword ? 'block' : 'none';
    });

    const handleCancel = () => {
      this.close();
      if (this.rejectPromise) {
        this.rejectPromise(new Error('Password prompt cancelled by user.'));
      }
    };

    closeBtn.addEventListener('click', handleCancel);
    cancelBtn.addEventListener('click', handleCancel);
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) handleCancel();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = input.value;
      this.close();
      if (this.resolvePromise) {
        this.resolvePromise(val);
      }
    });
  }

  /**
   * Prompts the user to enter the document password.
   * @param {number} reason - PDF.js PasswordResponses code (1 = NEED_PASSWORD, 2 = INCORRECT_PASSWORD)
   * @returns {Promise<string>} entered password
   */
  prompt(reason = 1) {
    return new Promise((resolve, reject) => {
      this.resolvePromise = resolve;
      this.rejectPromise = reject;

      const errorBanner = this.overlay.querySelector('#password-error');
      const input = this.overlay.querySelector('#password-input');

      input.value = '';
      if (reason === 2) {
        errorBanner.style.display = 'block';
      } else {
        errorBanner.style.display = 'none';
      }

      this.overlay.style.display = 'flex';
      setTimeout(() => input.focus(), 50);
    });
  }

  close() {
    this.overlay.style.display = 'none';
    this.resolvePromise = null;
    this.rejectPromise = null;
  }
}
