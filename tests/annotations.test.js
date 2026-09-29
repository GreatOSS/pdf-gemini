import test from 'node:test';
import assert from 'node:assert';
import { AnnotationsManager } from '../src/core/annotations-manager.js';

test('AnnotationsManager add, undo, and redo', () => {
  const mgr = new AnnotationsManager();

  const ann1 = mgr.addAnnotation(0, {
    type: 'highlight',
    color: '#facc15',
    x: 50,
    y: 100,
    width: 200,
    height: 20,
  });

  assert.strictEqual(mgr.getAnnotationsForPage(0).length, 1);
  assert.strictEqual(mgr.canUndo(), true);
  assert.strictEqual(mgr.canRedo(), false);

  // Undo add
  mgr.undo();
  assert.strictEqual(mgr.getAnnotationsForPage(0).length, 0);
  assert.strictEqual(mgr.canUndo(), false);
  assert.strictEqual(mgr.canRedo(), true);

  // Redo add
  mgr.redo();
  assert.strictEqual(mgr.getAnnotationsForPage(0).length, 1);
  assert.strictEqual(mgr.getAnnotationsForPage(0)[0].id, ann1.id);
});

test('AnnotationsManager update and delete', () => {
  const mgr = new AnnotationsManager();

  const ann = mgr.addAnnotation(0, {
    type: 'text',
    text: 'Original Text',
    x: 100,
    y: 100,
  });

  mgr.updateAnnotation(0, ann.id, { text: 'Updated Text' });
  assert.strictEqual(mgr.getAnnotationsForPage(0)[0].text, 'Updated Text');

  mgr.deleteAnnotation(0, ann.id);
  assert.strictEqual(mgr.getAnnotationsForPage(0).length, 0);

  // Undo delete
  mgr.undo();
  assert.strictEqual(mgr.getAnnotationsForPage(0).length, 1);
  assert.strictEqual(mgr.getAnnotationsForPage(0)[0].text, 'Updated Text');
});
