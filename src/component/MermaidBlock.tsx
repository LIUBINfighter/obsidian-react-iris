import React, { useEffect, useRef, useState } from 'react';
import { App, Notice } from 'obsidian';
import { MessageSegment } from '../utils/messageProcessorUtils';

interface MermaidBlockProps {
  segment: MessageSegment;
  app: App;
  onAddToInbox: (segment: MessageSegment) => void;
}

export const MermaidBlock: React.FC<MermaidBlockProps> = ({ segment, app, onAddToInbox }) => {
  const [viewMode, setViewMode] = useState<'graph' | 'code'>('graph');
  const [svgContent, setSvgContent] = useState<string>('');
  const [isRendering, setIsRendering] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 渲染Mermaid图表
  useEffect(() => {
    const renderMermaid = async () => {
      if (!containerRef.current) return;
      
      try {
        setIsRendering(true);
        setRenderError(null);
        
        // 尝试动态加载mermaid库
        // 在实际生产环境中，你可能需要添加适当的错误处理和加载检测
        const mermaid = (window as any).mermaid;
        
        if (!mermaid) {
          // 如果mermaid不存在，则尝试加载它
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js';
          script.onload = () => {
            const mermaid = (window as any).mermaid;
            mermaid.initialize({ startOnLoad: false, theme: 'default' });
            renderDiagram();
          };
          script.onerror = () => {
            setRenderError('无法加载Mermaid库');
            setIsRendering(false);
          };
          document.head.appendChild(script);
        } else {
          // 如果mermaid已经加载，则直接渲染
          renderDiagram();
        }
      } catch (error) {
        console.error('渲染Mermaid图表失败:', error);
        setRenderError(`渲染失败: ${error.message}`);
        setIsRendering(false);
      }
    };
    
    const renderDiagram = async () => {
      try {
        const mermaid = (window as any).mermaid;
        mermaid.initialize({ startOnLoad: false, theme: 'default' });
        
        // 使用mermaid的API渲染图表
        const { svg } = await mermaid.render('mermaid-diagram-' + segment.id, segment.content);
        setSvgContent(svg);
        setIsRendering(false);
      } catch (error) {
        console.error('渲染Mermaid图表失败:', error);
        setRenderError(`渲染失败: ${error.message}`);
        setIsRendering(false);
      }
    };
    
    renderMermaid();
  }, [segment]);
  
  // 复制SVG或代码到剪贴板
  const handleCopy = () => {
    const content = viewMode === 'graph' ? svgContent : segment.content;
    
    navigator.clipboard.writeText(content)
      .then(() => {
        setIsCopied(true);
        new Notice(`已复制${viewMode === 'graph' ? 'SVG' : '代码'}到剪贴板`);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(err => {
        console.error('复制失败:', err);
        new Notice('复制失败');
      });
  };
  
  // 保存为PNG或SVG文件
  const handleSave = async (format: 'png' | 'svg') => {
    try {
      if (format === 'svg') {
        // 保存为SVG文件
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        saveAs(blob, `mermaid-diagram-${Date.now()}.svg`);
      } else if (format === 'png' && containerRef.current) {
        // 将SVG转换为PNG
        const svgElement = containerRef.current.querySelector('svg');
        if (!svgElement) {
          new Notice('无法找到SVG元素');
          return;
        }
        
        // 创建Canvas
        const canvas = document.createElement('canvas');
        const rect = svgElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        const ctx = canvas.getContext('2d');
        
        // 创建Image对象
        const image = new Image();
        image.onload = () => {
          // 绘制图像并保存
          ctx.drawImage(image, 0, 0);
          canvas.toBlob(blob => {
            if (blob) {
              saveAs(blob, `mermaid-diagram-${Date.now()}.png`);
            } else {
              new Notice('创建PNG文件失败');
            }
          });
        };
        
        // 加载SVG数据
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        image.src = URL.createObjectURL(svgBlob);
      }
    } catch (error) {
      console.error('保存图表失败:', error);
      new Notice('保存图表失败');
    }
  };
  
  // 辅助函数：保存文件（在实际环境中，你可能会使用FileSaver.js等库）
  const saveAs = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
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
            aria-label={`复制${viewMode === 'graph' ? 'SVG' : '代码'}`}
          >
            {isCopied ? '已复制' : '复制'}
          </button>
          {viewMode === 'graph' && !isRendering && !renderError && (
            <>
              <button
                onClick={() => handleSave('svg')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-normal)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}
                aria-label="保存为SVG"
              >
                保存SVG
              </button>
              <button
                onClick={() => handleSave('png')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-normal)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}
                aria-label="保存为PNG"
              >
                保存PNG
              </button>
            </>
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
          isRendering ? (
            <div style={{ color: 'var(--text-muted)' }}>
              正在渲染图表...
            </div>
          ) : renderError ? (
            <div style={{ color: 'var(--text-error)', padding: '10px' }}>
              {renderError}
              <pre style={{ 
                marginTop: '10px', 
                padding: '10px', 
                backgroundColor: 'var(--background-secondary)',
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto'
              }}>
                {segment.content}
              </pre>
            </div>
          ) : (
            <div 
              ref={containerRef}
              dangerouslySetInnerHTML={{ __html: svgContent }}
              style={{ maxWidth: '100%' }}
            />
          )
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
