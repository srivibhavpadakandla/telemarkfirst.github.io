import React, {useState} from 'react';
import OriginalCodeBlock from '@theme-original/CodeBlock';
import type {Props} from '@theme/CodeBlock';
import {PythonWordContext, wordAt} from '@site/src/components/pythonWordHighlight';

export default function CodeBlock(props: Props): React.ReactNode {
  const [activeWord, setActiveWord] = useState('');
  const python = props.language === 'python' || props.className?.split(' ').includes('language-python');
  if (!python) return <OriginalCodeBlock {...props} />;

  const updateWord = (root: HTMLDivElement) => {
    const selection = window.getSelection();
    const node = selection?.anchorNode;
    if (!node || !root.contains(node)) return;
    const selected = selection?.toString().trim() ?? '';
    const text = node.textContent ?? '';
    setActiveWord(selected && /^[A-Za-z_][A-Za-z_0-9]*$/.test(selected)
      ? selected
      : wordAt(text, selection?.anchorOffset ?? 0));
  };

  return <PythonWordContext.Provider value={activeWord}>
    <div onPointerUp={(event) => updateWord(event.currentTarget)} onKeyUp={(event) => updateWord(event.currentTarget)}>
      <OriginalCodeBlock {...props} />
    </div>
  </PythonWordContext.Provider>;
}
