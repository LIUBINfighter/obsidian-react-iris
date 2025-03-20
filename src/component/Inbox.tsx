import React, { useState } from 'react';
import { App, Notice } from 'obsidian';
import { Message } from './Chat';
import ReactIris from '../main';
import { exportMessagesToMarkdown } from '../utils/exportUtils';

interface InboxProps {
  messages: Message[];
  onRemove: (id: string) => void;
  app: App;
  plugin?: ReactIris;
}

export const InboxComponent: React.FC<InboxProps> = ({ messages, onRemove, app, plugin }) => {
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  
  // 切换消息选择状态
  const toggleMessageSelection = (id: string) => {
    setSelectedMessages(prev => 
      prev.includes(id) 
        ? prev.filter(messageId => messageId !== id) 
        : [...prev, id]
    );
  };
  
  // 导出选中的消息
  const exportSelectedMessages = async () => {
    try {
      if (selectedMessages.length === 0) {
        new Notice('请先选择要导出的消息');
        return;
      }
      
      // 获取选中的消息
      const messagesToExport = messages.filter(msg => selectedMessages.includes(msg.id));
      
      // 使用工具函数导出消息
      const result = await exportMessagesToMarkdown(
        app,
        messagesToExport,
        `导出的收藏 ${new Date().toLocaleString().replace(/[\/\\:]/g, '-')}.md`
      );
      
      if (result.success) {
        new Notice(`成功导出 ${selectedMessages.length} 条消息`);
        // 清除选择
        setSelectedMessages([]);
      } else {
        new Notice('导出消息失败: ' + result.error);
      }
      
    } catch (error) {
      console.error('导出消息失败:', error);
      new Notice('导出消息失败: ' + error.message);
    }
  };
  
  // 导出所有收藏消息
  const exportAllMessages = async () => {
    if (messages.length === 0) {
      new Notice('收藏箱中没有消息');
      return;
    }
    
    try {
      // 使用工具函数导出所有消息
      const result = await exportMessagesToMarkdown(
        app,
        messages,
        `所有收藏 ${new Date().toLocaleString().replace(/[\/\\:]/g, '-')}.md`
      );
      
      if (result.success) {
        new Notice(`成功导出所有 ${messages.length} 条消息`);
        // 清除选择
        setSelectedMessages([]);
      } else {
        new Notice('导出消息失败: ' + result.error);
      }
      
    } catch (error) {
      console.error('导出所有消息失败:', error);
      new Notice('导出消息失败: ' + error.message);
    }
  };
  
  return (
    <div className="inbox-container" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }}>
      <div className="inbox-header" style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--background-modifier-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h4 style={{ margin: 0 }}>收藏箱 ({messages.length})</h4>
        <div>
          <button
            onClick={exportSelectedMessages}
            disabled={selectedMessages.length === 0}
            style={{
              padding: '4px 8px',
              backgroundColor: selectedMessages.length ? 'var(--interactive-accent)' : 'var(--background-modifier-border)',
              color: selectedMessages.length ? 'var(--text-on-accent)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '4px',
              marginRight: '8px',
              cursor: selectedMessages.length ? 'pointer' : 'not-allowed',
              fontSize: '12px'
            }}
          >
            导出选中 ({selectedMessages.length})
          </button>
          <button
            onClick={exportAllMessages}
            disabled={messages.length === 0}
            style={{
              padding: '4px 8px',
              backgroundColor: messages.length ? 'var(--interactive-success)' : 'var(--background-modifier-border)',
              color: messages.length ? 'white' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '4px',
              cursor: messages.length ? 'pointer' : 'not-allowed',
              fontSize: '12px'
            }}
          >
            导出全部
          </button>
        </div>
      </div>
      
      <div className="inbox-messages" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px'
      }}>
        {messages.length === 0 ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}>
            收藏箱中没有消息。
            <br />
            在聊天中点击"添加到收藏"来收藏消息。
          </div>
        ) : (
          messages.map(message => (
            <div 
              key={message.id}
              className="inbox-message-card"
              style={{
                padding: '12px',
                backgroundColor: selectedMessages.includes(message.id) 
                  ? 'var(--background-modifier-hover)'
                  : 'var(--background-secondary)',
                borderRadius: '8px',
                marginBottom: '12px',
                border: `1px solid ${selectedMessages.includes(message.id) 
                  ? 'var(--interactive-accent)'
                  : 'var(--background-modifier-border)'}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => toggleMessageSelection(message.id)}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '8px'
              }}>
                <div style={{
                  whiteSpace: 'pre-wrap',
                  fontSize: '14px',
                  color: 'var(--text-normal)',
                  flex: 1
                }}>
                  {message.content}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(message.id);
                  }}
                  aria-label="删除收藏"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    marginLeft: '4px',
					marginRight: '-8px',
                    fontSize: '14px',
                    borderRadius: '4px'
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{
                fontSize: '12px',
                color: 'var(--text-muted)'
              }}>
                {new Date(message.timestamp).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
