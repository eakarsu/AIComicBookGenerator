'use strict';

const TRANSITIONS = Object.freeze({ brief: ['generating'], generating: ['editing', 'failed'], editing: ['review'], review: ['editing', 'approved'], approved: ['packaging'], packaging: ['published', 'failed'], published: [], failed: ['generating', 'packaging'] });

function transition(current, next, context) {
  if (!(TRANSITIONS[current] || []).includes(next)) throw new Error(`invalid transition ${current} -> ${next}`);
  if (next === 'approved') {
    if (!context?.rightsVerified) throw new Error('all source asset rights must be verified');
    if (context?.moderationStatus !== 'passed') throw new Error('content moderation must pass');
    if (!['editor', 'publisher', 'admin'].includes(context?.actorRole)) throw new Error('publishing approval role required');
  }
  if (next === 'published' && (!context?.packageChecksum || !context?.approvedVersion)) throw new Error('approved version and package checksum required');
  return next;
}

function evaluatePanel(spec, rendered) {
  if (!spec || !rendered) throw new Error('panel specification and render metadata are required');
  if (!Number.isInteger(rendered.width) || !Number.isInteger(rendered.height) || rendered.width < 1 || rendered.height < 1) throw new Error('valid render dimensions required');
  const missingCharacters = (spec.characterIds || []).filter((id) => !(rendered.characterIds || []).includes(id));
  const metadataComplete = Boolean(rendered.sha256 && rendered.model && rendered.promptVersion && rendered.provenanceId);
  return { dimensionsMatch: rendered.width === spec.width && rendered.height === spec.height, missingCharacters, metadataComplete, readyForReview: missingCharacters.length === 0 && metadataComplete && rendered.width === spec.width && rendered.height === spec.height };
}

function validateExport(manifest) {
  if (!['cbz', 'pdf', 'epub', 'print_pdf'].includes(manifest?.format)) throw new Error('unsupported export format');
  if (!Array.isArray(manifest.pages) || manifest.pages.length === 0) throw new Error('export pages required');
  if (manifest.pages.some((page, index) => page.order !== index + 1 || !page.sha256)) throw new Error('ordered checksummed pages required');
  return { pageCount: manifest.pages.length, format: manifest.format, fidelityCheckRequired: true };
}

module.exports = { TRANSITIONS, transition, evaluatePanel, validateExport };
