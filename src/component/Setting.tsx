import React, { useState } from 'react';
import { App } from 'obsidian';
import ReactIris from '../main';
import { OllamaSettings } from './ollama/OllamaSettings';
import { LMStudioSettings } from './lmstudio/LMStudioSettings';

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
  const [activeTab, setActiveTab] = useState<'ollama' | 'lmstudio'>('ollama');

  const tabStyle = {
    padding: '8px 16px',
    border: 'none',
    borderBottom: '2px solid transparent',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    marginRight: '8px',
    color: 'var(--text-normal)',
    fontSize: '14px'
  };

  const activeTabStyle = {
    ...tabStyle,
    borderBottomColor: 'var(--interactive-accent)',
    color: 'var(--interactive-accent)'
  };

  return (
    <div className="setting-component" style={{ 
      padding: '20px',
      backgroundColor: 'var(--background-primary)',
      borderRadius: '5px',
      border: '1px solid var(--background-modifier-border)'
    }}>
      <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--background-modifier-border)' }}>
        <button 
          style={activeTab === 'ollama' ? activeTabStyle : tabStyle}
          onClick={() => setActiveTab('ollama')}
        >
          Ollama
        </button>
        <button 
          style={activeTab === 'lmstudio' ? activeTabStyle : tabStyle}
          onClick={() => setActiveTab('lmstudio')}
        >
          LM Studio
        </button>
      </div>
      
      {activeTab === 'ollama' ? <OllamaSettings /> : <LMStudioSettings />}
    </div>
  );
};
