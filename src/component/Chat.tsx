import React, { useState, useEffect, useRef } from 'react';
import { App } from 'obsidian';
import ReactIris from '../main';
import { saveChatSessionToFile, loadChatSessionFromFile } from '../utils/chatUtils';

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
  plugin?: ReactIris; // 添加plugin参数以访问vault
}

export const ChatComponent: React.FC<ChatProps> = ({ 
  app, 
  onAddToInbox, 
  sessionId = 'default', 
  sidebarVisible, 
  toggleSidebar,
  plugin
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
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
    if (!inputValue.trim()) return;
    
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
    
    // 保存聊天记录
    const currentSession: ChatSession = {
      id: sessionId,
      title: '聊天会话',
      messages: updatedMessages,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    await saveChatSessionToFile(app, sessionId, currentSession);
    
    setTimeout(() => {
      // 模拟AI响应，只是重复用户输入
      const aiResponse: Message = {
        id: generateId(),
        content: `你说: "${inputValue}"`,
        timestamp: Date.now(),
        sender: 'assistant',
        favorite: false
      };
      
      const newMessages = [...updatedMessages, aiResponse];
      setMessages(newMessages);
      setIsLoading(false);
      
      // 保存更新后的聊天记录
      const updatedSession: ChatSession = {
        id: sessionId,
        title: '聊天会话',
        messages: newMessages,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      saveChatSessionToFile(app, sessionId, updatedSession);
    }, 500);
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
      overflow: 'hidden',
      backgroundColor: 'var(--background-primary)',
      borderRadius: '5px',
      border: '1px solid var(--background-modifier-border)'
    }}>
      {/* 聊天区域标题 */}
      <div className="chat-header" style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--background-modifier-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0 }}>聊天会话</h3>
        <button 
          onClick={toggleSidebar}
          aria-label={sidebarVisible ? '隐藏侧边栏' : '显示侧边栏'}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-normal)',
            padding: '4px 8px',
            borderRadius: '4px'
          }}
        >
          {sidebarVisible ? '隐藏收藏' : '显示收藏'}
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
            fontSize: 'inherit'
          }}
        />
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--interactive-accent)',
              color: 'var(--text-on-accent)',
              border: 'none',
              borderRadius: '4px',
              cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
              opacity: inputValue.trim() ? 1 : 0.7
            }}
          >
            {isLoading ? '发送中...' : '发送'}
          </button>
        </div>
      </div>
    </div>
  );
};
