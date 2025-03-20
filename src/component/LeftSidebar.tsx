import React from 'react';
import { App } from 'obsidian';
import ReactIris from '../main';
import { ChatSessionList } from './ChatSessionList';

interface LeftSidebarProps {
  app: App;
  visible: boolean;
  plugin?: ReactIris;
  currentSessionId: string; // 添加当前会话ID
  onSelectSession: (sessionId: string) => void; // 添加会话选择回调
  onCreateNewSession: () => void; // 添加创建新会话回调
}

export const LeftSidebarComponent: React.FC<LeftSidebarProps> = ({ 
  app, 
  visible, 
  plugin,
  currentSessionId,
  onSelectSession,
  onCreateNewSession
}) => {
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
      <div className="left-sidebar-header" style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--background-modifier-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h4 style={{ margin: 0 }}>聊天会话</h4>
      </div>
      
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
