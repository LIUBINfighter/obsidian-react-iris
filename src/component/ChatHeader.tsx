import React, { useRef, useEffect } from 'react';
import { setIcon } from 'obsidian';
import { AIServiceType } from '../services/AIServiceFactory';
import { Header, createIconButtonStyle } from './common/Header';

interface ChatHeaderProps {
  title: string;
  serviceType: AIServiceType;
  leftSidebarVisible: boolean;
  sidebarVisible: boolean;
  toggleLeftSidebar: () => void;
  toggleSidebar: () => void;
  toggleService: () => void;
  isLoading: boolean;
  isStreaming: boolean;
}

/**
 * 聊天头部组件 - 显示聊天标题和控制按钮
 */
export const ChatHeader: React.FC<ChatHeaderProps> = ({
  title,
  serviceType,
  leftSidebarVisible,
  sidebarVisible,
  toggleLeftSidebar,
  toggleSidebar,
  toggleService,
  isLoading,
  isStreaming
}) => {
  const leftSidebarIconRef = useRef<HTMLDivElement>(null);
  const rightSidebarIconRef = useRef<HTMLDivElement>(null);

  // 使用 useEffect 设置图标
  useEffect(() => {
    if (leftSidebarIconRef.current) {
      setIcon(leftSidebarIconRef.current, 'sidebar-left');
    }
    if (rightSidebarIconRef.current) {
      setIcon(rightSidebarIconRef.current, 'sidebar-right');
    }
  }, []);

  // 左侧操作按钮
  const leftActions = (
    <button
      onClick={toggleLeftSidebar}
      style={createIconButtonStyle(leftSidebarVisible)}
      title="切换左侧边栏"
    >
      <div 
        ref={leftSidebarIconRef} 
        style={{ width: '16px', height: '16px' }}
      />
    </button>
  );

  // 中间状态显示
  const centerContent = (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      fontSize: '12px', 
      color: isLoading || isStreaming ? 'var(--text-accent)' : 'var(--text-muted)',
      gap: '5px'
    }}>
      {isLoading || isStreaming ? (
        <>
          <span className="loading-spinner" style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            border: '2px solid var(--text-accent)',
            borderBottomColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></span>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <span>{isStreaming ? '接收中...' : '处理中...'}</span>
        </>
      ) : (
        <>
          <span className="status-dot" style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            backgroundColor: serviceType === 'langchain' ? 'var(--text-success)' : 'var(--text-warning)',
            borderRadius: '50%',
            marginRight: '4px'
          }}></span>
          <span 
            onClick={toggleService} 
            style={{ cursor: 'pointer' }}
            title="点击切换服务"
          >
            {serviceType === 'langchain' ? 'langchain' : 'Ollama'}
          </span>
        </>
      )}
    </div>
  );

  // 右侧操作按钮
  const rightActions = (
    <button
      onClick={toggleSidebar}
      style={createIconButtonStyle(sidebarVisible)}
      title="切换右侧边栏"
    >
      <div 
        ref={rightSidebarIconRef} 
        style={{ width: '16px', height: '16px' }}
      />
    </button>
  );

  return (
    <Header
      title={title}
      leftActions={leftActions}
      rightActions={rightActions}
      centerContent={centerContent}
      className="chat-header"
    />
  );
};
