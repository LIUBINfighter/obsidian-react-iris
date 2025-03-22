import React, { useRef, useEffect, useState } from 'react';
import { App, TFile } from 'obsidian';
import { LMStudioService, LMStudioModel } from '../services/LMStudioService';
import { setIcon } from 'obsidian';
import { AIServiceType } from '../services/AIServiceFactory';
import { Header, createIconButtonStyle } from './common/Header';
import ReactIris from '../main';
import { OllamaService, OllamaModel } from '../services/OllamaService';

interface ChatHeaderProps {
  title: string;
  serviceType: AIServiceType;
  leftSidebarVisible: boolean;
  sidebarVisible: boolean;
  toggleLeftSidebar: () => void;
  toggleSidebar: () => void;
  toggleService: () => void;
  onServiceChange?: (type: AIServiceType) => void;
  onModelChange?: (modelName: string) => void;
  isLoading: boolean;
  isStreaming: boolean;
  app?: App;
  plugin?: ReactIris;
  serviceStatus?: 'ready' | 'testing' | 'offline';
  selectedModel?: string;
  availableOllamaModels?: OllamaModel[];
  onOllamaModelChange?: (modelName: string) => void;
  onOpenReadme?: () => void; // 添加新的prop
}

interface Model {
  id?: string;      // LMStudio 模型ID
  name?: string;    // Ollama 模型名称
  object?: string;
  created?: number;
  owned_by?: string;
  tag?: string;     // Ollama 模型标签
}

/**
 * 聊天头部组件 - 显示聊天标题和控制按钮
 */
export const ChatHeader: React.FC<ChatHeaderProps> = ({
  title = '',
  serviceType,
  leftSidebarVisible,
  sidebarVisible,
  toggleLeftSidebar,
  toggleSidebar,
  toggleService,
  onServiceChange,
  onModelChange,
  isLoading,
  isStreaming,
  app,
  plugin,
  serviceStatus = 'ready',
  selectedModel = '',
  availableOllamaModels,
  onOllamaModelChange,
  onOpenReadme,
}) => {
  const leftSidebarIconRef = useRef<HTMLDivElement>(null);
  const rightSidebarIconRef = useRef<HTMLDivElement>(null);
  const helpIconRef = useRef<HTMLDivElement>(null); // 添加帮助图标的ref
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [internalSelectedModel, setInternalSelectedModel] = useState<string>(selectedModel || '');
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [lmStudioConnected, setLmStudioConnected] = useState(false);
  const [ollamaConnected, setOllamaConnected] = useState(false);
  
  // 加载LM Studio模型列表
  useEffect(() => {
    if (serviceType === 'lmstudio') {
      loadLMStudioModels();
    }
    if (serviceType === 'ollama') {
      loadOllamaModels();
    }
  }, [serviceType]);
  
  const loadOllamaModels = async () => {
    setIsLoadingModels(true);
    try {
      const ollamaService = new OllamaService({
        baseUrl: 'http://127.0.0.1:11434',
        modelName: ''
      });

      // 测试连接
      const isConnected = await ollamaService.testConnection();
      setOllamaConnected(isConnected);

      if (isConnected) {
        // 获取模型列表
        const models = await ollamaService.listModels();
        // 转换为通用模型类型
        const convertedModels: Model[] = models.map(model => ({
          name: model.name,
          tag: model.tag
        }));
        setAvailableModels(convertedModels);

        // 如果有模型且没有选择过模型，自动选择第一个
        if (convertedModels.length > 0 && !internalSelectedModel) {
          setInternalSelectedModel(convertedModels[0].name);
          if (onModelChange) {
            onModelChange(convertedModels[0].name);
          }
        }
      }
    } catch (error) {
      console.error('加载Ollama模型失败:', error);
    } finally {
      setIsLoadingModels(false);
    }
  };

  // 加载LM Studio模型
  const loadLMStudioModels = async () => {
    setIsLoadingModels(true);
    try {
      const lmStudioService = new LMStudioService({
        baseUrl: 'http://127.0.0.1:1234',
        modelName: ''
      });
      
      // 测试连接
      const isConnected = await lmStudioService.testConnection();
      setLmStudioConnected(isConnected);
      
      if (isConnected) {
        // 获取模型列表
        const models = await lmStudioService.listModels();
        setAvailableModels(models);
        
        // 如果有模型且没有选择过模型，自动选择第一个
        if (models.length > 0 && !internalSelectedModel) {
          setInternalSelectedModel(models[0].id);
          if (onModelChange) {
            onModelChange(models[0].id);
          }
        }
      }
    } catch (error) {
      console.error('加载LM Studio模型失败:', error);
    } finally {
      setIsLoadingModels(false);
    }
  };
  
  // 处理服务类型变更
  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as AIServiceType;
    if (onServiceChange) {
      onServiceChange(newType);
    }
    
    // 如果切换到LM Studio，尝试加载模型
    if (newType === 'lmstudio') {
      loadLMStudioModels();
    }
  };
  
  // 处理模型变更
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    setInternalSelectedModel(newModel);
    if (onModelChange) {
      onModelChange(newModel);
    }
  };

  // 使用 useEffect 设置图标
  useEffect(() => {
    if (leftSidebarIconRef.current) {
      setIcon(leftSidebarIconRef.current, 'sidebar-left');
    }
    if (rightSidebarIconRef.current) {
      setIcon(rightSidebarIconRef.current, 'sidebar-right');
    }
    if (helpIconRef.current) {
      setIcon(helpIconRef.current, 'help-circle'); // 设置帮助图标
    }
  }, []);

  // 左侧操作按钮 - 修改按钮顺序
  const leftActions = (
    <>
      {!leftSidebarVisible && (
        <button
          onClick={toggleLeftSidebar}
          style={createIconButtonStyle(leftSidebarVisible)}
          title="切换左侧边栏"
        >
          <div 
            ref={leftSidebarIconRef} 
            style={{ width: '16px', height: '16px' }}
          />
        </button>
      )}
      <button
        onClick={onOpenReadme}
        style={createIconButtonStyle(false)}
        title="打开帮助文档"
      >
        <div 
          ref={helpIconRef}
          style={{ width: '16px', height: '16px' }}
        />
      </button>
    </>
  );

  // 右侧操作按钮 - 只保留侧边栏切换按钮
  const rightActions = !sidebarVisible ? (
    <button
      onClick={toggleSidebar}
      style={createIconButtonStyle(sidebarVisible)}
      title="切换右侧边栏"
    >
      <div 
        ref={rightSidebarIconRef} 
        style={{ width: '16px', height: '16px' }}
      />
    </button>
  ) : null;

  // 中间状态显示
  const centerContent = (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      fontSize: '12px', 
      color: isLoading || isStreaming ? 'var(--text-accent)' : 'var(--text-muted)',
      gap: '8px'
    }}>
      {isLoading || isStreaming ? (
        <>
          <span className="loading-spinner" style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            border: '2px solid var(--text-accent)',
            borderBottomColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></span>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <span>{isStreaming ? '接收中...' : '处理中...'}</span>
        </>
      ) : (
        <>
		<></>
          {/* 服务类型选择 */}
          <select 
            value={serviceType}
            onChange={handleServiceChange}
            style={{
              padding: '6px 6px',
              backgroundColor: 'var(--background-primary)',
              color: 'var(--text-normal)',
              border: '1px solid var(--background-modifier-border)',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            <option value="ollama">Ollama</option>
            <option value="lmstudio">LM Studio</option>
          </select>
          
          {/* LM Studio模型选择 */}
          {serviceType === 'lmstudio' && (
            <select
              value={internalSelectedModel}
              onChange={handleModelChange}
              disabled={!lmStudioConnected || isLoadingModels}
              style={{
                padding: '2px 4px',
                backgroundColor: 'var(--background-primary)',
                color: 'var(--text-normal)',
                border: '1px solid var(--background-modifier-border)',
                borderRadius: '4px',
                fontSize: '12px',
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {isLoadingModels ? (
                <option value="">加载中...</option>
              ) : !lmStudioConnected ? (
                <option value="">未连接</option>
              ) : availableModels.length === 0 ? (
                <option value="">无可用模型</option>
              ) : (
                availableModels.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.id}
                  </option>
                ))
              )}
            </select>
          )}
          {/* Ollama模型选择 */}
          {serviceType === 'ollama' && (
            <select
              value={internalSelectedModel}
              onChange={handleModelChange}
              disabled={!ollamaConnected || isLoadingModels}
              style={{
                padding: '2px 4px',
                backgroundColor: 'var(--background-primary)',
                color: 'var(--text-normal)',
                border: '1px solid var(--background-modifier-border)',
                borderRadius: '4px',
                fontSize: '12px',
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {isLoadingModels ? (
                <option value="">加载中...</option>
              ) : !ollamaConnected ? (
                <option value="">未连接</option>
              ) : availableModels.length === 0 ? (
                <option value="">无可用模型</option>
              ) : (
                availableModels.map(model => (
                  <option key={model.name || model.id} value={model.name || model.id}>
                    {model.name || model.id}
                  </option>
                ))
              )}
            </select>
          )}
          
          <span className="status-dot" style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            backgroundColor: serviceStatus === 'ready' ? 'var(--text-success)' : 
                           serviceStatus === 'testing' ? 'var(--text-warning)' : 
                           'var(--text-error)',
            borderRadius: '50%',
            transition: 'background-color 0.3s ease'
          }}></span>
        </>
      )}
    </div>
  );

  return (
    <Header
      title={title}
      leftActions={leftActions}
      rightActions={rightActions}
      centerContent={centerContent}
      className="chat-header"
    />
  );
};
