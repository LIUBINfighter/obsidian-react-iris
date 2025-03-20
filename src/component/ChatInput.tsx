import React, { useRef, useEffect } from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onCancel: () => void;
  isLoading: boolean;
  isStreaming: boolean;
}

/**
 * 聊天输入组件 - 处理用户输入和发送消息
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  onCancel,
  isLoading,
  isStreaming
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isDisabled = isLoading || isStreaming;
  const isEmpty = !value.trim();
  
  // 自动聚焦输入框
  useEffect(() => {
    if (inputRef.current && !isDisabled) {
      inputRef.current.focus();
    }
  }, [isDisabled]);
  
  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isDisabled && !isEmpty) {
        onSend();
      }
    }
  };
  
  return (
    <div className="chat-input-area" style={{
      padding: '12px 16px',
      borderTop: '1px solid var(--background-modifier-border)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <textarea 
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="输入消息，按Enter发送..."
        disabled={isDisabled}
        style={{
          width: '100%',
          minHeight: '60px',
          maxHeight: '120px',
          fontSize: 'inherit',
          fontFamily: 'inherit',
          resize: 'vertical',
          color: 'var(--text-normal)',
          backgroundColor: 'var(--background-primary-alt)',
          border: '1px solid var(--background-modifier-border)',
          borderRadius: '4px',
          padding: '8px 12px',
          opacity: isDisabled ? 0.7 : 1
        }}
      />
      
      {/* 状态和取消按钮 */}
      {isDisabled && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          <span style={{ 
            color: 'var(--text-muted)', 
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center'
          }}>
            {isStreaming ? '正在生成回复...' : '正在思考...'}
          </span>
          <button
            onClick={onCancel}
            style={{
              padding: '6px 12px',
              backgroundColor: 'var(--text-error)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            取消响应
          </button>
        </div>
      )}
      
      {/* 发送按钮 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        marginTop: isDisabled ? '4px' : '8px' 
      }}>
        <button
          onClick={onSend}
          disabled={isDisabled || isEmpty}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--interactive-accent)',
            color: 'var(--text-on-accent)',
            border: 'none',
            borderRadius: '4px',
            cursor: (isDisabled || isEmpty) ? 'not-allowed' : 'pointer',
            opacity: (isDisabled || isEmpty) ? 0.7 : 1
          }}
        >
          {isLoading ? '思考中...' : isStreaming ? '生成中...' : '发送'}
        </button>
      </div>
    </div>
  );
};
