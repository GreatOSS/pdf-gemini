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

test('AnnotationsManager reorderPage maintains annotation positioning and undo history', () => {
  const mgr = new AnnotationsManager();

  mgr.addAnnotation(0, { type: 'note', text: 'Page 0 Note' });
  mgr.addAnnotation(2, { type: 'note', text: 'Page 2 Note' });

  assert.strictEqual(mgr.getAnnotationsForPage(0).length, 1);
  assert.strictEqual(mgr.getAnnotationsForPage(1).length, 0);
  assert.strictEqual(mgr.getAnnotationsForPage(2).length, 1);

  // Reorder page 0 to index 2 (0 -> 2, 1 -> 0, 2 -> 1)
  mgr.reorderPage(0, 2);

  assert.strictEqual(mgr.getAnnotationsForPage(0).length, 0, 'New page 0 should have no notes');
  assert.strictEqual(mgr.getAnnotationsForPage(1)[0].text, 'Page 2 Note', 'Old page 2 note shifted to page 1');
  assert.strictEqual(mgr.getAnnotationsForPage(2)[0].text, 'Page 0 Note', 'Old page 0 note moved to page 2');
});

test('AnnotationsManager deletePage cleans up target page and shifts subsequent annotations', () => {
  const mgr = new AnnotationsManager();

  mgr.addAnnotation(0, { type: 'highlight', id: 'h0' });
  mgr.addAnnotation(1, { type: 'highlight', id: 'h1' });
  mgr.addAnnotation(2, { type: 'highlight', id: 'h2' });

  // Delete page 1
  mgr.deletePage(1);

  assert.strictEqual(mgr.getAnnotationsForPage(0)[0].id, 'h0');
  assert.strictEqual(mgr.getAnnotationsForPage(1)[0].id, 'h2', 'Page 2 annotations shifted to page 1');
  assert.strictEqual(mgr.getAnnotationsForPage(2).length, 0);
});

test('AnnotationsManager duplicatePage clones annotations and shifts subsequent annotations', () => {
  const mgr = new AnnotationsManager();

  mgr.addAnnotation(0, { type: 'stamp', stampType: 'APPROVED' });
  mgr.addAnnotation(1, { type: 'stamp', stampType: 'CONFIDENTIAL' });

  mgr.duplicatePage(0);

  assert.strictEqual(mgr.getAnnotationsForPage(0).length, 1);
  assert.strictEqual(mgr.getAnnotationsForPage(0)[0].stampType, 'APPROVED');

  assert.strictEqual(mgr.getAnnotationsForPage(1).length, 1, 'Duplicate page should receive cloned annotation');
  assert.strictEqual(mgr.getAnnotationsForPage(1)[0].stampType, 'APPROVED');
  assert.notStrictEqual(mgr.getAnnotationsForPage(1)[0].id, mgr.getAnnotationsForPage(0)[0].id, 'Cloned annotation should have unique ID');

  assert.strictEqual(mgr.getAnnotationsForPage(2).length, 1, 'Previous page 1 should now be at index 2');
  assert.strictEqual(mgr.getAnnotationsForPage(2)[0].stampType, 'CONFIDENTIAL');
});
