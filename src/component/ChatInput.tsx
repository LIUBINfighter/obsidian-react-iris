import React, { useRef, useEffect, useState } from 'react';
import { actionManager } from '../actions';
import { CommandPosition } from '../actions/ActionTypes';
import { App } from 'obsidian';
import ReactIris from '../main';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onCancel: () => void;
  onExecuteCommand: (command: string) => void;
  isLoading: boolean;
  isStreaming: boolean;
  app: App;
  plugin?: ReactIris;
}

/**
 * 聊天输入组件 - 处理用户输入和发送消息
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  onCancel,
  onExecuteCommand,
  isLoading,
  isStreaming,
  app,
  plugin
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isDisabled = isLoading || isStreaming;
  const isEmpty = !value.trim();
  
  // 添加状态跟踪命令
  const [commands, setCommands] = useState<CommandPosition[]>([]);
  
  // 自动聚焦输入框
  useEffect(() => {
    if (inputRef.current && !isDisabled) {
      inputRef.current.focus();
    }
  }, [isDisabled]);
  
  // 检测输入中的命令
  useEffect(() => {
    // 解析命令
    const detectedCommands = actionManager.parseCommands(value);
    setCommands(detectedCommands);
  }, [value]);
  
  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      // 如果有命令，优先执行命令而不是发送消息
      if (commands.length > 0) {
        const command = commands[0].prefix;
        onExecuteCommand(command);
        return;
      }
      
      if (!isDisabled && !isEmpty) {
        onSend();
      }
    }
  };
  
  // 渲染高亮文本
  const renderHighlightedText = () => {
    if (commands.length === 0) return null;
    
    const textSegments = [];
    let lastIndex = 0;
    
    // 按顺序处理每个命令
    commands.forEach(cmd => {
      // 添加命令前的文本
      if (cmd.startIndex > lastIndex) {
        textSegments.push(
          <span key={`text-${lastIndex}`} className="normal-text">
            {value.substring(lastIndex, cmd.startIndex)}
          </span>
        );
      }
      
      // 添加高亮的命令
      textSegments.push(
        <span 
          key={`cmd-${cmd.startIndex}`} 
          className="command-text"
          style={{
            backgroundColor: 'var(--interactive-accent)',
            color: 'var(--text-on-accent)',
            padding: '0 4px',
            borderRadius: '4px',
            fontWeight: 'bold'
          }}
        >
          {value.substring(cmd.startIndex, cmd.endIndex)}
        </span>
      );
      
      lastIndex = cmd.endIndex;
    });
    
    // 添加最后一个命令后的文本
    if (lastIndex < value.length) {
      textSegments.push(
        <span key={`text-${lastIndex}`} className="normal-text">
          {value.substring(lastIndex)}
        </span>
      );
    }
    
    return (
      <div 
        className="highlighted-input"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          padding: '8px 12px',
          pointerEvents: 'none',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          color: 'transparent',
          backgroundColor: 'transparent'
        }}
      >
        {textSegments}
      </div>
    );
  };
  
  // 执行按钮
  const renderExecuteButton = () => {
    if (commands.length === 0) return null;
    
    const command = commands[0];
    const action = actionManager.getAction(command.prefix);
    
    if (!action) return null;
    
    return (
      <button
        onClick={() => onExecuteCommand(command.prefix)}
        className="execute-command-button"
        title={action.description}
        style={{
          position: 'absolute',
          right: '12px',
          bottom: '12px',
          backgroundColor: 'var(--interactive-success)',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '12px',
          cursor: 'pointer',
          zIndex: 2
        }}
      >
        执行{action.name}
      </button>
    );
  };
  
  return (
    <div className="chat-input-area" style={{
      padding: '12px 16px',
      borderTop: '1px solid var(--background-modifier-border)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ position: 'relative' }}>
        <textarea 
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息，按Enter发送... 试试 @make-title 生成对话标题"
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
            opacity: isDisabled ? 0.7 : 1,
            position: 'relative',
            zIndex: 1
          }}
        />
        {renderHighlightedText()}
        {renderExecuteButton()}
      </div>
      
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
