import React, { useState, useEffect, useRef } from 'react';
import { App, Notice } from 'obsidian';
import ReactIris from '../main';
import { saveChatSessionToFile, loadChatSessionFromFile } from '../utils/chatUtils';
import { AIServiceFactory, AIServiceType } from '../services/AIServiceFactory';
import { AIService, AIResponseStream } from '../services/AIService';

export interface Message {
  id: string;
  content: string;
  timestamp: number;
  sender: 'user' | 'assistant';
  favorite: boolean;
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
  plugin?: ReactIris; // 添加plugin参数以访问vault
}

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const aiServiceRef = useRef<AIService | null>(null);
  
  // 初始化AI服务
  useEffect(() => {
    if (plugin) {
      const aiConfig = plugin.getAIServiceConfig();
      try {
        aiServiceRef.current = AIServiceFactory.createService(
          aiConfig.type, 
          {
            baseUrl: aiConfig.baseUrl,
            modelName: aiConfig.modelName,
            systemPrompt: aiConfig.systemPrompt,
            temperature: aiConfig.temperature,
            maxTokens: aiConfig.maxTokens
          }
        );
        console.log(`AI服务初始化成功: ${aiConfig.type} - ${aiConfig.modelName}`);
      } catch (error) {
        console.error('AI服务初始化失败:', error);
        // 如果初始化失败，使用Mock服务作为后备
        aiServiceRef.current = AIServiceFactory.createService('mock', {
          baseUrl: '',
          modelName: 'mock'
        });
      }
    } else {
      // 如果没有插件实例，使用Mock服务
      aiServiceRef.current = AIServiceFactory.createService('mock', {
        baseUrl: '',
        modelName: 'mock'
      });
    }

    // 组件卸载时清理
    return () => {
      if (aiServiceRef.current) {
        aiServiceRef.current.cancelRequest();
      }
    };
  }, [plugin]);

  // 加载聊天记录
  useEffect(() => {
    loadChatSession(sessionId);
  }, [sessionId]);

  // 自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 当组件加载时聚焦输入框
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 加载聊天记录
  const loadChatSession = async (id: string) => {
    try {
      const session = await loadChatSessionFromFile(app, id);
      
      if (session) {
        setMessages(session.messages);
      } else {
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
          id,
          title: '新聊天',
          messages: [initialMessage],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        await saveChatSessionToFile(app, id, newSession);
      }
    } catch (error) {
      console.error('加载聊天记录失败:', error);
    }
  };

  // 生成唯一ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // 处理消息发送
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    // 用户消息
    const userMessage: Message = {
      id: generateId(),
      content: inputValue,
      timestamp: Date.now(),
      sender: 'user',
      favorite: false
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);
    setAiResponse('');
    setIsStreaming(false);
    
    // 保存聊天记录
    const currentSession: ChatSession = {
      id: sessionId,
      title: '聊天会话',
      messages: updatedMessages,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    await saveChatSessionToFile(app, sessionId, currentSession);
    
    try {
      if (!aiServiceRef.current) {
        throw new Error('AI服务未初始化');
      }

      // 创建一个临时的AI响应消息，用于流式更新
      const tempAiMessage: Message = {
        id: generateId(),
        content: '',
        timestamp: Date.now(),
        sender: 'assistant',
        favorite: false
      };
      
      // 将临时消息添加到聊天中
      const messagesWithTemp = [...updatedMessages, tempAiMessage];
      setMessages(messagesWithTemp);
      
      // 是否使用流式处理
      const useStreaming = true;
      
      if (useStreaming) {
        // 使用流式处理
        setIsStreaming(true);
        await aiServiceRef.current.sendStreamingRequest(
          {
            messages: updatedMessages,
            systemPrompt: plugin?.getAIServiceConfig().systemPrompt,
          },
          (response: AIResponseStream) => {
            setAiResponse(response.content);
            
            // 更新临时消息的内容
            const updatedMessagesWithResponse = messagesWithTemp.map(msg => 
              msg.id === tempAiMessage.id 
                ? { ...msg, content: response.content }
                : msg
            );
            setMessages(updatedMessagesWithResponse);
            
            // 如果响应已完成，保存聊天记录
            if (response.isComplete) {
              setIsStreaming(false);
              setIsLoading(false);
              
              // 使用最终响应更新消息
              const finalMessages = updatedMessagesWithResponse;
              
              // 保存最终聊天记录
              const finalSession: ChatSession = {
                id: sessionId,
                title: '聊天会话',
                messages: finalMessages,
                createdAt: Date.now(),
                updatedAt: Date.now()
              };
              
              saveChatSessionToFile(app, sessionId, finalSession);
            }
          }
        );
      } else {
        // 使用非流式处理
        const aiResponse = await aiServiceRef.current.sendRequest({
          messages: updatedMessages,
          systemPrompt: plugin?.getAIServiceConfig().systemPrompt,
        });
        
        // 更新临时消息为最终响应
        const finalMessages = messagesWithTemp.map(msg => 
          msg.id === tempAiMessage.id ? aiResponse : msg
        );
        
        setMessages(finalMessages);
        setIsLoading(false);
        
        // 保存最终聊天记录
        const finalSession: ChatSession = {
          id: sessionId,
          title: '聊天会话',
          messages: finalMessages,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        await saveChatSessionToFile(app, sessionId, finalSession);
      }
    } catch (error) {
      console.error('AI请求失败:', error);
      
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
      
      const messagesWithError = [...updatedMessages, errorMessage];
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
      
      await saveChatSessionToFile(app, sessionId, errorSession);
    }
  };
  
  // 取消AI响应
  const handleCancelResponse = () => {
    if (aiServiceRef.current && (isLoading || isStreaming)) {
      aiServiceRef.current.cancelRequest();
      setIsLoading(false);
      setIsStreaming(false);
      
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

  // 处理输入框键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 处理添加到收藏
  const handleAddToInbox = (message: Message) => {
    // 标记消息为收藏
    const updatedMessages = messages.map(msg => 
      msg.id === message.id ? { ...msg, favorite: true } : msg
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
    
    // 调用父组件的onAddToInbox方法，将消息传递给Sidebar
    onAddToInbox({ ...message, favorite: true });
  };

  // 渲染消息气泡
  const renderMessage = (message: Message) => {
    const isUser = message.sender === 'user';
    
    return (
      <div 
        key={message.id} 
        className={`chat-message ${isUser ? 'user-message' : 'assistant-message'}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isUser ? 'flex-end' : 'flex-start',
          marginBottom: '16px'
        }}
      >
        <div style={{ 
          display: 'flex', 
          flexDirection: isUser ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
          maxWidth: '80%'
        }}>
          <div style={{
            backgroundColor: isUser ? 'var(--interactive-accent)' : 'var(--background-secondary)',
            color: isUser ? 'var(--text-on-accent)' : 'var(--text-normal)',
            padding: '12px 16px',
            borderRadius: '18px',
            borderBottomLeftRadius: isUser ? '18px' : '4px',
            borderBottomRightRadius: isUser ? '4px' : '18px',
            marginLeft: isUser ? '0' : '8px',
            marginRight: isUser ? '8px' : '0',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
            overflowWrap: 'break-word',
            whiteSpace: 'pre-wrap'
          }}>
            {message.content}
          </div>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: isUser ? 'var(--interactive-accent-hover)' : 'var(--interactive-success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            {isUser ? '你' : 'AI'}
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginTop: '4px',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}>
          <span>
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
          {!isUser && !message.favorite && (
            <button 
              onClick={() => handleAddToInbox(message)}
              style={{
                marginLeft: '8px',
                background: 'none',
                border: 'none',
                color: 'var(--text-accent)',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px'
              }}
              aria-label="添加到收藏"
            >
              添加到收藏
            </button>
          )}
          {!isUser && message.favorite && (
            <span style={{
              marginLeft: '8px',
              color: 'var(--text-accent)',
              fontSize: '12px'
            }}>
              ✓ 已收藏
            </span>
          )}
        </div>
      </div>
    );
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
      borderRadius: '5px',
      border: '1px solid var(--background-modifier-border)'
    }}></div>
  {/* 聊天区域标题 */}
      <div className="chat-header" style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--background-modifier-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}></div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button 
            onClick={toggleLeftSidebar}
            aria-label={leftSidebarVisible ? '隐藏左侧边栏' : '显示左侧边栏'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-normal)',
              padding: '4px 8px',
              borderRadius: '4px',
              marginRight: '8px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px'
            }}
            className={leftSidebarVisible ? 'sidebar-button active' : 'sidebar-button'}
          ></button>
            {leftSidebarVisible ? '◀' : '▶'}
          </button>
          <h3 style={{ margin: 0 }}>聊天会话</h3>
        </div>
        <button 
          onClick={toggleSidebar}
          aria-label={sidebarVisible ? '隐藏右侧边栏' : '显示右侧边栏'}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-normal)',
            padding: '4px 8px',
            borderRadius: '4px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px'
          }}
          className={sidebarVisible ? 'sidebar-button active' : 'sidebar-button'}
        >
          {sidebarVisible ? '▶' : '◀'}
        </button>
      </div>
      
      {/* 消息列表 */}
      <div className="chat-messages" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {messages.map(renderMessage)}
        <div ref={messagesEndRef} />
      </div>
      
      {/* 输入区域 */}
      <div className="chat-input-area" style={{
        padding: '16px',
        borderTop: '1px solid var(--background-modifier-border)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息，按Enter发送..."
          disabled={isLoading || isStreaming}
          style={{
            width: '100%',
            minHeight: '60px',
            maxHeight: '120px',
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid var(--background-modifier-border)',
            backgroundColor: 'var(--background-primary-alt)',
            color: 'var(--text-normal)',
            resize: 'vertical',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            opacity: (isLoading || isStreaming) ? 0.7 : 1
          }}
        />
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}></div>
          {(isLoading || isStreaming) && (
            <button
              onClick={handleCancelResponse}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--text-error)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                marginRight: '8px',
                cursor: 'pointer'
              }}
            >
              取消响应
            </button>
          )}
          <button
            onClick={handleSendMessage}
            disabled={isLoading || isStreaming || !inputValue.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--interactive-accent)',
              color: 'var(--text-on-accent)',
              border: 'none',
              borderRadius: '4px',
              cursor: (isLoading || isStreaming || !inputValue.trim()) ? 'not-allowed' : 'pointer',
              opacity: (isLoading || isStreaming || !inputValue.trim()) ? 0.7 : 1
            }}
          ></button>
            {isLoading ? '思考中...' : isStreaming ? '生成中...' : '发送'}
          </button>
        </div>
      </div>
    </div>
  );
};
