import React from 'react';
import { Message } from './Chat';

interface MessageBubbleProps {
  message: Message;
  onAddToInbox: (message: Message) => void;
}

/**
 * 消息气泡组件 - 显示单条聊天消息
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onAddToInbox }) => {
  const isUser = message.sender === 'user';
  
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
        <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
        {!isUser && !message.favorite && (
          <button 
            onClick={() => onAddToInbox(message)}
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
