import React from 'react';
import { AIServiceType } from '../services/AIServiceFactory';

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
  return (
    <div className="chat-header" style={{
      padding: '12px 16px',
      borderBottom: '1px solid var(--background-modifier-border)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button 
          onClick={toggleLeftSidebar}
          aria-label={leftSidebarVisible ? '隐藏左侧边栏' : '显示左侧边栏'}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-normal)',
            padding: '4px 8px',
            borderRadius: '4px',
            marginRight: '8px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px'
          }}
          className={leftSidebarVisible ? 'sidebar-button active' : 'sidebar-button'}
        >
          {leftSidebarVisible ? '◀' : '▶'}
        </button>
        <h3 style={{ margin: 0 }}>{title}</h3>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ margin: '0 10px', fontSize: '12px', color: 'var(--text-muted)' }}>
          服务: {serviceType}
        </span>
        <button 
          onClick={toggleService}
          disabled={isLoading || isStreaming}
          style={{
            fontSize: '12px',
            padding: '2px 6px',
            marginLeft: '4px',
            backgroundColor: 'var(--background-modifier-border)',
            border: 'none',
            borderRadius: '4px',
            color: 'var(--text-normal)',
            cursor: 'pointer'
          }}
        >
          切换
        </button>
        <button 
          onClick={toggleSidebar}
          aria-label={sidebarVisible ? '隐藏右侧边栏' : '显示右侧边栏'}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-normal)',
            padding: '4px 8px',
            borderRadius: '4px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px'
          }}
          className={sidebarVisible ? 'sidebar-button active' : 'sidebar-button'}
        >
          {sidebarVisible ? '▶' : '◀'}
        </button>
      </div>
    </div>
  );
};
