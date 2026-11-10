export interface PythonCompletion {
  label: string;
  detail: string;
  insertText: string;
  replaceStart: number;
  replaceEnd: number;
  selectionStart: number;
  selectionEnd: number;
}

interface Preset {
  label: string;
  detail: string;
  insertText?: string;
  select?: string;
  cursorOffset?: number;
}

const PRESETS: Preset[] = [
  {label: 'if', detail: 'Conditional block', insertText: 'if condition:\n    ', select: 'condition'},
  {label: 'elif', detail: 'Another condition', insertText: 'elif condition:\n    ', select: 'condition'},
  {label: 'else', detail: 'Fallback block', insertText: 'else:\n    '},
  {label: 'def', detail: 'Define a function', insertText: 'def function_name():\n    ', select: 'function_name'},
  {label: 'for', detail: 'Loop over values', insertText: 'for item in items:\n    ', select: 'item in items'},
  {label: 'while', detail: 'Conditional loop', insertText: 'while condition:\n    ', select: 'condition'},
  {label: 'return', detail: 'Return from a function'},
  {label: 'print', detail: 'Show output', insertText: 'print()', cursorOffset: 6},
  ...'import from as class try except finally with break continue pass and or not in is True False None'.split(' ')
    .map((label) => ({label, detail: 'Python keyword'})),
];

// Replace string and comment contents with spaces while preserving line breaks.
// This keeps both completion context and simple declaration matching out of prose.
function codeOnly(source: string): string {
  let result = '';
  let quote = '';
  let triple = false;
  let comment = false;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (char === '\n') {
      result += '\n';
      comment = false;
      if (quote && !triple) quote = '';
      continue;
    }
    if (comment) { result += ' '; continue; }
    if (quote) {
      if (char === '\\') { result += '  '; i += 1; continue; }
      if (triple && source.slice(i, i + 3) === quote.repeat(3)) {
        result += '   ';
        i += 2;
        quote = '';
        triple = false;
      } else if (!triple && char === quote) { result += ' '; quote = ''; }
      else result += ' ';
      continue;
    }
    if (char === '#') { comment = true; result += ' '; continue; }
    if (char === '"' || char === "'") {
      quote = char;
      triple = source.slice(i, i + 3) === char.repeat(3);
      result += triple ? '   ' : ' ';
      if (triple) i += 2;
      continue;
    }
    result += char;
  }
  return result;
}

function definedNames(source: string): string[] {
  const names = new Set<string>();
  const clean = codeOnly(source);
  for (const line of clean.split('\n')) {
    const assignment = line.match(/^\s*([A-Za-z_]\w*)\s*(?::[^=]+)?(?:=(?!=)|[+\-*/%]=)/);
    if (assignment) names.add(assignment[1]);
    const loop = line.match(/^\s*(?:async\s+)?for\s+([A-Za-z_]\w*)\s+in\b/);
    if (loop) names.add(loop[1]);
    const alias = line.match(/^\s*(?:with|except)\b.*\bas\s+([A-Za-z_]\w*)\s*:?\s*$/);
    if (alias) names.add(alias[1]);
    const definition = line.match(/^\s*(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\(([^)]*)\)/);
    if (definition) {
      names.add(definition[1]);
      definition[2].split(',').forEach((parameter) => {
        const name = parameter.trim().match(/^\*{0,2}([A-Za-z_]\w*)/);
        if (name) names.add(name[1]);
      });
    }
    const imported = line.match(/^\s*(?:from\s+[\w.]+\s+)?import\s+(.+)$/);
    if (imported) imported[1].split(',').forEach((part) => {
      const name = part.trim().match(/^([A-Za-z_]\w*)(?:\s+as\s+([A-Za-z_]\w*))?/);
      if (name) names.add(name[2] || name[1]);
    });
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

export function pythonCompletions(source: string, cursor: number, force = false): PythonCompletion[] {
  const before = source.slice(0, cursor);
  const marked = codeOnly(`${before}§`);
  if (!marked.endsWith('§')) return [];
  const clean = marked.slice(0, -1);
  const match = clean.match(/([A-Za-z_]\w*)$/);
  const prefix = match?.[1] ?? '';
  if (clean[clean.length - prefix.length - 1] === '.') return [];
  if (!force && prefix.length < 2) return [];
  const replaceStart = cursor - prefix.length;
  const indent = before.slice(before.lastIndexOf('\n') + 1).match(/^\s*/)?.[0] ?? '';
  const pool: Preset[] = [...PRESETS, ...definedNames(source).map((label) => ({label, detail: 'Defined name'}))];
  const seen = new Set<string>();
  return pool.filter((item) => item.label.startsWith(prefix) && !seen.has(item.label) && !!seen.add(item.label))
    .slice(0, 30)
    .map((item) => {
      const insertText = (item.insertText ?? item.label).replace(/\n/g, `\n${indent}`);
      const selectionOffset = item.select ? insertText.indexOf(item.select) : -1;
      const selectionStart = replaceStart + (selectionOffset >= 0 ? selectionOffset : item.cursorOffset ?? insertText.length);
      return {
        label: item.label,
        detail: item.detail,
        insertText,
        replaceStart,
        replaceEnd: cursor,
        selectionStart,
        selectionEnd: selectionStart + (selectionOffset >= 0 ? item.select!.length : 0),
      };
    });
}

export function insertPythonCompletion(source: string, completion: PythonCompletion): {code: string; start: number; end: number} {
  return {
    code: source.slice(0, completion.replaceStart) + completion.insertText + source.slice(completion.replaceEnd),
    start: completion.selectionStart,
    end: completion.selectionEnd,
  };
}
