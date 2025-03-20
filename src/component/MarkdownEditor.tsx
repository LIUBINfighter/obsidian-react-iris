import React, { useState, useEffect, useRef } from 'react';
import { App, TFile, MarkdownRenderer } from 'obsidian';

interface EditorComponentProps {
  initialText: string;
  app: App; // 添加Obsidian App实例作为必须属性
}

export const EditorComponent: React.FC<EditorComponentProps> = ({ 
  initialText,
  app
}) => {
  const [text, setText] = useState(initialText);
  const [preview, setPreview] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TFile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    console.log("EditorComponent 已挂载");
    
    // 添加点击外部关闭下拉菜单的事件
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    // 初始渲染预览内容
    renderPreview();
    
    return () => {
      console.log("EditorComponent 已卸载");
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // 当文本变化或预览模式变化时重新渲染预览
  useEffect(() => {
    if (preview) {
      renderPreview();
    }
  }, [text, preview]);
  
  // 使用Obsidian的MarkdownRenderer渲染预览
  const renderPreview = async () => {
    if (previewRef.current && preview) {
      // 清空容器
      previewRef.current.innerHTML = '';
      
      try {
        // 检查app是否存在
        if (!app) {
          console.error("无法渲染Markdown：app实例未提供");
          previewRef.current.textContent = "预览无法加载 - app实例未提供";
          return;
        }
        
        // 获取预览容器的DOM元素
        const previewEl = previewRef.current;
        
        // 创建一个元素的唯一ID，用于处理内部链接等
        const elementId = `markdown-preview-${Date.now()}`;
        previewEl.id = elementId;
        
        // 设置预览容器的基本样式类
        previewEl.classList.add("markdown-rendered");
        previewEl.classList.add("markdown-preview-view");
        
        // 使用MarkdownRenderer渲染Markdown内容
        // 第三个参数是源文件路径，对于临时内容可以为空
        // 第四个参数可以传递一个组件上下文来支持内部链接和其他功能
        await MarkdownRenderer.renderMarkdown(
          text,
          previewEl,
          '',
          {
            // 提供一个sourcePath可以帮助解析相对链接
            sourcePath: '',
            // 添加一个containerEl帮助处理嵌入式内容
            containerEl: previewEl,
            // 用于正确渲染其他类型的内容
            app: app
          }
        );
        
        // 处理Mermaid图表和代码块
        // 渲染后查找所有未渲染的代码块
        const unprocessedCodeBlocks = previewEl.querySelectorAll("pre > code");
        for (let codeBlock of Array.from(unprocessedCodeBlocks)) {
          const pre = codeBlock.parentElement;
          if (!pre) continue;
          
          // 检查是否为Mermaid图表
          if (codeBlock.classList.contains("language-mermaid")) {
            try {
              // 触发Mermaid渲染 - Obsidian应该能自动处理这个
              // 但如果没有自动处理，可能需要添加额外处理逻辑
              const mermaidDiv = document.createElement("div");
              mermaidDiv.addClass("mermaid");
              mermaidDiv.setText(codeBlock.textContent || "");
              pre.replaceWith(mermaidDiv);
            } catch (err) {
              console.error("无法渲染Mermaid图表:", err);
            }
          } else {
            // 对其他代码块应用语法高亮
            codeBlock.classList.add("is-loaded");
          }
        }
        
        // 添加点击事件处理内部链接
        const links = previewEl.querySelectorAll("a.internal-link");
        for (let link of Array.from(links)) {
          link.addEventListener("click", (e) => {
            e.preventDefault();
            const href = link.getAttribute("href");
            if (href) {
              // 这里可以添加处理内部链接的逻辑
              console.log("内部链接被点击:", href);
              // 可以调用app.workspace.openLinkText来打开链接
            }
          });
        }
        
      } catch (error) {
        console.error("渲染Markdown时出错:", error);
        previewRef.current.textContent = "预览渲染失败: " + error.message;
      }
    }
  };
  
  // 处理文本变化
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };
  
  // 切换预览模式
  const togglePreview = () => {
    setPreview(!preview);
  };
  
  return (
    <div className="editor-component" style={{ 
      padding: "0",
      border: "1px solid var(--background-modifier-border)",
      borderRadius: "5px",
      backgroundColor: "var(--background-primary)"
    }}>
      <div className="editor-toolbar" style={{
        padding: "8px",
        borderBottom: "1px solid var(--background-modifier-border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ fontWeight: "bold" }}>Markdown编辑器</div>
        
        {/* 搜索框 */}
        <div 
          ref={searchRef}
          style={{ 
            position: "relative", 
            flex: "1", 
            margin: "0 10px" 
          }}
        >
          
          {/* 搜索结果下拉菜单 */}
          {showDropdown && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              backgroundColor: "var(--background-primary)",
              border: "1px solid var(--background-modifier-border)",
              borderRadius: "4px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              zIndex: 10,
              maxHeight: "300px",
              overflowY: "auto"
            }}>
              {isSearching ? (
                <div style={{ padding: "10px", textAlign: "center" }}>搜索中...</div>
              ) : searchResults.length === 0 ? (
                <div style={{ padding: "10px", textAlign: "center" }}>未找到匹配的文件</div>
              ) : (
                searchResults.map((file, index) => (
                  <div
                    key={file.path}
                    onClick={() => selectFile(file)}
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      borderBottom: index < searchResults.length - 1 ? "1px solid var(--background-modifier-border)" : "none"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = "var(--background-modifier-hover)"}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = ""}
                  >
                    <div style={{ fontWeight: "bold" }}>{file.basename}</div>
                    <div style={{ fontSize: "smaller", color: "var(--text-muted)" }}>{file.path}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        
        <button 
          onClick={togglePreview}
          style={{
            padding: "4px 8px",
            backgroundColor: "var(--interactive-accent)",
            color: "var(--text-on-accent)",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          {preview ? "编辑模式" : "预览模式"}
        </button>
      </div>
      
      <div className="editor-content" style={{ padding: "15px" }}>
        {preview ? (
          <div 
            ref={previewRef}
            className="markdown-preview"
            style={{ minHeight: "200px" }}
          />
        ) : (
          <textarea
            value={text}
            onChange={handleTextChange}
            style={{
              width: "100%",
              minHeight: "200px",
              padding: "10px",
              border: "1px solid var(--background-modifier-border)",
              borderRadius: "4px",
              backgroundColor: "var(--background-primary-alt)",
              color: "var(--text-normal)",
              fontFamily: "monospace",
              resize: "vertical"
            }}
          />
        )}
      </div>
    </div>
  );
};
