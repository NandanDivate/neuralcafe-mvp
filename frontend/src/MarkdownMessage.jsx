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
      borderRadius: '6px',
      overflow: 'hidden',
      border: '1px solid rgba(255, 255, 255, 0.18)',
      background: 'rgba(8, 16, 28, 0.95)',
      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.45)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 12px',
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        fontSize: '11px',
        fontFamily: 'var(--font-mono)',
        color: '#93c5fd',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        <span style={{ fontWeight: 600 }}>{language || 'code'}</span>
        <button
          onClick={handleCopy}
          style={{
            background: copied ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.12)',
            border: `1px solid ${copied ? '#10b981' : 'rgba(255, 255, 255, 0.25)'}`,
            color: copied ? '#34d399' : '#e2e8f0',
            borderRadius: '3px',
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
        color: '#f8fafc'
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
                  background: 'rgba(56, 189, 248, 0.12)',
                  color: '#7dd3fc',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9em',
                  border: '1px solid rgba(56, 189, 248, 0.25)'
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
