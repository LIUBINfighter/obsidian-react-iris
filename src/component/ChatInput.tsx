import React, { useRef, useEffect, useState } from 'react';
import { App, TFile, setIcon } from 'obsidian';
import { ImageAttachmentSelector } from './modal/ImageAttachmentSelector';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onCancel: () => void;
  isLoading: boolean;
  isStreaming: boolean;
  app: App;
  onImageSelected?: (base64: string, file: TFile) => void;
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
  isStreaming,
  app,
  onImageSelected
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isDisabled = isLoading || isStreaming;
  const isEmpty = !value.trim();
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{base64: string, file: TFile} | null>(null);
  
  // 图标引用
  const imageIconRef = useRef<HTMLSpanElement>(null);
  
  // 自动聚焦输入框
  useEffect(() => {
    if (inputRef.current && !isDisabled) {
      inputRef.current.focus();
    }
  }, [isDisabled]);
  
  // 设置图标
  useEffect(() => {
    if (imageIconRef.current) {
      setIcon(imageIconRef.current, 'image');
    }
  }, []);
  
  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isDisabled && !isEmpty) {
        onSend();
      }
    }
  };

  // 处理图片选择
  const handleImageSelect = (base64: string, file: TFile) => {
    setSelectedImage({base64, file});
    if (onImageSelected) {
      onImageSelected(base64, file);
    }
  };

  // 处理图片删除
  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  // 打开图片选择器
  const openImageSelector = () => {
    setIsImageSelectorOpen(true);
  };
  
  return (
    <div className="chat-input-area" style={{
      padding: '12px 16px',
      borderTop: '1px solid var(--background-modifier-border)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 图片预览区域 */}
      {selectedImage && (
        <div style={{
          marginBottom: '10px',
          padding: '8px',
          backgroundColor: 'var(--background-secondary)',
          borderRadius: '4px',
          position: 'relative'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '5px'
          }}>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              已选择图片: {selectedImage.file.name}
            </span>
            <button 
              onClick={handleRemoveImage}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-error)',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              移除
            </button>
          </div>
          <img 
            src={selectedImage.base64} 
            alt="Selected" 
            style={{
              maxWidth: '100%',
              maxHeight: '200px',
              objectFit: 'contain',
              borderRadius: '4px'
            }} 
          />
        </div>
      )}
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
      
      {/* 图片选择器按钮 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-start',
        marginTop: '8px' 
      }}>
        <button
          onClick={openImageSelector}
          disabled={isDisabled}
          style={{
            padding: '6px 12px',
            backgroundColor: 'var(--background-modifier-border)',
            color: 'var(--text-normal)',
            border: 'none',
            borderRadius: '4px',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            opacity: isDisabled ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <span 
            ref={imageIconRef} 
            style={{ 
              fontSize: '16px', 
              display: 'flex', 
              alignItems: 'center',
              position: 'relative',
              top: '1px'
            }}
          ></span>
          添加图片
        </button>
      </div>
      
      {/* 图片选择器模态框 */}
      {isImageSelectorOpen && (
        <ImageAttachmentSelector
          app={app}
          onImageSelected={handleImageSelect}
          isOpen={isImageSelectorOpen}
          onClose={() => setIsImageSelectorOpen(false)}
        />
      )}
      
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
