/**
 * FolioFlux Floating Search Bar
 * Full-text search across all pages with instant match highlighting and jumping.
 */

export class SearchBar {
  constructor({ container, searchEngine, onJumpToMatch }) {
    this.container = container;
    this.searchEngine = searchEngine;
    this.onJumpToMatch = onJumpToMatch;
    this.isOpen = false;

    this.render();
    this.bindEvents();
  }

  render() {
    this.el = document.createElement('div');
    this.el.className = 'floating-search-bar';
    this.el.style.display = 'none';

    this.el.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="color: var(--text-muted);">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <input type="text" id="search-input" placeholder="Find in document..." />
      <span class="search-count" id="search-count">0 of 0</span>
      <div class="divider" style="height: 16px;"></div>
      <button class="btn-icon" id="btn-search-prev" title="Previous (Shift+Enter)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="18 15 12 9 6 15"></polyline></svg>
      </button>
      <button class="btn-icon" id="btn-search-next" title="Next (Enter)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>
      <button class="btn-icon" id="btn-search-close" title="Close (Escape)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;

    this.container.appendChild(this.el);
  }

  bindEvents() {
    const input = this.el.querySelector('#search-input');
    const prevBtn = this.el.querySelector('#btn-search-prev');
    const nextBtn = this.el.querySelector('#btn-search-next');
    const closeBtn = this.el.querySelector('#btn-search-close');
    const countSpan = this.el.querySelector('#search-count');

    let debounceTimer = null;
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.searchEngine.search(input.value);
      }, 200);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (e.shiftKey) {
          const match = this.searchEngine.prev();
          if (match) this.onJumpToMatch(match);
        } else {
          const match = this.searchEngine.next();
          if (match) this.onJumpToMatch(match);
        }
      } else if (e.key === 'Escape') {
        this.close();
      }
    });

    prevBtn.addEventListener('click', () => {
      const match = this.searchEngine.prev();
      if (match) this.onJumpToMatch(match);
    });

    nextBtn.addEventListener('click', () => {
      const match = this.searchEngine.next();
      if (match) this.onJumpToMatch(match);
    });

    closeBtn.addEventListener('click', () => this.close());

    this.searchEngine.subscribe((data) => {
      if (data.total > 0) {
        countSpan.textContent = `${data.current} of ${data.total}`;
        if (data.match) {
          this.onJumpToMatch(data.match);
        }
      } else if (data.query) {
        countSpan.textContent = '0 found';
      } else {
        countSpan.textContent = '0 of 0';
      }
    });
  }

  open() {
    this.el.style.display = 'flex';
    this.isOpen = true;
    const input = this.el.querySelector('#search-input');
    input.focus();
    input.select();
  }

  close() {
    this.el.style.display = 'none';
    this.isOpen = false;
    this.searchEngine.clear();
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }
}
