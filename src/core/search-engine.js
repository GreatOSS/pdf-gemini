/**
 * FolioFlux Full-Text Search Engine
 * Searches through all pages of a PDF document with match highlighting and navigation.
 */

export class SearchEngine {
  constructor(pdfEngine) {
    this.pdfEngine = pdfEngine;
    this.query = '';
    this.options = { caseSensitive: false, wholeWord: false };
    this.matches = []; // Array of { pageIndex, itemIndex, text, matchIndex, rect }
    this.currentIndex = -1;
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener({
        query: this.query,
        total: this.matches.length,
        current: this.currentIndex + 1,
        match: this.matches[this.currentIndex] || null,
      });
    }
  }

  async search(query, options = {}) {
    this.query = query ? query.trim() : '';
    this.options = { ...this.options, ...options };
    this.matches = [];
    this.currentIndex = -1;

    if (!this.query || !this.pdfEngine || this.pdfEngine.numPages === 0) {
      this.notify();
      return this.matches;
    }

    const regexFlags = this.options.caseSensitive ? 'g' : 'gi';
    const escapedQuery = this.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = this.options.wholeWord
      ? new RegExp(`\\b${escapedQuery}\\b`, regexFlags)
      : new RegExp(escapedQuery, regexFlags);

    for (let pageIdx = 0; pageIdx < this.pdfEngine.numPages; pageIdx++) {
      try {
        const textContent = await this.pdfEngine.getTextContent(pageIdx);
        for (let itemIdx = 0; itemIdx < textContent.items.length; itemIdx++) {
          const item = textContent.items[itemIdx];
          const str = item.str;
          let match;
          while ((match = pattern.exec(str)) !== null) {
            this.matches.push({
              pageIndex: pageIdx,
              itemIndex: itemIdx,
              text: str,
              matchText: match[0],
              startIndex: match.index,
              endIndex: match.index + match[0].length,
              transform: item.transform,
              width: item.width,
              height: item.height,
            });
          }
        }
      } catch (err) {
        console.warn(`Search error on page ${pageIdx}:`, err);
      }
    }

    if (this.matches.length > 0) {
      this.currentIndex = 0;
    }

    this.notify();
    return this.matches;
  }

  next() {
    if (this.matches.length === 0) return null;
    this.currentIndex = (this.currentIndex + 1) % this.matches.length;
    this.notify();
    return this.matches[this.currentIndex];
  }

  prev() {
    if (this.matches.length === 0) return null;
    this.currentIndex = (this.currentIndex - 1 + this.matches.length) % this.matches.length;
    this.notify();
    return this.matches[this.currentIndex];
  }

  getCurrentMatch() {
    return this.matches[this.currentIndex] || null;
  }

  clear() {
    this.query = '';
    this.matches = [];
    this.currentIndex = -1;
    this.notify();
  }
}
