import React, { useMemo } from 'react';
import { App } from 'obsidian';
import { Message } from '../Chat';
import { formatResponseTime } from '../../utils/tokenUtils';
import { 
  MessageSegment, 
  MessageSegmentType, 
  parseMessageContent, 
  segmentToFavoriteMessage 
} from '../../utils/messageProcessorUtils';
import { TextBlock } from './TextBlock';
import { CodeBlock } from './CodeBlock';
import { MermaidBlock } from './MermaidBlock';
import { ThinkingBlock } from './ThinkingBlock';

interface MessageBubbleProps {
  message: Message & {
    responseTime?: number;
    tokenCount?: number;
    favorite?: boolean;
  };
  onAddToInbox: (message: Message) => void;
  app: App;
}

/**
 * 消息气泡组件 - 显示单条聊天消息
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onAddToInbox, app }) => {
  const isUser = message.sender === 'user';
  
  // 使用useMemo解析消息内容，避免不必要的重新计算
  const messageSegments = useMemo(() => {
    return parseMessageContent(message);
  }, [message]);
  
  // 处理段落收藏
  const handleSegmentAddToInbox = (segment: MessageSegment) => {
    const favoriteMessage = segmentToFavoriteMessage(segment);
    onAddToInbox(favoriteMessage);
  };
  
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
        maxWidth: '100%',
        width: '100%'
      }}>
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
          fontWeight: 'bold',
          marginRight: isUser ? '0' : '8px',
          marginLeft: isUser ? '8px' : '0',
          flexShrink: 0
        }}>
          {isUser ? '你' : 'Iris'}
        </div>
        
        <div style={{
          flex: 1,
          maxWidth: 'calc(100% - 50px)'
        }}>
          {isUser ? (
            // 用户消息简单显示 - 修复右对齐问题
            <div style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'flex-end' // 确保用户消息容器内容靠右对齐
            }}>
              <div style={{
                backgroundColor: 'var(--interactive-accent)',
                color: 'var(--text-on-accent)',
                padding: '12px 16px',
                borderRadius: '18px',
                borderBottomRightRadius: '4px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                maxWidth: '85%', // 限制最大宽度，避免过长消息横跨整个屏幕
                display: 'inline-block'
              }}>
                {message.content}
              </div>
            </div>
          ) : (
            // AI消息分段显示
            <div className="message-segments" style={{ width: '100%' }}>
              {messageSegments.map((segment) => {
                switch (segment.type) {
                  case MessageSegmentType.THINKING:
                    return (
                      <ThinkingBlock 
                        key={segment.id}
                        segment={segment}
                        onAddToInbox={handleSegmentAddToInbox}
                      />
                    );
                  
                  case MessageSegmentType.CODE:
                    return (
                      <CodeBlock 
                        key={segment.id}
                        segment={segment}
                        app={app}
                        onAddToInbox={handleSegmentAddToInbox}
                      />
                    );
                  
                  case MessageSegmentType.MERMAID:
                    return (
                      <MermaidBlock 
                        key={segment.id}
                        segment={segment}
                        app={app}
                        onAddToInbox={handleSegmentAddToInbox}
                      />
                    );
                  
                  case MessageSegmentType.TEXT:
                  default:
                    return (
                      <TextBlock 
                        key={segment.id}
                        segment={segment}
                        onAddToInbox={handleSegmentAddToInbox}
                        app={app}
                      />
                    );
                }
              })}
            </div>
          )}
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        marginTop: '4px',
        fontSize: '12px',
        color: 'var(--text-muted)',
        paddingLeft: isUser ? '0' : '40px',
        paddingRight: isUser ? '40px' : '0'
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
                <span style={{ fontSize: '14px' }}>★</span> 收藏完整回复
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
