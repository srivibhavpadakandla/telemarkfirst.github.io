const crypto = require('node:crypto');

function revision(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function blockId(start, end, content) {
  return `${start}:${end}:${revision(content)}`;
}

function findBlock(source, id) {
  const match = /^(\d+):(\d+):([0-9a-f]{64})$/.exec(id || '');
  if (!match) return null;
  const start = Number(match[1]);
  const end = Number(match[2]);
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end)
    || start < 0 || end <= start || end > source.length) return null;
  const content = source.slice(start, end);
  if (revision(content) !== match[3]) return null;
  return {start, end, content};
}

function deletionRange(source, selected) {
  const lineStart = source.lastIndexOf('\n', selected.start - 1) + 1;
  const nextNewline = source.indexOf('\n', selected.end);
  const lineEnd = nextNewline === -1 ? source.length : nextNewline;
  // A heading, paragraph, or list item can be removed with its whole line.
  // A table cell stays inside its row, so only its content is cleared.
  if (!source.slice(lineStart, selected.start).trim()
    && !source.slice(selected.end, lineEnd).trim()) {
    return {start: lineStart, end: nextNewline === -1 ? source.length : nextNewline + 1};
  }
  return {start: selected.start, end: selected.end};
}

function applyBlockChanges(source, changes) {
  if (!Array.isArray(changes) || changes.length === 0 || changes.length > 200) {
    throw Object.assign(new Error('Choose 1 to 200 text blocks to save.'), {status: 400});
  }
  const seen = new Set();
  const edits = changes.map((change) => {
    if (!change || typeof change.block !== 'string' || seen.has(change.block)
      || (change.delete !== true && typeof change.content !== 'string')) {
      throw Object.assign(new Error('Invalid or duplicate text block change.'), {status: 400});
    }
    seen.add(change.block);
    const selected = findBlock(source, change.block);
    if (!selected) {
      throw Object.assign(new Error('A text block changed. Reload the page before saving.'), {status: 409});
    }
    const range = change.delete === true ? deletionRange(source, selected) : selected;
    return {...range, content: change.delete === true ? '' : change.content};
  }).sort((left, right) => left.start - right.start);
  for (let index = 1; index < edits.length; index += 1) {
    if (edits[index - 1].end > edits[index].start) {
      throw Object.assign(new Error('Selected text blocks overlap.'), {status: 400});
    }
  }
  return edits.reverse().reduce(
    (updated, edit) => updated.slice(0, edit.start) + edit.content + updated.slice(edit.end),
    source,
  );
}

module.exports = {revision, blockId, findBlock, applyBlockChanges};
