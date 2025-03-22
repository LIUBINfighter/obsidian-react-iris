import React, { useState } from 'react';
import { App } from 'obsidian';
import ReactIris from '../main';
import { OllamaSettings } from './ollama/OllamaSettings';
import { LMStudioSettings } from './lmstudio/LMStudioSettings';
import { LMStudioRestSettings } from './lmstudio/LMStudioRestSettings';
import { Introduction } from './Introduction';
import { OnlineSettings } from './online/OnlineSettings';
import { MCPSettings } from './mcp/MCPSettings';
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
  const [activeTab, setActiveTab] = useState<'introduction'|'ollama' | 'lmstudio' | 'lmstudio-rest' | 'online' | 'mcp'>('introduction');

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

  const betaTabStyle = (isActive: boolean) => ({
    ...isActive ? activeTabStyle : tabStyle,
    backgroundColor: 'rgba(255, 223, 0, 0.1)',
    position: 'relative' as const
  });

  return (
    <div className="setting-component" style={{ 
      padding: '16px',
      backgroundColor: 'var(--background-primary)',
      borderRadius: '5px'
    }}>
      <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--background-modifier-border)' }}>
	  <button 
          style={activeTab === 'introduction' ? activeTabStyle : tabStyle}
          onClick={() => setActiveTab('introduction')}
        >
          介绍
        </button>
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
        <button 
          style={activeTab === 'online' ? activeTabStyle : tabStyle}
          onClick={() => setActiveTab('online')}
        >
          Online
        </button>
		<button 
          style={activeTab === 'lmstudio-rest' ? betaTabStyle(true) : betaTabStyle(false)}
          onClick={() => setActiveTab('lmstudio-rest')}
        >
          Rest API (Beta)
        </button>
        <button 
          style={activeTab === 'mcp' ? betaTabStyle(true) : betaTabStyle(false)}
          onClick={() => setActiveTab('mcp')}
        >
          MCP (Beta)
        </button>
      </div>
      
      {activeTab === 'ollama' ? <OllamaSettings /> : 
       activeTab === 'lmstudio' ? <LMStudioSettings /> : 
       activeTab === 'lmstudio-rest' ? <LMStudioRestSettings /> : 
       activeTab === 'online' ? <OnlineSettings /> :
       activeTab === 'mcp' ? <MCPSettings /> :
       <Introduction app={app} plugin={plugin} />}
    </div>
  );
};
