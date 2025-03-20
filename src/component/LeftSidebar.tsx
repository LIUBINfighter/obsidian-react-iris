import React from 'react';
import { App } from 'obsidian';
import ReactIris from '../main';

interface LeftSidebarProps {
  app: App;
  visible: boolean;
  plugin?: ReactIris;
}

export const LeftSidebarComponent: React.FC<LeftSidebarProps> = ({ app, visible, plugin }) => {
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
        <h4 style={{ margin: 0 }}>左侧边栏</h4>
      </div>
      
      <div className="left-sidebar-content" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px'
      }}>
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          左侧边栏内容区域
        </div>
      </div>
    </div>
  );
};
