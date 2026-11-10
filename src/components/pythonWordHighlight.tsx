import React, {createContext} from 'react';

export const PythonWordContext = createContext('');

const identifier = /^[A-Za-z_][A-Za-z_0-9]*$/;
const wordCharacter = /[A-Za-z_0-9]/;

export function wordAt(text: string, start: number, end = start): string {
  if (start !== end) {
    const selected = text.slice(start, end);
    return identifier.test(selected) ? selected : '';
  }
  let left = start;
  let right = start;
  if (!wordCharacter.test(text[left] ?? '') && wordCharacter.test(text[left - 1] ?? '')) left -= 1;
  while (left > 0 && wordCharacter.test(text[left - 1])) left -= 1;
  while (right < text.length && wordCharacter.test(text[right])) right += 1;
  const found = text.slice(left, right);
  return identifier.test(found) ? found : '';
}

export function wordParts(text: string, word: string): {text: string; match: boolean}[] {
  if (!word || !text.includes(word)) return [{text, match: false}];
  const parts: {text: string; match: boolean}[] = [];
  let cursor = 0;
  let index = text.indexOf(word);
  while (index !== -1) {
    const before = text[index - 1] ?? '';
    const after = text[index + word.length] ?? '';
    if (!wordCharacter.test(before) && !wordCharacter.test(after)) {
      if (index > cursor) parts.push({text: text.slice(cursor, index), match: false});
      parts.push({text: word, match: true});
      cursor = index + word.length;
    }
    index = text.indexOf(word, index + word.length);
  }
  if (cursor < text.length) parts.push({text: text.slice(cursor), match: false});
  return parts.length ? parts : [{text, match: false}];
}

export function highlightedWordParts(text: string, word: string): React.ReactNode {
  return wordParts(text, word).map((part, index) => part.match
    ? <span className="tm-python-word-match" key={index}>{part.text}</span>
    : <React.Fragment key={index}>{part.text}</React.Fragment>);
}
