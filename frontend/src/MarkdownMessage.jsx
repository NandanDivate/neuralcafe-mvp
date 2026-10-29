import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{
      margin: '12px 0',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      border: '1px solid var(--nc-border)',
      background: 'var(--nc-bg)',
      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.45)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '7px 12px',
        background: 'linear-gradient(180deg, var(--nc-titlebar-top) 0%, var(--nc-titlebar-bottom) 100%)',
        borderBottom: '1px solid var(--nc-border)',
        fontSize: '11px',
        fontFamily: 'var(--font-mono)',
        color: 'var(--nc-champagne)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        <span style={{ fontWeight: 600 }}>{language || 'code'}</span>
        <button
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          style={{
            background: copied ? 'rgba(117, 184, 149, 0.25)' : 'rgba(255, 255, 255, 0.08)',
            border: `1px solid ${copied ? 'var(--nc-success)' : 'var(--nc-border)'}`,
            color: copied ? 'var(--nc-success)' : 'var(--nc-text-secondary)',
            borderRadius: 'var(--radius-sm)',
            padding: '3px 9px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre style={{
        margin: 0,
        padding: '12px 14px',
        overflowX: 'auto',
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        lineHeight: 1.55,
        color: 'var(--nc-text)'
      }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function MarkdownMessage({ content }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            if (!inline && (match || codeString.includes('\n'))) {
              return (
                <CodeBlock
                  language={match ? match[1] : ''}
                  code={codeString}
                />
              );
            }
            return (
              <code
                style={{
                  background: 'rgba(216, 194, 154, 0.1)',
                  color: 'var(--nc-champagne)',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9em',
                  border: '1px solid rgba(216, 194, 154, 0.2)'
                }}
                {...props}
              >
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
