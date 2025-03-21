import React, { useState, useEffect, useRef } from 'react';
import { App, Notice } from 'obsidian';
import ReactIris from '../main';
import { saveChatSessionToFile, loadChatSessionFromFile } from '../utils/chatUtils';
import { AIServiceType } from '../services/AIServiceFactory';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { ChatHeader } from './ChatHeader';
import { AIClient } from '../services/AIClient';

export interface Message {
  id: string;
  content: string;
  timestamp: number;
  sender: 'user' | 'assistant';
  favorite: boolean;
  responsetime?: number; // AI响应时间（毫秒）
  tokencount?: number;   // 消息的token数量
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
  const [serviceType, setServiceType] = useState<AIServiceType>(
    plugin?.getAIServiceConfig().type || 'langchain'
  );
  
  // 引用
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiClientRef = useRef<AIClient | null>(null);
  
  // 初始化AI客户端
  useEffect(() => {
    aiClientRef.current = new AIClient(app, plugin, sessionId);
    
    // 组件卸载时清理
    return () => {
      if (aiClientRef.current) {
        aiClientRef.current.cancelRequest();
      }
    };
  }, [plugin, sessionId]);
  
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
      const session = await loadChatSessionFromFile(app, sessionId);
      
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
          id: sessionId,
          title: '新聊天',
          messages: [initialMessage],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        await saveChatSessionToFile(app, sessionId, newSession);
      }
    } catch (error) {
      console.error('加载聊天记录失败:', error);
    }
  };
  
  // 生成唯一ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };
  
  // 处理发送消息
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || isStreaming) return;
    
    // 用户消息
    const userMessage: Message = {
      id: generateId(),
      content: inputValue,
      timestamp: Date.now(),
      sender: 'user',
      favorite: false
    };
    
    // 更新消息列表
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
    
    // 如果AI客户端存在，发送消息
    if (aiClientRef.current) {
      try {
        setIsStreaming(true);
        const success = await aiClientRef.current.sendMessage(
          updatedMessages,
          // 流更新回调
          (content, isComplete) => {
            if (isComplete) {
              setIsLoading(false);
              setIsStreaming(false);
            }
          },
          // 消息更新回调
          (newMessages) => {
            setMessages(newMessages);
          }
        );
        
        if (!success) {
          handleError(new Error('发送消息失败'), updatedMessages);
        }
      } catch (error) {
        handleError(error, updatedMessages);
      }
    } else {
      handleError(new Error('AI客户端未初始化'), updatedMessages);
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
    if (aiClientRef.current && (isLoading || isStreaming)) {
      aiClientRef.current.cancelRequest();
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
  
  // 切换服务类型
  const toggleService = () => {
    if (isLoading || isStreaming) return;
    
    const newType = serviceType === 'langchain' ? 'ollama' : 'langchain';
    
    if (aiClientRef.current && aiClientRef.current.changeServiceType(newType)) {
      setServiceType(newType);
      new Notice(`已切换到 ${newType} 服务`);
    } else {
      new Notice('服务切换失败');
    }
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
        isLoading={isLoading}
        isStreaming={isStreaming}
      />
      
      {/* 消息列表 */}
	<div className="chat-messages" style={{
	  flex: 1,
	  overflowY: 'auto',
	  padding: '16px',
	  display: 'flex',
	  flexDirection: 'column',
	  width: '100%'
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
      />
    </div>
  );
};
