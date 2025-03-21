import React, { useState, useEffect } from 'react';
import { OllamaService, OllamaModel, PullProgressResponse } from '../../services/OllamaService';

// 导入Electron相关API
declare const window: Window & {
  require: (module: string) => any;
};

export function OllamaSettings() {
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [modelInput, setModelInput] = useState('');
  const [downloadProgress, setDownloadProgress] = useState<{ model: string, progress: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<{name: string, tag: string} | null>(null);
  const [isServerStarting, setIsServerStarting] = useState(false);
  const [serverOutput, setServerOutput] = useState<string | null>(null);

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

  // 删除模型
  const deleteModel = async () => {
    if (!modelToDelete) return;
    
    setLoading(true);
    setError(null);
    try {
      // 使用formatModelName函数处理可能的undefined标签
      const modelFullName = formatModelName(modelToDelete.name, modelToDelete.tag);
      await ollamaService.deleteModel(modelFullName);
      setShowDeleteModal(false);
      setModelToDelete(null);
      
      // 删除成功后刷新模型列表
      await fetchModels();
    } catch (err) {
      setError(`删除模型失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // 启动Ollama服务
  const runOllamaServe = async () => {
    setIsServerStarting(true);
    setServerOutput(null);
    setError(null);
    
    try {
      // 使用Electron的remote模块执行shell命令
      const { exec } = window.require('child_process');
      
      exec('ollama serve', (error: any, stdout: string, stderr: string) => {
        if (error) {
          setError(`启动Ollama服务失败: ${error.message}`);
          setIsServerStarting(false);
          return;
        }
        
        // 检查stderr是否有内容
        if (stderr) {
          setServerOutput(stderr);
        } else {
          setServerOutput(stdout);
        }
        
        // 启动服务后延迟测试连接
        setTimeout(() => {
          testConnection().then(() => {
            if (connectionStatus === 'connected') {
              fetchModels();
            }
          });
          setIsServerStarting(false);
        }, 2000);
      });
    } catch (err) {
      setError('无法执行系统命令，请手动启动Ollama服务: ' + (err instanceof Error ? err.message : String(err)));
      setIsServerStarting(false);
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

  // 创建盲文点阵风格的进度条
  const renderBrailleProgressBar = (progress: number, width: number = 20) => {
    // 盲文点阵字符，从空到满
    const brailleChars = ['⣀', '⣤', '⣶', '⣿'];
    
    // 计算填充部分
    const filledCharsCount = Math.floor((progress / 100) * width);
    const partialCharIndex = Math.floor((((progress / 100) * width) % 1) * brailleChars.length);
    
    let progressBar = '';
    
    // 添加完全填充的字符
    for (let i = 0; i < filledCharsCount; i++) {
      progressBar += '⣿'; // 完全填充的盲文字符
    }
    
    // 添加部分填充的字符（如果有）
    if (filledCharsCount < width && progress > 0) {
      progressBar += brailleChars[partialCharIndex];
    }
    
    // 添加空白字符直到达到所需宽度
    while (progressBar.length < width) {
      progressBar += '⠀'; // 空盲文字符
    }
    
    return progressBar;
  };

  // 格式化模型名称，避免显示":undefined"
  const formatModelName = (name: string, tag?: string): string => {
    if (!tag || tag === 'undefined') {
      return name;
    }
    return `${name}:${tag}`;
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
      fontSize: '18px',  // 增加字体大小以更好地显示盲文点阵
      lineHeight: '1.2',
      whiteSpace: 'pre' as const,
      letterSpacing: '1px' // 添加字符间距提高可读性
    },
    progressInfo: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '12px',
      color: 'var(--text-muted)',
      marginTop: '4px'
    },
    modalOverlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    },
    modalContent: {
      backgroundColor: 'var(--background-primary)',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      maxWidth: '400px',
      width: '100%'
    },
    modalButtons: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
      marginTop: '20px'
    },
    cancelButton: {
      backgroundColor: 'var(--background-modifier-border)',
      color: 'var(--text-normal)',
      border: 'none',
      borderRadius: '4px',
      padding: '6px 12px',
      cursor: 'pointer'
    },
    deleteButton: {
      backgroundColor: 'var(--text-error)',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      padding: '6px 12px',
      cursor: 'pointer'
    },
    actionButtons: {
      display: 'flex',
      gap: '8px'
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Ollama 配置</h2>
      
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
          <span style={styles.commandText}>curl http://localhost:11434/api/version</span>
          <span style={styles.commandDesc}>检测Ollama服务是否运行</span>
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
        
        {/* 添加启动Ollama服务按钮 */}
        <div style={styles.commandRow}>
          <button 
            onClick={runOllamaServe} 
            disabled={loading || isServerStarting || connectionStatus === 'connected'}
            style={{
              ...styles.button,
              ...(loading || isServerStarting || connectionStatus === 'connected' ? styles.buttonDisabled : {})
            }}
          >
            {isServerStarting ? '启动中...' : '启动Ollama服务'}
          </button>
          <span style={styles.commandText}>ollama serve</span>
          <span style={styles.commandDesc}>在后台启动Ollama服务器</span>
        </div>
        
        {/* 显示服务器输出信息 */}
        {serverOutput && (
          <div style={{
            padding: '8px',
            marginTop: '8px',
            backgroundColor: 'var(--background-secondary)',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '12px',
            maxHeight: '100px',
            overflow: 'auto'
          }}>
            <div style={{ color: 'var(--text-muted)' }}>服务器输出:</div>
            <pre style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }}>{serverOutput}</pre>
          </div>
        )}
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
                <th style={styles.tableHeader}>大小</th>
                <th style={styles.tableHeader}>修改时间</th>
                <th style={styles.tableHeader}>操作</th>
              </tr>
            </thead>
            <tbody>
              {models.map(model => (
                <tr key={model.digest}>
                  <td style={styles.tableCell}>{formatModelName(model.name, model.tag)}</td>
                  <td style={styles.tableCell}>{formatSize(model.size)}</td>
                  <td style={styles.tableCell}>{formatDate(model.modified_at)}</td>
                  <td style={styles.tableCell}>
                    <div style={styles.actionButtons}>
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
                      <button 
                        onClick={() => {
                          setModelToDelete({name: model.name, tag: model.tag});
                          setShowDeleteModal(true);
                        }}
                        disabled={!!downloadProgress}
                        style={{
                          ...styles.button,
                          backgroundColor: 'var(--text-error)',
                          ...(!!downloadProgress ? styles.buttonDisabled : {})
                        }}
                      >
                        删除
                      </button>
                    </div>
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
            
            {/* 盲文点阵风格的进度条 */}
            <div style={styles.commandLineProgressBar}>
              {renderBrailleProgressBar(downloadProgress.progress)}
            </div>
            
            <div style={styles.progressInfo}>
              <span>进度: {downloadProgress.progress}%</span>
              <span>{downloadProgress.progress < 100 ? '下载中...' : '下载完成'}</span>
            </div>
          </div>
        )}
      </div>

      {/* 删除确认模态框 */}
      {showDeleteModal && modelToDelete && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{ marginTop: 0 }}>确认删除</h3>
            <p>确定要删除模型 <strong>{formatModelName(modelToDelete.name, modelToDelete.tag)}</strong> 吗？此操作不可撤销。</p>
            <div style={styles.modalButtons}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setModelToDelete(null);
                }}
                style={styles.cancelButton}
              >
                取消
              </button>
              <button
                onClick={deleteModel}
                disabled={loading}
                style={{
                  ...styles.deleteButton,
                  ...(loading ? { opacity: 0.7, cursor: 'not-allowed' } : {})
                }}
              >
                {loading ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
