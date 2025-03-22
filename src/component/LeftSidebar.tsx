import React, { useRef, useEffect } from 'react';
import { App, setIcon } from 'obsidian';
import ReactIris from '../main';
import { ChatSessionList } from './sidebar/ChatSessionList';
import { Header, createIconButtonStyle } from './common/Header';

interface LeftSidebarProps {
  app: App;
  visible: boolean;
  plugin?: ReactIris;
  currentSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onCreateNewSession: () => void;
  toggleLeftSidebar: () => void;  // 添加这行
  leftSidebarVisible: boolean;    // 添加这行
}

export const LeftSidebarComponent: React.FC<LeftSidebarProps> = ({ 
  app, 
  visible, 
  plugin,
  currentSessionId,
  onSelectSession,
  onCreateNewSession,
  toggleLeftSidebar,      // 添加这行
  leftSidebarVisible      // 添加这行
}) => {
  const addIconRef = useRef<HTMLDivElement>(null);
  const closeIconRef = useRef<HTMLDivElement>(null);
  
  // 使用 useEffect 设置图标
  useEffect(() => {
    if (addIconRef.current) {
      setIcon(addIconRef.current, 'plus');
    }
    if (closeIconRef.current) {
      setIcon(closeIconRef.current, 'sidebar-left');
    }
  }, []);

  // 把右侧按钮改为左侧按钮
  const leftActions = (
    <button
      onClick={toggleLeftSidebar}
      style={createIconButtonStyle(leftSidebarVisible)}
      title="切换左侧边栏"
    >
      <div 
        ref={closeIconRef}
        style={{ width: '16px', height: '16px' }}
      />
    </button>
  );

  if (!visible) return null;
  
  return (
    <div className="left-sidebar-container" style={{
      width: '250px',
      height: '100%',
      borderRight: '1px solid var(--background-modifier-border)',
      backgroundColor: 'var(--background-primary)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s ease'
    }}>
      <Header
        // title="聊天会话"
        leftActions={leftActions}  // 改为 leftActions
        className="left-sidebar-header"
      />
      
      <div className="left-sidebar-content" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px'
      }}>
        {/* 会话列表组件 */}
        <ChatSessionList 
          app={app}
          currentSessionId={currentSessionId}
          onSelectSession={onSelectSession}
          onCreateNewSession={onCreateNewSession}
        />
      </div>
    </div>
  );
};
