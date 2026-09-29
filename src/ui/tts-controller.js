/**
 * FolioFlux Text-to-Speech (TTS) Reader
 * Accessible read-aloud functionality using Web Speech API.
 */

export class TTSController {
  constructor({ pdfEngine, getCurrentPage }) {
    this.pdfEngine = pdfEngine;
    this.getCurrentPage = getCurrentPage;
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.isPlaying = false;
    this.utterance = null;

    this.render();
  }

  render() {
    this.bar = document.createElement('div');
    this.bar.className = 'floating-search-bar';
    this.bar.style.bottom = '24px';
    this.bar.style.top = 'auto';
    this.bar.style.left = '50%';
    this.bar.style.transform = 'translateX(-50%)';
    this.bar.style.display = 'none';

    this.bar.innerHTML = `
      <span style="font-weight: 700; color: var(--primary); font-size: 12px; margin-right: 4px;">Read Aloud:</span>
      <button class="btn-icon" id="btn-tts-play" title="Play / Pause">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" id="icon-tts-play"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
      </button>
      <button class="btn-icon" id="btn-tts-stop" title="Stop">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="6" y="6" width="12" height="12"></rect></svg>
      </button>
      <select id="tts-rate-select" style="padding: 2px 4px; border-radius: 4px; border: 1px solid var(--border); font-size: 11px;">
        <option value="0.8">0.8x</option>
        <option value="1.0" selected>1.0x</option>
        <option value="1.25">1.25x</option>
        <option value="1.5">1.5x</option>
      </select>
      <button class="btn-icon" id="btn-tts-close" title="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;

    document.body.appendChild(this.bar);

    this.bar.querySelector('#btn-tts-play').addEventListener('click', () => this.togglePlay());
    this.bar.querySelector('#btn-tts-stop').addEventListener('click', () => this.stop());
    this.bar.querySelector('#btn-tts-close').addEventListener('click', () => this.close());
  }

  async togglePlay() {
    if (!this.synth) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
      this.updateIcon(false);
      return;
    }

    if (this.synth.paused) {
      this.synth.resume();
      this.updateIcon(true);
      return;
    }

    // Start speaking current page text
    const pageNum = this.getCurrentPage();
    const textContent = await this.pdfEngine.getTextContent(pageNum - 1);
    const fullText = textContent.items.map(i => i.str).join(' ');

    if (!fullText.trim()) {
      alert('No text content found on this page to read aloud.');
      return;
    }

    this.utterance = new SpeechSynthesisUtterance(fullText);
    const rate = parseFloat(this.bar.querySelector('#tts-rate-select').value) || 1.0;
    this.utterance.rate = rate;

    this.utterance.onend = () => {
      this.updateIcon(false);
    };

    this.synth.speak(this.utterance);
    this.updateIcon(true);
  }

  updateIcon(speaking) {
    const icon = this.bar.querySelector('#icon-tts-play');
    if (speaking) {
      icon.innerHTML = `<line x1="6" y1="4" x2="6" y2="20"></line><line x1="18" y1="4" x2="18" y2="20"></line>`;
    } else {
      icon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"></polygon>`;
    }
  }

  stop() {
    if (this.synth) this.synth.cancel();
    this.updateIcon(false);
  }

  open() {
    this.bar.style.display = 'flex';
  }

  close() {
    this.stop();
    this.bar.style.display = 'none';
  }

  toggle() {
    if (this.bar.style.display === 'flex') this.close();
    else this.open();
  }
}
