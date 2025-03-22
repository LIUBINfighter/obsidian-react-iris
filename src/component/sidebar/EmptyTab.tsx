import React from 'react';
import { App } from 'obsidian';

interface EmptyTabProps {
  app: App;
}

export const EmptyTab: React.FC<EmptyTabProps> = ({ app }) => {
  return (
    <div style={{
      padding: '20px',
      textAlign: 'center',
      color: 'var(--text-muted)'
    }}>
      这是一个空白标签页，等待开发新功能...
    </div>
  );
};
