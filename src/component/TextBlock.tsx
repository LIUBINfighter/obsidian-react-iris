import React from 'react';
import { MessageSegment } from '../utils/messageProcessorUtils';

interface TextBlockProps {
  segment: MessageSegment;
  onAddToInbox: (segment: MessageSegment) => void;
}

export const TextBlock: React.FC<TextBlockProps> = ({ segment, onAddToInbox }) => {
  // 检查内容是否够长，若够长则显示收藏按钮
  const isLongEnough = segment.content.length > 10;
  
  return (
    <div className="text-block" style={{
      position: 'relative',
      marginBottom: '12px',
      backgroundColor: 'var(--background-secondary)',
      padding: '12px',
      borderRadius: '8px',
      color: 'var(--text-normal)',
      whiteSpace: 'pre-wrap'
    }}>
      {segment.content}
      
      {isLongEnough && (
        <div 
          className="text-block-actions"
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            opacity: 0,
            transition: 'opacity 0.2s ease',
            backgroundColor: 'var(--background-secondary-alt)',
            borderRadius: '4px',
            padding: '2px'
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.opacity = '0';
          }}
        >
          <button
            onClick={() => onAddToInbox(segment)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-accent)',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '2px 6px',
              borderRadius: '4px'
            }}
            aria-label="添加到收藏"
            title="收藏这个段落"
          >
            <span>★</span>
          </button>
        </div>
      )}
    </div>
  );
};
