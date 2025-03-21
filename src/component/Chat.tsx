import React, { useState, useEffect, useRef } from 'react';
import { App, Notice, TFile } from 'obsidian';
import ReactIris from '../main';
import { saveChatSessionToFile, loadChatSessionFromFile } from '../utils/chatUtils';
import { AIServiceFactory } from '../services/AIServiceFactory';
import { MessageBubble } from './chat-block/MessageBubble';
import { ChatInput } from './ChatInput';
import { ChatHeader } from './ChatHeader';
import { OllamaModel, OllamaService } from '../services/OllamaService';

export interface Message {
  id: string;
  content: string;
  timestamp: number;
  sender: 'user' | 'assistant';
  favorite: boolean;
  responseTime?: number; // AI响应时间（毫秒）
  tokencount?: number;   // 消息的token数量
  imageData?: string;    // 图片的base64数据
  imagePath?: string;    // 图片在仓库中的路径
  isContext?: boolean;   // 是否为上下文消息
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

interface ChatProps {
  app: App;
  onAddToInbox: (message: Message) => void;
  sessionId?: string;
  sidebarVisible: boolean;
  toggleSidebar: () => void;
  leftSidebarVisible: boolean;
  toggleLeftSidebar: () => void;
  plugin?: ReactIris;
}

type AIServiceType = 'ollama' | 'mock' | 'lmstudio';

export const ChatComponent: React.FC<ChatProps> = ({ 
  app, 
  onAddToInbox, 
  sessionId = 'default', 
  sidebarVisible, 
  toggleSidebar,
  leftSidebarVisible,
  toggleLeftSidebar,
  plugin
}) => {
  // 状态
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [serviceType, setServiceType] = useState<AIServiceType>('ollama');
  const [selectedImage, setSelectedImage] = useState<{base64: string, file: TFile} | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [serviceStatus, setServiceStatus] = useState<'ready' | 'testing' | 'offline'>('ready');
  const [currentRequest, setCurrentRequest] = useState<AbortController | null>(null);
  const [availableOllamaModels, setAvailableOllamaModels] = useState<OllamaModel[]>([]);
  
  // 引用
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (plugin) {
      console.log('ChatComponent: Plugin settings loaded', plugin.settings);
      setServiceType(plugin.settings.serviceType as AIServiceType);
      setSelectedModel(plugin.settings.modelName);
    } else {
      console.warn('ChatComponent: Plugin instance is not available.');
    }
  }, [plugin]);

  useEffect(() => {
    if (plugin && plugin.settings.serviceType === 'ollama') {
      loadOllamaModels();
    }
  }, [plugin, plugin?.settings.serviceType]);
  
  // 加载聊天记录
  useEffect(() => {
    loadChatSession();
  }, [sessionId]);
  
  // 自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // 加载聊天记录
  const loadChatSession = async () => {
    try {
      console.log(`ChatComponent: Loading chat session with ID: ${sessionId}`);
      const session = await loadChatSessionFromFile(app, sessionId);
      
      if (session) {
        console.log(`ChatComponent: Chat session loaded successfully`, session);
        setMessages(session.messages);
      } else {
        console.log(`ChatComponent: No chat session found with ID: ${sessionId}, creating new session.`);
        // 创建新的会话
        const initialMessage: Message = {
          id: generateId(),
          content: '你好，我是AI助手。请问有什么可以帮助你的吗？',
          timestamp: Date.now(),
          sender: 'assistant',
          favorite: false
        };
        
        setMessages([initialMessage]);
        
        // 保存初始会话
        const newSession: ChatSession = {
          id: sessionId,
          title: '新聊天',
          messages: [initialMessage],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        await saveChatSessionToFile(app, sessionId, newSession);
        console.log(`ChatComponent: New chat session created and saved`, newSession);
      }
    } catch (error) {
      console.error('加载聊天记录失败:', error);
    }
  };
  
  // 生成唯一ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };
  
  // 处理图片选择
  const handleImageSelected = (base64: string, file: TFile) => {
    console.log('ChatComponent: Image selected', { base64, file });
    setSelectedImage({base64, file});
  };
  
  // 处理发送消息
  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !selectedImage) || isLoading || isStreaming || !plugin) {
      console.log('ChatComponent: handleSendMessage aborted due to invalid state.');
      return;
    }
    
    // 用户消息
    const userMessage: Message = {
      id: generateId(),
      content: inputValue,
      timestamp: Date.now(),
      sender: 'user',
      favorite: false,
      // 如果有选择图片，添加图片数据
      ...(selectedImage && {
        imageData: selectedImage.base64,
        imagePath: selectedImage.file.path
      })
    };
    
    console.log('ChatComponent: User message created', userMessage);
    
    // 创建临时 AI 消息
    const aiMessageId = generateId();
    const aiMessage: Message = {
      id: aiMessageId,
      content: '',
      timestamp: Date.now(),
      sender: 'assistant',
      favorite: false,
    };

    // 更新消息列表
    const updatedMessages = [...messages, userMessage, aiMessage];
    setMessages(updatedMessages);
    console.log('ChatComponent: Messages updated with user message', updatedMessages);
    setInputValue('');
    setSelectedImage(null); // 清除已选择的图片
    setIsLoading(true);
    
    // 保存聊天记录
    const currentSession: ChatSession = {
      id: sessionId,
      title: '聊天会话',
      messages: updatedMessages,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    await saveChatSessionToFile(app, sessionId, currentSession);
    console.log('ChatComponent: Chat session saved', currentSession);
    
    // 如果AI客户端存在，发送消息
    try {
      setIsStreaming(true);
      console.log('ChatComponent: Starting AI request...');
      
      // 获取当前服务类型的配置信息
      const aiConfig = plugin.settings;
      console.log('ChatComponent: AI Service Configuration', aiConfig);
      
      // 根据服务类型选择对应的配置
      let baseUrl = aiConfig.baseUrl;
      if (aiConfig.serviceType === 'lmstudio') {
        baseUrl = 'http://localhost:1234'; // LM Studio 默认端口
      } else if (aiConfig.serviceType === 'ollama') {
        baseUrl = 'http://localhost:11434'; // Ollama 默认端口
      }
      
      let serviceConfig = {
        baseUrl: baseUrl,
        modelName: aiConfig.modelName,
        systemPrompt: aiConfig.aiService?.systemPrompt,
        temperature: aiConfig.temperature,
      };
      
      console.log('ChatComponent: Creating AI Service with config', serviceConfig);
      
      const aiService = AIServiceFactory.createService(aiConfig.serviceType, serviceConfig);
      
      const controller = new AbortController();
      setCurrentRequest(controller);
      
      console.log('ChatComponent: Sending streaming request to AI service', {
        messages: updatedMessages,
        systemPrompt: aiConfig.aiService?.systemPrompt,
        signal: controller.signal,
        messageId: aiMessageId // Pass the message ID
      });
      
      await aiService.sendStreamingRequest(
        {
          messages: updatedMessages,
          systemPrompt: aiConfig.aiService?.systemPrompt,
          signal: controller.signal,
          messageId: aiMessageId // Pass the message ID
        },
        (response) => {
          console.log('ChatComponent: Received AI stream update', response);
          setMessages((prevMessages) => {
            return prevMessages.map(msg => {
              if (msg.sender === 'assistant' && msg.id === aiMessageId) {
                console.log('AI响应数据:', { 
                  responseTime: response.responseTime,
                  tokenCount: response.tokenCount 
                });
                return { 
                  ...msg, 
                  content: response.content,
                  responsetime: response.responseTime,
                  tokencount: response.tokenCount
                };
              }
              return msg;
            });
          });
        }
      );
      
      setIsLoading(false);
      setIsStreaming(false);
      setCurrentRequest(null);
      console.log('ChatComponent: AI request completed.');
    } catch (error: any) {
      console.error('ChatComponent: AI request failed', error);
      handleError(error, updatedMessages);
      setCurrentRequest(null);
    }
  };
  
  // 处理错误
  const handleError = (error: any, messages: Message[]) => {
    console.error('AI请求处理错误:', error);
    
    // 显示错误提示
    new Notice(`AI响应失败: ${error.message}`, 5000);
    
    // 添加错误消息到聊天
    const errorMessage: Message = {
      id: generateId(),
      content: `很抱歉，处理您的请求时出现错误: ${error.message}`,
      timestamp: Date.now(),
      sender: 'assistant',
      favorite: false
    };
    
    const messagesWithError = [...messages, errorMessage];
    setMessages(messagesWithError);
    setIsLoading(false);
    setIsStreaming(false);
    
    // 保存包含错误消息的聊天记录
    const errorSession: ChatSession = {
      id: sessionId,
      title: '聊天会话',
      messages: messagesWithError,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    saveChatSessionToFile(app, sessionId, errorSession)
      .catch(err => console.error('保存错误消息失败:', err));
  };
  
  // 取消响应
  const handleCancelResponse = () => {
    if (currentRequest) {
      console.log('ChatComponent: Aborting current AI request.');
      currentRequest.abort();
      setIsLoading(false);
      setIsStreaming(false);
      setCurrentRequest(null);
      
      // 添加取消消息
      const cancelMessage: Message = {
        id: generateId(),
        content: '响应已取消',
        timestamp: Date.now(),
        sender: 'assistant',
        favorite: false
      };
      
      const updatedMessages = [...messages, cancelMessage];
      setMessages(updatedMessages);
      
      // 保存聊天记录
      const session: ChatSession = {
        id: sessionId,
        title: '聊天会话',
        messages: updatedMessages,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      saveChatSessionToFile(app, sessionId, session);
    }
  };
  
  // 切换服务类型
  const toggleService = () => {
    if (isLoading || isStreaming || !plugin) return;
    
    let newType: AIServiceType;
    switch (serviceType) {
      case 'ollama':
        newType = 'lmstudio';
        setServiceStatus('testing');
        break;
      case 'lmstudio':
        newType = 'mock';
        setServiceStatus('ready');
        break;
      case 'mock':
        newType = 'ollama';
        setServiceStatus('testing');
        break;
      default:
        newType = 'ollama';
        setServiceStatus('testing');
    }
    
    plugin.settings.serviceType = newType;
    plugin.saveSettings();
    setServiceType(newType);
    new Notice(`已切换到 ${newType} 服务`);
  };
  
  // 处理服务类型变更
  const handleServiceChange = (type: AIServiceType) => {
    if (isLoading || isStreaming || !plugin) {
      new Notice('正在处理请求，无法切换服务');
      return;
    }
    
    // 设置服务状态为测试中
    if (type === 'lmstudio' || type === 'ollama') {
      setServiceStatus('testing');
    } else {
      setServiceStatus('ready');
    }
    
    plugin.settings.serviceType = type;
    plugin.saveSettings();
    setServiceType(type);
    new Notice(`已切换到 ${type} 服务`);
  };
  
  // 处理模型变更
  const handleModelChange = (modelName: string) => {
    if (isLoading || isStreaming || !plugin) {
      new Notice('正在处理请求，无法切换模型');
      return;
    }
    
    plugin.settings.modelName = modelName;
    plugin.saveSettings();
    setSelectedModel(modelName);
    new Notice(`已切换到模型: ${modelName}`);
  };
  
  // 处理添加或移除收藏
  const handleAddToInbox = (message: Message) => {
    // 切换收藏状态
    const newFavoriteState = !message.favorite;
    
    // 更新消息列表中的收藏状态
    const updatedMessages = messages.map(msg => 
      msg.id === message.id ? { ...msg, favorite: newFavoriteState } : msg
    );
    
    setMessages(updatedMessages);
    
    // 保存更新后的聊天记录
    const updatedSession: ChatSession = {
      id: sessionId,
      title: '聊天会话',
      messages: updatedMessages,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    saveChatSessionToFile(app, sessionId, updatedSession);
    
    // 根据操作类型调用父组件的onAddToInbox方法
    if (newFavoriteState) {
      // 添加到收藏
      onAddToInbox({ ...message, favorite: true });
    } else {
      // 从收藏中移除 - 传递一个特殊标志以表示这是移除操作
      onAddToInbox({ ...message, favorite: false, action: 'remove' });
    }
  };
  
  const loadOllamaModels = async () => {
    try {
      const ollamaService = new OllamaService({
        baseUrl: plugin?.settings.baseUrl || 'http://localhost:11434',
        modelName: ''
      });
      const isConnected = await ollamaService.testConnection();
      if (isConnected) {
        const models = await ollamaService.listModels();
        setAvailableOllamaModels(models);
      }
    } catch (error) {
      console.error('Failed to load Ollama models:', error);
    }
  };

  return (
    <div className="chat-container" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      maxHeight: '100%',
      minHeight: '500px',
      overflow: 'hidden',
      backgroundColor: 'var(--background-primary)',
      borderRadius: '8px',
      border: '1px solid var(--background-modifier-border)'
    }}>
      {/* 聊天头部 */}
      <ChatHeader 
        title="聊天会话"
        serviceType={serviceType}
        leftSidebarVisible={leftSidebarVisible}
        sidebarVisible={sidebarVisible}
        toggleLeftSidebar={toggleLeftSidebar}
        toggleSidebar={toggleSidebar}
        toggleService={toggleService}
        onServiceChange={handleServiceChange}
        onModelChange={handleModelChange}
        isLoading={isLoading}
        isStreaming={isStreaming}
        app={app}
        plugin={plugin}
        serviceStatus={serviceStatus}
        selectedModel={selectedModel}
        availableOllamaModels={availableOllamaModels}
        onOllamaModelChange={handleModelChange}
      />
      
      {/* 消息列表 */}
	<div className="chat-messages" style={{
	  flex: 1,
	  overflowY: 'auto',
	  padding: '16px',
	  display: 'flex',
	  flexDirection: 'column',
	  width: '100%',
	  backgroundColor: 'var(--background-primary)'
	}}>
	  {messages.map(message => (
		<MessageBubble 
		key={message.id}
		message={message}
		onAddToInbox={handleAddToInbox}
		app={app}
		/>
	  ))}
	  <div ref={messagesEndRef} />
	</div>
      
      {/* 聊天输入 */}
      <ChatInput 
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSendMessage}
        onCancel={handleCancelResponse}
        isLoading={isLoading}
        isStreaming={isStreaming}
        app={app}
        onImageSelected={handleImageSelected}
      />
    </div>
  );
};
