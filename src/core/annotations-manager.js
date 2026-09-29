/**
 * FolioFlux Annotation Manager
 * Manages vector annotations, drawings, stamps, notes, signatures, and redactions.
 */

export class AnnotationsManager {
  constructor() {
    this.annotations = new Map(); // pageIndex -> Array of Annotation objects
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = new Set();
    this.activeAnnotationId = null;
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

  getAnnotationsForPage(pageIndex) {
    return this.annotations.get(pageIndex) || [];
  }

  getAllAnnotations() {
    const all = [];
    for (const [pageIndex, list] of this.annotations.entries()) {
      for (const item of list) {
        all.push({ ...item, pageIndex });
      }
    }
    return all;
  }

  addAnnotation(pageIndex, annotation, recordUndo = true) {
    if (!this.annotations.has(pageIndex)) {
      this.annotations.set(pageIndex, []);
    }

    const item = {
      id: annotation.id || 'ann_' + Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
      ...annotation,
    };

    this.annotations.get(pageIndex).push(item);

    if (recordUndo) {
      this.undoStack.push({
        type: 'add',
        pageIndex,
        annotation: JSON.parse(JSON.stringify(item)),
      });
      this.redoStack = [];
    }

    this.notify('change', { pageIndex, annotation: item, action: 'add' });
    return item;
  }

  updateAnnotation(pageIndex, id, updates, recordUndo = true) {
    const list = this.annotations.get(pageIndex);
    if (!list) return null;

    const index = list.findIndex(a => a.id === id);
    if (index === -1) return null;

    const old = JSON.parse(JSON.stringify(list[index]));
    const updated = { ...list[index], ...updates };
    list[index] = updated;

    if (recordUndo) {
      this.undoStack.push({
        type: 'update',
        pageIndex,
        old,
        updated: JSON.parse(JSON.stringify(updated)),
      });
      this.redoStack = [];
    }

    this.notify('change', { pageIndex, annotation: updated, action: 'update' });
    return updated;
  }

  deleteAnnotation(pageIndex, id, recordUndo = true) {
    const list = this.annotations.get(pageIndex);
    if (!list) return false;

    const index = list.findIndex(a => a.id === id);
    if (index === -1) return false;

    const [deleted] = list.splice(index, 1);

    if (recordUndo) {
      this.undoStack.push({
        type: 'delete',
        pageIndex,
        annotation: JSON.parse(JSON.stringify(deleted)),
      });
      this.redoStack = [];
    }

    this.notify('change', { pageIndex, annotation: deleted, action: 'delete' });
    return true;
  }

  undo() {
    if (this.undoStack.length === 0) return false;
    const action = this.undoStack.pop();

    if (action.type === 'add') {
      this.deleteAnnotation(action.pageIndex, action.annotation.id, false);
      this.redoStack.push(action);
    } else if (action.type === 'delete') {
      this.addAnnotation(action.pageIndex, action.annotation, false);
      this.redoStack.push(action);
    } else if (action.type === 'update') {
      this.updateAnnotation(action.pageIndex, action.old.id, action.old, false);
      this.redoStack.push(action);
    }

    this.notify('history', { canUndo: this.canUndo(), canRedo: this.canRedo() });
    return true;
  }

  redo() {
    if (this.redoStack.length === 0) return false;
    const action = this.redoStack.pop();

    if (action.type === 'add') {
      this.addAnnotation(action.pageIndex, action.annotation, false);
      this.undoStack.push(action);
    } else if (action.type === 'delete') {
      this.deleteAnnotation(action.pageIndex, action.annotation.id, false);
      this.undoStack.push(action);
    } else if (action.type === 'update') {
      this.updateAnnotation(action.pageIndex, action.updated.id, action.updated, false);
      this.undoStack.push(action);
    }

    this.notify('history', { canUndo: this.canUndo(), canRedo: this.canRedo() });
    return true;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.annotations.clear();
    this.undoStack = [];
    this.redoStack = [];
    this.notify('clear', null);
  }
}
