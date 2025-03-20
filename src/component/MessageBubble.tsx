import React from 'react';
import { Message } from './Chat';
import { formatResponseTime } from '../utils/tokenUtils';

interface MessageBubbleProps {
  message: Message & {
    responseTime?: number;
    tokenCount?: number;
    favorite?: boolean;
  };
  onAddToInbox: (message: Message) => void;
}

/**
 * 消息气泡组件 - 显示单条聊天消息
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onAddToInbox }) => {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';
  
  // 系统消息使用特殊样式
  if (isSystem) {
    return (
      <div 
        className="chat-message system-message"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '16px',
          width: '100%'
        }}
      >
        <div style={{
          backgroundColor: 'var(--background-modifier-border)',
          color: 'var(--text-normal)',
          padding: '8px 12px',
          borderRadius: '12px',
          fontSize: '13px',
          maxWidth: '80%',
          textAlign: 'center'
        }}>
          {message.content}
        </div>
        <div style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          marginTop: '4px'
        }}>
          {new Date(message.timestamp).toLocaleTimeString()}
          
          {message.responsetime !== undefined && message.responsetime > 0 && (
            <span style={{ marginLeft: '8px' }}>
              {formatResponseTime(message.responsetime)}
            </span>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div 
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
        maxWidth: '100%'
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
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        marginTop: '4px',
        fontSize: '12px',
        color: 'var(--text-muted)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
          
          {!isUser && message.responsetime !== undefined && message.responsetime > 0 && (
            <span style={{ 
              color: 'var(--text-faint)',
              fontSize: '11px'
            }}>
              响应: {formatResponseTime(message.responsetime)}
            </span>
          )}
          
          {!isUser && message.tokencount !== undefined && message.tokencount > 0 && (
            <span style={{ 
              color: 'var(--text-faint)',
              fontSize: '11px'
            }}>
              {message.tokencount} tokens
            </span>
          )}
        </div>
        
		{!isUser && (
		  <div style={{ marginTop: '4px' }}>
			{!message.favorite ? (
			  <button 
			onClick={() => onAddToInbox(message)}
			style={{
			  background: 'none',
			  border: 'none',
			  color: 'var(--text-accent)',
			  cursor: 'pointer',
			  padding: '2px 6px',
			  borderRadius: '4px',
			  fontSize: '12px',
			  display: 'flex',
			  alignItems: 'center',
			  gap: '4px'
				}}
				aria-label="添加到收藏"
			  >
			<span style={{ fontSize: '14px' }}>★</span> 添加到收藏
			  </button>
			) : (
			  <button
			onClick={() => onAddToInbox(message)}
			style={{
			  background: 'none',
			  border: 'none',
			  color: 'var(--text-accent)',
			  cursor: 'pointer',
			  padding: '2px 6px',
			  borderRadius: '4px',
			  fontSize: '12px',
			  display: 'flex',
			  alignItems: 'center',
			  gap: '4px'
				}}
				aria-label="取消收藏"
			  >
			<span style={{ fontSize: '14px' }}>★</span> 取消收藏
			  </button>
			)}
		  </div>
		)}
      </div>
    </div>
  );
};
