import React, { useEffect, useRef, useState } from 'react';
import { App, Notice, MarkdownRenderer } from 'obsidian';
import { MessageSegment } from '../utils/messageProcessorUtils';

interface MermaidBlockProps {
  segment: MessageSegment;
  app: App;
  onAddToInbox: (segment: MessageSegment) => void;
}

export const MermaidBlock: React.FC<MermaidBlockProps> = ({ segment, app, onAddToInbox }) => {
  const [viewMode, setViewMode] = useState<'graph' | 'code'>('graph');
  const [isCopied, setIsCopied] = useState(false);
  const [isRendering, setIsRendering] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 渲染Mermaid图表 - 使用Obsidian的MarkdownRenderer
  useEffect(() => {
    if (!containerRef.current || viewMode !== 'graph') return;
    
    try {
      setIsRendering(true);
      setRenderError(null);
      
      const container = containerRef.current;
      container.empty(); // 清空容器
      
      // 创建完整的mermaid代码块
      const mermaidMarkdown = `\`\`\`mermaid\n${segment.content}\n\`\`\``;
      
      // 使用Obsidian的MarkdownRenderer渲染mermaid图表
      MarkdownRenderer.renderMarkdown(
        mermaidMarkdown,
        container,
        '',
        null
      ).then(() => {
        // 渲染完成
        setIsRendering(false);
      }).catch(error => {
        console.error('使用Obsidian渲染Mermaid失败:', error);
        setRenderError(`渲染失败: ${error.message || '未知错误'}`);
        setIsRendering(false);
      });
    } catch (error) {
      console.error('渲染Mermaid图表失败:', error);
      setRenderError(`渲染失败: ${error.message || '未知错误'}`);
      setIsRendering(false);
    }
  }, [segment, viewMode]);
  
  // 复制代码到剪贴板
  const handleCopy = () => {
    const content = segment.content;
    
    navigator.clipboard.writeText(content)
      .then(() => {
        setIsCopied(true);
        new Notice(`已复制${viewMode === 'graph' ? 'Mermaid代码' : '代码'}到剪贴板`);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(err => {
        console.error('复制失败:', err);
        new Notice('复制失败');
      });
  };
  
  // 导出图片 (使用Obsidian API，简化版)
  const handleExport = () => {
    try {
      // 查找SVG元素
      const svgElement = containerRef.current?.querySelector('svg');
      if (!svgElement) {
        new Notice('无法找到图表元素');
        return;
      }
      
      // 获取SVG代码
      const svgString = new XMLSerializer().serializeToString(svgElement);
      
      // 复制到剪贴板
      navigator.clipboard.writeText(svgString)
        .then(() => {
          new Notice('图表SVG代码已复制到剪贴板');
        })
        .catch(err => {
          console.error('复制SVG失败:', err);
          new Notice('复制SVG失败');
        });
    } catch (error) {
      console.error('导出图表失败:', error);
      new Notice('导出图表失败');
    }
  };
  
  return (
    <div className="mermaid-block-container" style={{
      marginBottom: '12px',
      backgroundColor: 'var(--background-primary-alt)',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      <div 
        className="mermaid-block-header" 
        style={{
          padding: '8px 12px',
          backgroundColor: 'var(--background-modifier-hover)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
            Mermaid图表
          </span>
          <div className="view-toggle" style={{ display: 'flex' }}>
            <button
              onClick={() => setViewMode('graph')}
              style={{
                background: viewMode === 'graph' ? 'var(--interactive-accent)' : 'var(--background-secondary)',
                color: viewMode === 'graph' ? 'var(--text-on-accent)' : 'var(--text-muted)',
                border: 'none',
                padding: '3px 8px',
                fontSize: '12px',
                borderTopLeftRadius: '4px',
                borderBottomLeftRadius: '4px',
                cursor: 'pointer'
              }}
            >
              图表
            </button>
            <button
              onClick={() => setViewMode('code')}
              style={{
                background: viewMode === 'code' ? 'var(--interactive-accent)' : 'var(--background-secondary)',
                color: viewMode === 'code' ? 'var(--text-on-accent)' : 'var(--text-muted)',
                border: 'none',
                padding: '3px 8px',
                fontSize: '12px',
                borderTopRightRadius: '4px',
                borderBottomRightRadius: '4px',
                cursor: 'pointer'
              }}
            >
              代码
            </button>
          </div>
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
            onClick={handleCopy}
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
          {viewMode === 'graph' && !isRendering && !renderError && (
            <button
              onClick={handleExport}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-normal)',
                cursor: 'pointer',
                fontSize: '13px',
                padding: '2px 6px',
                borderRadius: '4px'
              }}
              aria-label="导出图表"
            >
              导出SVG
            </button>
          )}
        </div>
      </div>
      
      <div 
        className="mermaid-block-content"
        style={{
          padding: '12px',
          minHeight: '100px',
          backgroundColor: 'var(--background-primary)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'auto'
        }}
      >
        {viewMode === 'graph' ? (
          <>
            <div 
              ref={containerRef}
              style={{ 
                width: '100%', 
                display: isRendering ? 'none' : 'block',
                minHeight: '50px'
              }}
            />
            
            {/* Loading indicator */}
            {isRendering && (
              <div style={{ 
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '8px',
                padding: '20px'
              }}>
                <div>正在渲染图表...</div>
                <div style={{ 
                  width: '50px', 
                  height: '6px', 
                  backgroundColor: 'var(--background-modifier-border)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: '30%',
                    backgroundColor: 'var(--interactive-accent)',
                    borderRadius: '3px',
                    animation: 'loading-animation 1.5s infinite ease-in-out'
                  }}/>
                </div>
                <style>
                  {`
                    @keyframes loading-animation {
                      0% { left: -30%; }
                      100% { left: 100%; }
                    }
                  `}
                </style>
              </div>
            )}
            
            {/* Error indicator */}
            {renderError && (
              <div style={{ 
                color: 'var(--text-error)', 
                padding: '10px', 
                textAlign: 'center' 
              }}>
                <div style={{ 
                  marginBottom: '10px', 
                  fontWeight: 'bold' 
                }}>
                  {renderError}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  Mermaid 支持的图表类型: flowchart, sequenceDiagram, classDiagram, stateDiagram-v2, erDiagram, 
                  gantt, pie, journey, gitGraph, mindmap 等。
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  <a 
                    href="https://mermaid.js.org/syntax/flowchart.html" 
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--text-accent)' }}
                  >
                    查看 Mermaid 语法文档
                  </a>
                </div>
                <pre style={{ 
                  marginTop: '10px', 
                  padding: '10px', 
                  backgroundColor: 'var(--background-secondary)',
                  borderRadius: '4px',
                  fontSize: '12px',
                  overflow: 'auto',
                  textAlign: 'left'
                }}>
                  {segment.content}
                </pre>
              </div>
            )}
          </>
        ) : (
          <pre style={{ 
            width: '100%',
            margin: 0,
            padding: '10px',
            backgroundColor: 'var(--background-secondary)',
            color: 'var(--text-normal)',
            borderRadius: '4px',
            fontSize: '14px',
            fontFamily: 'var(--font-monospace)',
            overflow: 'auto',
            whiteSpace: 'pre-wrap'
          }}>
            {segment.content}
          </pre>
        )}
      </div>
    </div>
  );
};
