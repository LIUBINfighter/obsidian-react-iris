import React, { useRef, useEffect, useState } from 'react';
import { App, setIcon } from 'obsidian';
import ReactIris from '../main';
import { ChatSessionList } from './sidebar/ChatSessionList';
import { Header, createIconButtonStyle } from './common/Header';
import { EmptyTab } from './sidebar/EmptyTab';  // 添加这行导入语句

interface LeftSidebarProps {
  app: App;
  visible: boolean;
  plugin?: ReactIris;
  currentSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onCreateNewSession: () => void;
  toggleLeftSidebar: () => void;
  leftSidebarVisible: boolean;
}

export const LeftSidebarComponent: React.FC<LeftSidebarProps> = ({ 
  app, 
  visible, 
  plugin,
  currentSessionId,
  onSelectSession,
  onCreateNewSession,
  toggleLeftSidebar,
  leftSidebarVisible
}) => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'empty'>('sessions');
  const addIconRef = useRef<HTMLDivElement>(null);
  const closeIconRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (addIconRef.current) {
      setIcon(addIconRef.current, 'plus');
    }
    if (closeIconRef.current) {
      setIcon(closeIconRef.current, 'sidebar-left');
    }
  }, []);

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

  const renderTabHeader = () => (
    <div style={{
      display: 'flex',
      borderBottom: '1px solid var(--background-modifier-border)',
    //   marginBottom: '8px',
      backgroundColor: 'var(--background-secondary-alt)', // 添加这行
      padding: '0 8px' // 添加这行
    }}>
      <button
        onClick={() => setActiveTab('sessions')}
        style={{
          padding: '8px 16px',
          background: 'none',
          border: 'none',
          borderBottom: `2px solid ${activeTab === 'sessions' ? 'var(--interactive-accent)' : 'transparent'}`,
          color: activeTab === 'sessions' ? 'var(--text-normal)' : 'var(--text-muted)',
          cursor: 'pointer'
        }}
      >
        会话
      </button>
      <button
        onClick={() => setActiveTab('empty')}
        style={{
          padding: '8px 16px',
          background: 'none',
          border: 'none',
          borderBottom: `2px solid ${activeTab === 'empty' ? 'var(--interactive-accent)' : 'transparent'}`,
          color: activeTab === 'empty' ? 'var(--text-normal)' : 'var(--text-muted)',
          cursor: 'pointer'
        }}
      >
        空白页
      </button>
    </div>
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
        leftActions={leftActions}
        className="left-sidebar-header"
      />
      
      {renderTabHeader()}
      
      <div className="left-sidebar-content" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px'
      }}>
        {activeTab === 'sessions' ? (
          <ChatSessionList 
            app={app}
            currentSessionId={currentSessionId}
            onSelectSession={onSelectSession}
            onCreateNewSession={onCreateNewSession}
          />
        ) : (
          <EmptyTab app={app} />
        )}
      </div>
    </div>
  );
};
