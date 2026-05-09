'use client';

import { ReactNode } from 'react';
import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAppStore } from '@/stores/app-store';

interface MarkdownRendererProps {
  content: string;
}

function flattenText(children: ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (!children) return '';
  if (Array.isArray(children)) return children.map(flattenText).join('');
  if (typeof children === 'object' && 'props' in children) {
    return flattenText((children as { props?: { children?: ReactNode } }).props?.children);
  }
  return '';
}

function isChapterHeading(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return /^第[\d一二三四五六七八九十百零两]+[章节幕回]/.test(text.trim())
    || normalized.startsWith('chapter ')
    || normalized.startsWith('prologue')
    || normalized.startsWith('epilogue');
}

function isDialogueParagraph(text: string): boolean {
  const normalized = text.trim();
  return /^["“‘「『]/.test(normalized)
    || /^[-—]{1,2}\s*/.test(normalized);
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button onClick={handleCopy} className="copy-btn">
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          已复制
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          复制
        </>
      )}
    </button>
  );
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const { theme, activeMode } = useAppStore();
  const codeTheme = theme === 'dark' ? oneDark : oneLight;
  const isWritingMode = activeMode === 'writing';

  return (
    <div className={`markdown-body ${isWritingMode ? 'markdown-body-writing' : ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1({ children, ...props }) {
            const text = flattenText(children);
            return (
              <h1 className={isWritingMode && isChapterHeading(text) ? 'writing-chapter-heading' : undefined} {...props}>
                {children}
              </h1>
            );
          },
          h2({ children, ...props }) {
            const text = flattenText(children);
            return (
              <h2 className={isWritingMode && isChapterHeading(text) ? 'writing-chapter-heading' : undefined} {...props}>
                {children}
              </h2>
            );
          },
          h3({ children, ...props }) {
            const text = flattenText(children);
            return (
              <h3 className={isWritingMode && isChapterHeading(text) ? 'writing-chapter-heading' : undefined} {...props}>
                {children}
              </h3>
            );
          },
          p({ children, ...props }) {
            const text = flattenText(children);
            const className = isWritingMode
              ? isDialogueParagraph(text)
                ? 'writing-dialogue'
                : 'writing-paragraph'
              : undefined;

            return (
              <p className={className} {...props}>
                {children}
              </p>
            );
          },
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');

            // Check if it's an inline code or block code
            const isInline = !match && !codeString.includes('\n');

            if (isInline) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }

            const language = match?.[1] || 'text';

            return (
              <div className="code-block-wrapper">
                <div className="code-block-header">
                  <span className="language-tag">{language}</span>
                  <CopyButton text={codeString} />
                </div>
                <SyntaxHighlighter
                  style={codeTheme}
                  language={language}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    padding: '1em',
                    background: 'transparent',
                    fontSize: '0.8125rem',
                  }}
                >
                  {codeString}
                </SyntaxHighlighter>
              </div>
            );
          },
          // Customize link to open in new tab
          a({ href, children, ...props }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
