import React, {useContext} from 'react';
import type {Props} from '@theme/CodeBlock/Line/Token';
import {PythonWordContext, highlightedWordParts} from '@site/src/components/pythonWordHighlight';

export default function CodeBlockLineToken({line, token, children, ...props}: Props): React.ReactNode {
  const word = useContext(PythonWordContext);
  return <span {...props}>{word && typeof children === 'string' ? highlightedWordParts(children, word) : children}</span>;
}
