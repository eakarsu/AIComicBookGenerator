const test = require('node:test');
const assert = require('node:assert/strict');
const { transition, evaluatePanel, validateExport } = require('../domain/publishingWorkflow');

test('blocks approval without rights, moderation, and editor authority', () => {
  assert.throws(() => transition('review', 'approved', { rightsVerified: false, moderationStatus: 'passed', actorRole: 'editor' }), /rights/);
  assert.throws(() => transition('review', 'approved', { rightsVerified: true, moderationStatus: 'pending', actorRole: 'editor' }), /moderation/);
  assert.equal(transition('review', 'approved', { rightsVerified: true, moderationStatus: 'passed', actorRole: 'publisher' }), 'approved');
});
test('checks character continuity, dimensions, and provenance metadata', () => {
  const result = evaluatePanel({ width: 1200, height: 1800, characterIds: ['hero'] }, { width: 1200, height: 1800, characterIds: [], sha256: 'a', model: 'm', promptVersion: 2, provenanceId: 'p' });
  assert.deepEqual(result.missingCharacters, ['hero']); assert.equal(result.readyForReview, false);
});
test('requires ordered checksummed export pages', () => {
  assert.deepEqual(validateExport({ format: 'cbz', pages: [{ order: 1, sha256: 'abc' }] }), { pageCount: 1, format: 'cbz', fidelityCheckRequired: true });
  assert.throws(() => validateExport({ format: 'pdf', pages: [{ order: 2, sha256: 'abc' }] }), /ordered/);
});
