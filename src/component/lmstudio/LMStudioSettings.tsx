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
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [responseTime, setResponseTime] = useState<number>(0);
  const [tokenCount, setTokenCount] = useState<number>(0);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePrompt, setImagePrompt] = useState<string>("请描述这张图片中的内容，并告诉我你看到了什么？");
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [imageResponse, setImageResponse] = useState<string | null>(null);
  
  // 默认图像模型
  const defaultImageModel = "llava-v1.5-7b";

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

  // 固定的测试消息内容
  const fixedUserMessage = "请介绍一下你自己，并用3个要点概括LLM的特性。";
  const fixedSystemPrompt = "你是一个有用的AI助手，请用简明扼要的语言回答问题。";

  // 修改发送聊天请求的方法
  const sendChatRequest = async () => {
    if (!selectedModel) {
      return;
    }
    
    setIsStreaming(true);
    setError(null);
    setChatResponse('');
    
    try {
      await lmStudioService.sendStreamingRequest(
        {
          messages: [{ id: '1', content: fixedUserMessage, timestamp: Date.now(), sender: 'user', favorite: false }],
          systemPrompt: fixedSystemPrompt,
          temperature: temperature,
          maxTokens: -1
        },
        (response) => {
          setChatResponse(response.content);
          if (response.isComplete) {
            setResponseTime(response.responseTime || 0);
            setTokenCount(response.tokenCount || 0);
            setIsStreaming(false);
          }
        }
      );
    } catch (err) {
      setError('聊天请求失败: ' + (err instanceof Error ? err.message : String(err)));
      setIsStreaming(false);
    }
  };

  // 估算token数量（简单实现）
  const estimateTokenCount = (text: string): number => {
    return Math.ceil(text.length / 4);
  };

  // 组件加载时测试连接
  useEffect(() => {
    testConnection();
  }, []);

  // 格式化JSON以增加可读性
  const formatJSON = (json: any): string => {
    return JSON.stringify(json, null, 2);
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

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImageFile(file);
    
    // 转换图片为base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImageBase64(base64String);
    };
    reader.readAsDataURL(file);
  };
  
  // 发送图片识别请求
  const sendImageRequest = async () => {
    if (!imageBase64) return;
    
    setIsImageProcessing(true);
    setError(null);
    setImageResponse('');
    
    try {
      await lmStudioService.sendImageRequest(
        imageBase64,
        imagePrompt,
        temperature,
        (response) => {
          setImageResponse(response.content);
          if (response.isComplete) {
            setResponseTime(response.responseTime || 0);
            setTokenCount(response.tokenCount || 0);
            setIsImageProcessing(false);
          }
        }
      );
    } catch (err) {
      setError('图像识别请求失败: ' + (err instanceof Error ? err.message : String(err)));
      setIsImageProcessing(false);
    }
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
    select: {
      padding: '6px 12px',
      border: '1px solid var(--background-modifier-border)',
      borderRadius: '4px',
      backgroundColor: 'var(--background-modifier-form-field)',
      color: 'var(--text-normal)',
      marginRight: '8px',
      minWidth: '200px'
    },
    modelList: {
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
    formField: {
      marginBottom: '12px'
    },
    formLabel: {
      display: 'block',
      marginBottom: '4px',
      fontWeight: 500
    },
    testRequest: {
      backgroundColor: 'var(--background-secondary)',
      padding: '12px',
      borderRadius: '4px',
      marginBottom: '16px'
    },
    requestCard: {
      backgroundColor: 'var(--background-primary)',
      border: '1px solid var(--background-modifier-border)',
      borderRadius: '4px',
      padding: '12px',
      marginBottom: '12px'
    },
    preCode: {
      backgroundColor: 'var(--background-primary-alt)',
      padding: '8px',
      borderRadius: '4px',
      overflowX: 'auto' as const,
      fontFamily: 'monospace',
      fontSize: '12px',
      whiteSpace: 'pre-wrap' as const,
      margin: '8px 0'
    },
    chatResponse: {
      marginTop: '16px',
      padding: '12px',
      backgroundColor: 'var(--background-secondary)',
      borderRadius: '4px',
      whiteSpace: 'pre-wrap' as const
    },
    commandLineProgressBar: {
      margin: '8px 0',
      fontSize: '18px',
      lineHeight: '1.2',
      whiteSpace: 'pre' as const,
      letterSpacing: '1px'
    },
    progressInfo: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '12px',
      color: 'var(--text-muted)',
      marginTop: '4px'
    },
    responseStats: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '8px',
      color: 'var(--text-muted)',
      fontSize: '12px'
    },
    input: {
      padding: '6px 12px',
      border: '1px solid var(--background-modifier-border)',
      borderRadius: '4px',
      backgroundColor: 'var(--background-modifier-form-field)',
      color: 'var(--text-normal)',
      width: '100%'
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>LM Studio 配置</h2>
      {/* <>/// <ref="https://lmstudio.ai/docs/app/api/endpoints/rest" />
	  </> */}
	<div style={{
		backgroundColor: 'var(--background-secondary)',
		padding: '16px',
		borderRadius: '4px',
		marginBottom: '20px'
	}}>
		<h3 style={{margin: '0 0 12px 0'}}>LM Studio 主要功能</h3>
		<ul style={{margin: '0', paddingLeft: '20px'}}>
	    	<li>无需命令行，你可以通过下面的按钮学习如何交互。</li>  
    		<li>用于运行本地 LLMs 的桌面应用程序，后端服务器和</li>
			<li>熟悉的聊天界面，方便的管理页面和Runtime</li>
			<li>通过 Hugging Face 🤗 搜索和下载模型</li>
			<li>具有类 OpenAI 端点的本地服务器</li>
			<li>本地模型和配置管理系统，以及独特的Rest API.</li>
		</ul>
	</div>
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

      {/* 可用模型列表 */}
      {connectionStatus === 'connected' && (
        <div style={styles.commandSection}>
          <h3 style={styles.heading}>可用模型</h3>
          <div style={styles.commandRow}>
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
            <span style={styles.commandText}>curl http://127.0.0.1:1234/v1/models</span>
            <span style={styles.commandDesc}>获取所有已加载的模型列表</span>
          </div>
          
          {loading ? (
            <div style={styles.loading}>加载中...</div>
          ) : models.length > 0 ? (
            <table style={styles.modelList}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>模型ID</th>
                  <th style={styles.tableHeader}>所有者</th>
                  <th style={styles.tableHeader}>创建时间</th>
                </tr>
              </thead>
              <tbody>
                {models.map(model => (
                  <tr key={model.id}>
                    <td style={styles.tableCell}>{model.id}</td>
                    <td style={styles.tableCell}>{model.owned_by}</td>
                    <td style={styles.tableCell}>{new Date(model.created * 1000).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={styles.noModels}>
              {connectionStatus === 'connected' ? '未找到已加载的模型' : '请先连接到LM Studio服务'}
            </div>
          )}
        </div>
      )}
      
      {/* 聊天测试部分 */}
      {connectionStatus === 'connected' && models.length > 0 && (
        <div style={styles.commandSection}>
          <h3 style={styles.heading}>聊天测试</h3>
          
          <div style={styles.formField}>
            <label style={styles.formLabel}>选择模型:</label>
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
          
          <div style={styles.testRequest}>
            <h4 style={{margin: '0 0 12px 0'}}>测试请求内容</h4>
            
            <div style={styles.requestCard}>
              <div><strong>系统提示:</strong></div>
              <div style={styles.preCode}>{fixedSystemPrompt}</div>
              
              <div><strong>用户消息:</strong></div>
              <div style={styles.preCode}>{fixedUserMessage}</div>
            </div>
            
            <div style={{marginTop: '12px'}}>
              <button 
                onClick={sendChatRequest}
                disabled={!selectedModel || isStreaming}
                style={{
                  ...styles.button,
                  ...(!selectedModel || isStreaming ? styles.buttonDisabled : {})
                }}
              >
                {isStreaming ? '生成中...' : '发送测试请求'}
              </button>
            </div>
          </div>
          
          <div style={{marginBottom: '16px'}}>
            <h4 style={{margin: '0 0 8px 0'}}>请求JSON</h4>
            <pre style={styles.preCode}>
              {formatJSON({
                model: selectedModel,
                messages: [
                  { role: "system", content: fixedSystemPrompt },
                  { role: "user", content: fixedUserMessage }
                ],
                temperature: temperature,
                max_tokens: -1,
                stream: true
              })}
            </pre>
          </div>
          
          <div style={{marginBottom: '8px'}}>
            <h4 style={{margin: '0 0 8px 0'}}>cURL 命令</h4>
            <pre style={{...styles.preCode, overflowX: 'auto', whiteSpace: 'pre'}}>
              curl http://127.0.0.1:1234/v1/chat/completions \<br/>
              &nbsp;&nbsp;-H "Content-Type: application/json" \<br/>
              &nbsp;&nbsp;-d '{JSON.stringify({
                model: selectedModel,
                messages: [
                  { role: "system", content: fixedSystemPrompt },
                  { role: "user", content: fixedUserMessage }
                ],
                temperature: temperature,
                max_tokens: -1,
                stream: true
              }).replace(/"/g, '\\"')}'
            </pre>
          </div>
          
          {/* 流式响应显示区域 */}
          <h4 style={{margin: '16px 0 8px 0'}}>AI 响应</h4>
          <div style={styles.chatResponse}>
            {isStreaming && (
              <div style={{marginBottom: '8px'}}>
                <div style={styles.commandLineProgressBar}>
                  {renderBrailleProgressBar(50)}
                </div>
                <div style={styles.progressInfo}>
                  <span>生成中...</span>
                </div>
              </div>
            )}
            
            {chatResponse ? (
              <>
                <div>{chatResponse}</div>
                {!isStreaming && (
                  <div style={styles.responseStats}>
                    <span>响应时间: {responseTime}ms</span>
                    <span>估计 Token 数: {tokenCount}</span>
                  </div>
                )}
              </>
            ) : (
              <div style={{color: 'var(--text-muted)'}}>
                {isStreaming ? '正在生成回复...' : '点击"发送测试请求"按钮开始测试'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 图片识别测试部分 */}
      {connectionStatus === 'connected' && models.length > 0 && (
        <div style={styles.commandSection}>
          <h3 style={styles.heading}>图片识别测试</h3>
          
          <div style={styles.formField}>
            <label style={styles.formLabel}>图片上传:</label>
            <div style={{ marginTop: '8px', marginBottom: '12px' }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isImageProcessing}
                style={{ display: 'block', marginBottom: '8px' }}
              />
              {imageBase64 && (
                <div style={{ marginTop: '12px' }}>
                  <img 
                    src={imageBase64} 
                    alt="上传的图片" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '300px',
                      border: '1px solid var(--background-modifier-border)',
                      borderRadius: '4px'
                    }} 
                  />
                </div>
              )}
            </div>
          </div>
          
          <div style={styles.formField}>
            <label style={styles.formLabel}>图片提示:</label>
            <input
              type="text"
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              style={styles.input}
              disabled={isImageProcessing}
            />
          </div>
          
          <div style={{marginTop: '12px'}}>
            <button 
              onClick={sendImageRequest}
              disabled={!imageBase64 || isImageProcessing}
              style={{
                ...styles.button,
                ...(!imageBase64 || isImageProcessing ? styles.buttonDisabled : {})
              }}
            >
              {isImageProcessing ? '识别中...' : '发送图片识别请求'}
            </button>
          </div>
          
          <div style={{marginTop: '16px'}}>
            <h4 style={{margin: '0 0 8px 0'}}>AI 响应</h4>
            <div style={styles.chatResponse}>
              {isImageProcessing && (
                <div style={{marginBottom: '8px'}}>
                  <div style={styles.commandLineProgressBar}>
                    {renderBrailleProgressBar(50)}
                  </div>
                  <div style={styles.progressInfo}>
                    <span>识别中...</span>
                  </div>
                </div>
              )}
              
              {imageResponse ? (
                <>
                  <div>{imageResponse}</div>
                  {!isImageProcessing && (
                    <div style={styles.responseStats}>
                      <span>响应时间: {responseTime}ms</span>
                      <span>估计 Token 数: {tokenCount}</span>
                    </div>
                  )}
                </>
              ) : (
                <div style={{color: 'var(--text-muted)'}}>
                  {isImageProcessing ? '正在识别图片...' : '点击"发送图片识别请求"按钮开始测试'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
