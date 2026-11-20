import React from 'react';

interface SafeMarkdownProps {
  content: string;
}

function renderInlineTokens(text: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      tokens.push(
        <strong key={key++} className="font-semibold text-slate-950 dark:text-white">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push(
        <code
          key={key++}
          className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200"
        >
          {token.slice(1, -1)}
        </code>,
      );
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }
  return tokens;
}

/**
 * Renders limited markdown (paragraphs, bullet lists, bold, inline code)
 * purely via React elements without dangerouslySetInnerHTML.
 */
export function SafeMarkdown({ content }: SafeMarkdownProps) {
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let listItems: string[] = [];
  let blockKey = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={blockKey++} className="my-2 list-disc space-y-1 pl-5">
        {listItems.map((item, idx) => (
          <li key={idx} className="leading-relaxed">
            {renderInlineTokens(item)}
          </li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      listItems.push(line.slice(2));
      continue;
    }
    flushList();
    blocks.push(
      <p key={blockKey++} className="my-1.5 leading-relaxed">
        {renderInlineTokens(line)}
      </p>,
    );
  }
  flushList();

  return <div className="text-sm text-slate-700 dark:text-slate-200">{blocks}</div>;
}
