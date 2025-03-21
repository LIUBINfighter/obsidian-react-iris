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
}

export const LeftSidebarComponent: React.FC<LeftSidebarProps> = ({ 
  app, 
  visible, 
  plugin,
  currentSessionId,
  onSelectSession,
  onCreateNewSession
}) => {
  const addIconRef = useRef<HTMLDivElement>(null);
  
  // 使用 useEffect 设置图标
  useEffect(() => {
    if (addIconRef.current) {
      setIcon(addIconRef.current, 'plus');
    }
  }, []);

  // 添加新会话按钮
  const rightActions = (
    <button
      onClick={onCreateNewSession}
      style={createIconButtonStyle()}
      title="创建新会话"
    >
      <div 
        ref={addIconRef}
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
        title="聊天会话"
        rightActions={rightActions}
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
