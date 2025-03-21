import React, { useState, useEffect } from 'react';
import { OllamaService, OllamaModel, PullProgressResponse } from '../../services/OllamaService';

export function OllamaSettings() {
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [modelInput, setModelInput] = useState('');
  const [downloadProgress, setDownloadProgress] = useState<{ model: string, progress: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ollamaService = new OllamaService({ baseUrl: 'http://localhost:11434', modelName: '' });

  // 测试ollama连接
  const testConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      const isConnected = await ollamaService.testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      if (!isConnected) {
        setError('无法连接到Ollama服务，请确保Ollama已启动并运行在http://localhost:11434');
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
    setLoading(true);
    setError(null);
    try {
      const modelList = await ollamaService.listModels();
      setModels(modelList);
      setConnectionStatus('connected');
    } catch (err) {
      setError('获取模型列表失败: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  // 下载/更新模型
  const pullModel = async (modelName: string) => {
    setError(null);
    setDownloadProgress({ model: modelName, progress: 0 });
    
    try {
      await ollamaService.pullModel(modelName, (progressData: PullProgressResponse) => {
        const progressPercentage = progressData.total > 0 
          ? Math.floor((progressData.completed / progressData.total) * 100)
          : 0;
        
        setDownloadProgress({ 
          model: modelName, 
          progress: progressPercentage 
        });
      });
      
      // 下载完成后刷新模型列表
      await fetchModels();
    } catch (err) {
      setError(`下载模型 ${modelName} 失败: ` + (err instanceof Error ? err.message : String(err)));
    } finally {
      setDownloadProgress(null);
    }
  };

  // 组件加载时测试连接
  useEffect(() => {
    testConnection().then(() => {
      if (connectionStatus === 'connected') {
        fetchModels();
      }
    });
  }, []);

  // 格式化文件大小
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化日期
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  // 创建命令行风格的进度条
  const renderCommandLineProgressBar = (progress: number, width: number = 30) => {
    const filledCount = Math.floor((progress / 100) * width);
    const emptyCount = width - filledCount;
    
    // 创建填充和空白部分
    const filled = '='.repeat(filledCount > 0 ? filledCount - 1 : 0) + (filledCount > 0 ? '>' : '');
    const empty = ' '.repeat(emptyCount);
    
    // 返回命令行风格的进度条
    return `[${filled}${empty}]`;
  };

  // 内联样式定义
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
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '12px'
    },
    tableHeader: {
      padding: '8px 12px',
      border: '1px solid var(--background-modifier-border)',
      textAlign: 'left',
      backgroundColor: 'var(--background-secondary)',
      fontWeight: 500
    },
    tableCell: {
      padding: '8px 12px',
      border: '1px solid var(--background-modifier-border)',
      textAlign: 'left' as const
    },
    noModels: {
      padding: '16px',
      backgroundColor: 'var(--background-secondary)',
      borderRadius: '4px',
      textAlign: 'center' as const,
      color: 'var(--text-muted)'
    },
    loading: {
      padding: '16px',
      textAlign: 'center' as const,
      color: 'var(--text-muted)'
    },
    downloadSection: {
      marginTop: '24px'
    },
    downloadForm: {
      display: 'flex',
      marginBottom: '12px'
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
    downloadProgress: {
      marginTop: '16px',
      padding: '12px',
      backgroundColor: 'var(--background-secondary)',
      borderRadius: '4px',
      fontFamily: 'monospace'
    },
    commandLineProgressBar: {
      margin: '8px 0',
      fontSize: '14px',
      lineHeight: '1.2',
      whiteSpace: 'pre' as const
    },
    progressInfo: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '12px',
      color: 'var(--text-muted)',
      marginTop: '4px'
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Ollama 配置</h2>
      
      <div style={styles.connectionStatus}>
        <div style={{
          ...styles.statusIndicator,
          ...(connectionStatus === 'connected' ? styles.connected : 
             connectionStatus === 'disconnected' ? styles.disconnected : 
             styles.unknown)
        }}>
          {connectionStatus === 'connected' ? '已连接' :
           connectionStatus === 'disconnected' ? '未连接' : '未知'}
        </div>
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
      </div>

      {error && (
        <div style={styles.errorMessage}>
          {error}
        </div>
      )}

      <div style={styles.commandSection}>
        <h3 style={styles.heading}>命令执行</h3>
        
        <div style={styles.commandRow}>
          <button 
            onClick={fetchModels} 
            disabled={loading || connectionStatus !== 'connected'}
            style={{
              ...styles.button,
              ...(loading || connectionStatus !== 'connected' ? styles.buttonDisabled : {})
            }}
          >
            获取模型列表
          </button>
          <span style={styles.commandText}>ollama list</span>
          <span style={styles.commandDesc}>列出所有已安装的模型</span>
        </div>
      </div>

      <div style={styles.commandSection}>
        <h3 style={styles.heading}>已安装模型</h3>
        {loading ? (
          <div style={styles.loading}>加载中...</div>
        ) : models.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>模型名称</th>
                <th style={styles.tableHeader}>标签</th>
                <th style={styles.tableHeader}>大小</th>
                <th style={styles.tableHeader}>修改时间</th>
                <th style={styles.tableHeader}>操作</th>
              </tr>
            </thead>
            <tbody>
              {models.map(model => (
                <tr key={model.digest}>
                  <td style={styles.tableCell}>{model.name}</td>
                  <td style={styles.tableCell}>{model.tag}</td>
                  <td style={styles.tableCell}>{formatSize(model.size)}</td>
                  <td style={styles.tableCell}>{formatDate(model.modified_at)}</td>
                  <td style={styles.tableCell}>
                    <button 
                      onClick={() => pullModel(`${model.name}:${model.tag}`)}
                      disabled={!!downloadProgress}
                      style={{
                        ...styles.button,
                        ...(!!downloadProgress ? styles.buttonDisabled : {})
                      }}
                    >
                      更新
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={styles.noModels}>
            {connectionStatus === 'connected' ? '未找到已安装的模型' : '请先连接到Ollama服务'}
          </div>
        )}
      </div>

      <div style={styles.downloadSection}>
        <h3 style={styles.heading}>下载新模型</h3>
        <div style={styles.downloadForm}>
          <input 
            type="text" 
            placeholder="输入模型名称，例如: llama2:latest" 
            value={modelInput}
            onChange={(e) => setModelInput(e.target.value)}
            style={styles.input}
          />
          <button 
            onClick={() => {
              if (modelInput.trim()) {
                pullModel(modelInput.trim());
              }
            }}
            disabled={!modelInput.trim() || !!downloadProgress}
            style={{
              ...styles.button,
              ...(!modelInput.trim() || !!downloadProgress ? styles.buttonDisabled : {})
            }}
          >
            下载模型
          </button>
        </div>
        <div style={styles.commandText}>
          命令: ollama pull {modelInput || 'model-name:tag'}
        </div>

        {downloadProgress && (
          <div style={styles.downloadProgress}>
            <div>正在下载 {downloadProgress.model}</div>
            
            {/* 命令行风格的进度条 */}
            <div style={styles.commandLineProgressBar}>
              {renderCommandLineProgressBar(downloadProgress.progress)}
            </div>
            
            <div style={styles.progressInfo}>
              <span>进度: {downloadProgress.progress}%</span>
              <span>{downloadProgress.progress < 100 ? '下载中...' : '下载完成'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
