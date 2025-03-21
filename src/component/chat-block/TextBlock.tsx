import React, { useEffect, useRef } from 'react';
import { App, MarkdownRenderer, setIcon } from 'obsidian';
import { MessageSegment } from '../utils/messageProcessorUtils';

interface TextBlockProps {
  segment: MessageSegment;
  onAddToInbox: (segment: MessageSegment) => void;
  app: App; // 需要传入 app 参数以使用 MarkdownRenderer
}

export const TextBlock: React.FC<TextBlockProps> = ({ segment, onAddToInbox, app }) => {
  // 检查内容是否够长，若够长则显示收藏按钮
  const isLongEnough = segment.content.length > 10;
  const contentRef = useRef<HTMLDivElement>(null);

  // 使用 Obsidian 的 MarkdownRenderer 渲染 Markdown 内容
  useEffect(() => {
    if (!contentRef.current) return;

    const container = contentRef.current;
    container.empty();

    // 渲染 Markdown 内容
    MarkdownRenderer.renderMarkdown(
      segment.content,
      container,
      '', // 源文件路径，这里可以为空
      null // 组件实例，可以为空
    ).catch(error => {
      console.error("Markdown 渲染失败:", error);
      // 如果渲染失败，显示原始文本
      container.textContent = segment.content;
    });

    // 初始化双向链接等交互功能
    const links = container.querySelectorAll('a.internal-link');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href) {
          // 使用 Obsidian API 打开内部链接
          app.workspace.openLinkText(
            href,
            '',
            e.ctrlKey || e.metaKey // 是否在新窗口打开
          );
        }
      });
    });

    // 设置外部链接在新窗口打开
    const externalLinks = container.querySelectorAll('a:not(.internal-link)');
    externalLinks.forEach(link => {
      if (!link.hasAttribute('target')) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });

  }, [segment.content, app]);

  return (
    <div 
      className="text-block" 
      style={{
        position: 'relative',
        marginBottom: '4px',
        backgroundColor: 'var(--background)',
        borderRadius: '4px',
        color: 'var(--text-normal)',
        border: '1px solid transparent', // 添加透明边框作为占位
        transition: 'border-color 0.2s ease', // 添加边框颜色过渡效果
        // padding: '2px' // 添不加内边距使内容看起来更紧凑
      }}
      onMouseEnter={(e) => {
        // 高亮边框
        e.currentTarget.style.borderColor = 'var(--interactive-accent)';
        // 查找并显示收藏按钮
        const actionsEl = e.currentTarget.querySelector('.text-block-actions') as HTMLElement;
        if (actionsEl) actionsEl.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        // 恢复透明边框
        e.currentTarget.style.borderColor = 'transparent';
        // 隐藏收藏按钮
        const actionsEl = e.currentTarget.querySelector('.text-block-actions') as HTMLElement;
        if (actionsEl) actionsEl.style.opacity = '0';
      }}
    >
      {/* 移除此处的直接文本显示，只使用 Markdown 渲染的容器 */}
      <div 
        ref={contentRef}
        className="markdown-rendered"
        style={{
          /* 使样式与 Obsidian 保持一致 */
          fontSize: 'var(--font-text-size)',
          lineHeight: 'var(--line-height-normal)',
          fontFamily: 'var(--font-text)',
          color: 'var(--text-normal)',
          width: '100%'
        }}
      />
      
      {isLongEnough && (
        <div 
          className="text-block-actions"
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            opacity: 0, // 默认隐藏整个按钮容器
            transition: 'opacity 0.2s ease',
            backgroundColor: 'var(--background-secondary)', // 使用次级背景色，更明显
            borderRadius: '4px',
            padding: '2px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', // 添加轻微阴影提升层次感
            zIndex: 10 // 确保按钮显示在顶层
          }}
          // 移除独立的鼠标事件处理器，由父元素统一控制
        >
          <button
            onClick={() => onAddToInbox(segment)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-accent)',
              cursor: 'pointer',
              fontSize: '14px',
              borderRadius: '4px',
              opacity: 1, // 确保按钮本身是不透明的
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px'
            }}
            aria-label="添加到收藏"
            title="收藏这个段落"
          >
            <div ref={el => el && setIcon(el, 'star')} />
          </button>
        </div>
      )}
    </div>
  );
};
