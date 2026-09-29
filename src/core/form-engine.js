/**
 * FolioFlux Interactive Form Engine
 * Handles AcroForm field interaction, tracking values, and form flattening.
 */

export class FormEngine {
  constructor(pdfEngine) {
    this.pdfEngine = pdfEngine;
    this.fieldValues = new Map(); // fieldName -> value
    this.fieldsByPage = new Map(); // pageIndex -> Array of field definitions
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event, data) {
    for (const listener of this.listeners) {
      listener(event, data);
    }
  }

  async loadFields() {
    this.fieldValues.clear();
    this.fieldsByPage.clear();

    if (!this.pdfEngine || this.pdfEngine.numPages === 0) return;

    for (let pageIdx = 0; pageIdx < this.pdfEngine.numPages; pageIdx++) {
      try {
        const origIndex = this.pdfEngine.pageOrder[pageIdx];
        const page = await this.pdfEngine.getPage(origIndex + 1);
        const annotations = await page.getAnnotations();

        const formFields = annotations.filter(a => a.subtype === 'Widget');
        if (formFields.length > 0) {
          this.fieldsByPage.set(pageIdx, formFields);
          for (const field of formFields) {
            if (field.fieldName && field.fieldValue !== undefined) {
              this.fieldValues.set(field.fieldName, field.fieldValue);
            }
          }
        }
      } catch (err) {
        console.warn(`Error reading form fields on page ${pageIdx}:`, err);
      }
    }

    this.notify('loaded', { count: this.fieldValues.size });
  }

  getFieldsForPage(pageIndex) {
    return this.fieldsByPage.get(pageIndex) || [];
  }

  setValue(fieldName, value) {
    this.fieldValues.set(fieldName, value);
    this.notify('change', { fieldName, value });
  }

  getValue(fieldName) {
    return this.fieldValues.get(fieldName);
  }

  exportData() {
    return Object.fromEntries(this.fieldValues);
  }

  importData(data) {
    if (!data || typeof data !== 'object') return;
    for (const [k, v] of Object.entries(data)) {
      this.fieldValues.set(k, v);
    }
    this.notify('imported', this.exportData());
  }

  reset() {
    this.fieldValues.clear();
    this.notify('reset', null);
  }
}
