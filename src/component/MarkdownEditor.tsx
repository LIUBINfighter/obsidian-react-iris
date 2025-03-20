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
      
      // 使用Obsidian的MarkdownRenderer进行渲染
      await MarkdownRenderer.renderMarkdown(
        text,
        previewRef.current,
        '',
        app.workspace.getActiveViewOfType(null) || null
      );
    }
  };
  
  // 搜索功能实现 - 使用Obsidian Vault API
  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    
    setIsSearching(true);
    setShowDropdown(true);
    
    try {
      // 获取所有Markdown文件
      const markdownFiles = app.vault.getMarkdownFiles();
      
      // 过滤符合搜索条件的文件
      const filtered = markdownFiles.filter(file => 
        file.basename.toLowerCase().includes(query.toLowerCase()) ||
        file.path.toLowerCase().includes(query.toLowerCase())
      );
      
      // 限制结果数量，避免过多
      setSearchResults(filtered.slice(0, 20));
    } catch (error) {
      console.error('搜索文件时出错:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  // 选择文件 - 使用Obsidian Vault API读取文件内容
  const selectFile = async (file: TFile) => {
    try {
      const content = await app.vault.read(file);
      setText(content);
      setShowDropdown(false);
      setSearchQuery('');
    } catch (error) {
      console.error('读取文件内容时出错:', error);
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
          <input
            type="text"
            placeholder="搜索仓库内的Markdown文件..."
            value={searchQuery}
            onChange={handleSearch}
            style={{
              width: "100%",
              padding: "4px 8px",
              border: "1px solid var(--background-modifier-border)",
              borderRadius: "4px",
              backgroundColor: "var(--background-primary-alt)"
            }}
          />
          
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
