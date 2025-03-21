import React, { useState, useEffect } from 'react';
import { LMStudioService, LMStudioModel } from '../../services/LMStudioService';

// 导入Electron相关API用于执行命令
declare const window: Window & {
  require: (module: string) => any;
};

export function LMStudioSettings() {
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [models, setModels] = useState<LMStudioModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [chatInput, setChatInput] = useState<string>('');
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [systemPrompt, setSystemPrompt] = useState<string>('Always answer in rhymes.');
  const [temperature, setTemperature] = useState<number>(0.7);

  const lmStudioService = new LMStudioService({ baseUrl: 'http://127.0.0.1:1234', modelName: selectedModel });

  // 测试LM Studio连接
  const testConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      const isConnected = await lmStudioService.testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      if (!isConnected) {
        setError('无法连接到LM Studio服务，请确保LM Studio已启动并运行在http://127.0.0.1:1234');
      } else {
        // 如果连接成功，获取模型列表
        await fetchModels();
      }
    } catch (err) {
      setConnectionStatus('disconnected');
      setError('连接测试出错: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  // 获取可用模型列表
  const fetchModels = async () => {
    if (connectionStatus !== 'connected') {
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const modelList = await lmStudioService.listModels();
      setModels(modelList);
      
      // 如果有模型且没有选择过模型，自动选择第一个
      if (modelList.length > 0 && !selectedModel) {
        setSelectedModel(modelList[0].id);
      }
    } catch (err) {
      setError('获取模型列表失败: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  // 发送聊天请求
  const sendChatRequest = async () => {
    if (!selectedModel || !chatInput.trim()) {
      return;
    }
    
    setIsStreaming(true);
    setError(null);
    setChatResponse('');
    
    try {
      // 使用流式请求
      await lmStudioService.sendStreamingRequest(
        {
          messages: [{ id: '1', content: chatInput, timestamp: Date.now(), sender: 'user', favorite: false }],
          systemPrompt: systemPrompt,
          temperature: temperature,
          maxTokens: -1 // 不限制生成长度
        },
        (response) => {
          setChatResponse(response.content);
          if (response.isComplete) {
            setIsStreaming(false);
          }
        }
      );
    } catch (err) {
      setError('聊天请求失败: ' + (err instanceof Error ? err.message : String(err)));
      setIsStreaming(false);
    }
  };

  // 组件加载时测试连接
  useEffect(() => {
    testConnection();
  }, []);

  // 内联样式定义，与OllamaSettings保持一致
  const styles = {
    container: {
      padding: '16px',
      fontFamily: 'var(--font-interface)',
      color: 'var(--text-normal)'
    },
    heading: {
      marginTop: '16px',
      marginBottom: '12px',
      color: 'var(--text-normal)'
    },
    connectionStatus: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '20px'
    },
    statusIndicator: {
      padding: '4px 12px',
      borderRadius: '4px',
      marginRight: '16px',
      fontWeight: 500
    },
    connected: {
      backgroundColor: 'rgba(0, 200, 83, 0.2)',
      color: 'rgb(0, 150, 60)'
    },
    disconnected: {
      backgroundColor: 'rgba(255, 0, 0, 0.2)',
      color: 'rgb(200, 0, 0)'
    },
    unknown: {
      backgroundColor: 'rgba(150, 150, 150, 0.2)',
      color: 'rgb(100, 100, 100)'
    },
    button: {
      backgroundColor: 'var(--interactive-accent)',
      color: 'var(--text-on-accent)',
      border: 'none',
      borderRadius: '4px',
      padding: '6px 12px',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'background-color 0.2s'
    },
    buttonDisabled: {
      backgroundColor: 'var(--interactive-accent-muted)',
      cursor: 'not-allowed'
    },
    commandSection: {
      marginBottom: '24px'
    },
    commandRow: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '12px'
    },
    commandText: {
      marginLeft: '16px',
      fontFamily: 'monospace',
      backgroundColor: 'var(--background-modifier-form-field)',
      padding: '4px 8px',
      borderRadius: '4px'
    },
    commandDesc: {
      marginLeft: '16px',
      color: 'var(--text-muted)'
    },
    errorMessage: {
      color: 'var(--text-error)',
      backgroundColor: 'rgba(255, 0, 0, 0.1)',
      padding: '8px 16px',
      borderRadius: '4px',
      marginBottom: '20px'
    },
    select: {
      padding: '6px 12px',
      border: '1px solid var(--background-modifier-border)',
      borderRadius: '4px',
      backgroundColor: 'var(--background-modifier-form-field)',
      color: 'var(--text-normal)',
      marginRight: '8px',
      minWidth: '200px'
    },
    input: {
      flex: 1,
      marginRight: '8px',
      padding: '6px 12px',
      border: '1px solid var(--background-modifier-border)',
      borderRadius: '4px',
      backgroundColor: 'var(--background-modifier-form-field)',
      color: 'var(--text-normal)'
    },
    textarea: {
      width: '100%',
      minHeight: '100px',
      marginBottom: '12px',
      padding: '8px',
      border: '1px solid var(--background-modifier-border)',
      borderRadius: '4px',
      backgroundColor: 'var(--background-modifier-form-field)',
      color: 'var(--text-normal)',
      fontFamily: 'inherit',
      resize: 'vertical' as const
    },
    chatForm: {
      marginTop: '12px'
    },
    chatResponse: {
      marginTop: '16px',
      padding: '12px',
      backgroundColor: 'var(--background-secondary)',
      borderRadius: '4px',
      whiteSpace: 'pre-wrap' as const
    },
    formField: {
      marginBottom: '12px'
    },
    formLabel: {
      display: 'block',
      marginBottom: '4px',
      fontWeight: 500
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>LM Studio 配置</h2>
      
      <div style={styles.connectionStatus}>
        <div style={styles.commandRow}>
          <button 
            onClick={testConnection} 
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {})
            }}
          >
            测试连接
          </button>
          <span style={styles.commandText}>curl http://127.0.0.1:1234/v1/models</span>
          <span style={styles.commandDesc}>检测LM Studio服务是否运行</span>
          <div style={{
            ...styles.statusIndicator,
            ...(connectionStatus === 'connected' ? styles.connected : 
               connectionStatus === 'disconnected' ? styles.disconnected : 
               styles.unknown)
          }}>
            {connectionStatus === 'connected' ? '已连接' :
             connectionStatus === 'disconnected' ? '未连接' : '未知'}
          </div>
        </div>
      </div>

      {error && (
        <div style={styles.errorMessage}>
          {error}
        </div>
      )}

      {/* 可用模型部分 */}
      {connectionStatus === 'connected' && (
        <div style={styles.commandSection}>
          <h3 style={styles.heading}>可用模型</h3>
          <div style={styles.commandRow}>
            <select 
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              style={styles.select}
              disabled={loading || models.length === 0}
            >
              {models.length === 0 ? (
                <option value="">未加载模型</option>
              ) : (
                <>
                  <option value="">选择模型...</option>
                  {models.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.id}
                    </option>
                  ))}
                </>
              )}
            </select>
            <button 
              onClick={fetchModels} 
              disabled={loading || connectionStatus !== 'connected'}
              style={{
                ...styles.button,
                ...(loading || connectionStatus !== 'connected' ? styles.buttonDisabled : {})
              }}
            >
              刷新模型列表
            </button>
          </div>
        </div>
      )}
      
      {/* 聊天测试部分 */}
      {connectionStatus === 'connected' && selectedModel && (
        <div style={styles.commandSection}>
          <h3 style={styles.heading}>聊天测试</h3>
          
          <div style={styles.formField}>
            <label style={styles.formLabel}>系统提示:</label>
            <input
              type="text"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              style={styles.input}
              placeholder="系统提示..."
            />
          </div>
          
          <div style={styles.formField}>
            <label style={styles.formLabel}>温度 ({temperature}):</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          
          <div style={styles.chatForm}>
            <label style={styles.formLabel}>用户消息:</label>
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              style={styles.textarea}
              placeholder="输入你的消息..."
              disabled={isStreaming}
            />
            
            <button 
              onClick={sendChatRequest}
              disabled={!chatInput.trim() || isStreaming}
              style={{
                ...styles.button,
                ...(!chatInput.trim() || isStreaming ? styles.buttonDisabled : {})
              }}
            >
              {isStreaming ? '生成中...' : '发送请求'}
            </button>
          </div>
          
          <div style={styles.commandText}>
            命令: curl http://127.0.0.1:1234/v1/chat/completion -H "Content-Type: application/json" -d '{JSON.stringify({
              model: selectedModel,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: chatInput || "Introduce yourself." }
              ],
              temperature: temperature,
              max_tokens: -1,
              stream: true
            }, null, 2).replace(/"/g, '\\"')}'
          </div>
          
          {chatResponse !== null && (
            <div style={styles.chatResponse}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>AI 响应:</div>
              {chatResponse || '(等待响应...)'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
