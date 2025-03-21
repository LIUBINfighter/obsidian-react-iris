import React, { useEffect, useRef, useState } from 'react';
import { App, MarkdownRenderer, Notice } from 'obsidian';
import { MessageSegment } from '../utils/messageProcessorUtils';

interface CodeBlockProps {
  segment: MessageSegment;
  app: App;
  onAddToInbox: (segment: MessageSegment) => void;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ segment, app, onAddToInbox }) => {
  const codeContainerRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  useEffect(() => {
    if (codeContainerRef.current) {
      const container = codeContainerRef.current;
      container.empty();
      
      // 使用Obsidian的Markdown渲染器渲染代码块
      const codeBlockContent = `\`\`\`${segment.language || ''}\n${segment.content}\n\`\`\``;
      MarkdownRenderer.renderMarkdown(
        codeBlockContent,
        container,
        '',
        null
      );
      
      // 为渲染后的pre添加样式
      const preElement = container.querySelector('pre');
      if (preElement) {
        preElement.style.margin = '0';
        preElement.style.borderRadius = '4px';
        preElement.style.maxHeight = '300px';
      }
    }
  }, [segment]);
  
  // 复制代码到剪贴板
  const handleCopyCode = () => {
    navigator.clipboard.writeText(segment.content)
      .then(() => {
        setIsCopied(true);
        new Notice('代码已复制到剪贴板');
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(err => {
        console.error('无法复制代码:', err);
        new Notice('复制失败');
      });
  };
  
  return (
    <div className="code-block-container" style={{
      marginBottom: '12px',
      backgroundColor: 'var(--background-primary-alt)',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      <div 
        className="code-block-header" 
        style={{
          padding: '8px 12px',
          backgroundColor: 'var(--background-modifier-hover)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '13px'
        }}
      >
        <div style={{ color: 'var(--text-muted)' }}>
          {segment.language ? segment.language : '代码'}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onAddToInbox(segment)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-accent)',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '2px 6px',
              borderRadius: '4px'
            }}
            aria-label="添加到收藏"
          >
            <span>★</span>
          </button>
          <button
            onClick={handleCopyCode}
            style={{
              background: 'none',
              border: 'none',
              color: isCopied ? 'var(--text-success)' : 'var(--text-normal)',
              cursor: 'pointer',
              fontSize: '13px',
              padding: '2px 6px',
              borderRadius: '4px'
            }}
            aria-label="复制代码"
          >
            {isCopied ? '已复制' : '复制'}
          </button>
        </div>
      </div>
      
      <div 
        ref={codeContainerRef}
        className="code-block-content"
        style={{
          padding: '8px',
          overflow: 'auto'
        }}
      />
    </div>
  );
};
