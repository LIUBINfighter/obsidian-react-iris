import React from 'react';
import { App } from 'obsidian';
import ReactIris from '../main';
import { OllamaSettings } from './ollama/OllamaSettings';

interface SettingComponentProps {
  app: App;
  plugin?: ReactIris; // 插件实例
  autoSave?: boolean; // 是否自动保存
}

export const SettingComponent: React.FC<SettingComponentProps> = ({ 
  app, 
  plugin,
  autoSave = false // 默认不自动保存
}) => {
  return (
    <div className="setting-component" style={{ 
      padding: '20px',
      backgroundColor: 'var(--background-primary)',
      borderRadius: '5px',
      border: '1px solid var(--background-modifier-border)'
    }}>
      <OllamaSettings />
    </div>
  );
};
