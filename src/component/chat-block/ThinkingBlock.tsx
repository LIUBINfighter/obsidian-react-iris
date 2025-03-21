import React, { useState } from 'react';
import { MessageSegment } from '../utils/messageProcessorUtils';

interface ThinkingBlockProps {
  segment: MessageSegment;
  onAddToInbox: (segment: MessageSegment) => void;
}

export const ThinkingBlock: React.FC<ThinkingBlockProps> = ({ segment, onAddToInbox }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="thinking-block" style={{
      marginBottom: '12px',
      backgroundColor: 'var(--background-secondary)',
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid var(--background-modifier-border)'
    }}>
      <div 
        className="thinking-header" 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '8px 12px',
          backgroundColor: 'var(--background-secondary-alt)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          color: 'var(--text-muted)',
          fontWeight: 500
        }}>
          <span style={{ marginRight: '8px' }}>🤔</span>
          思考过程
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToInbox(segment);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-accent)',
              fontSize: '14px',
              cursor: 'pointer',
              marginRight: '8px',
              padding: '2px 6px',
              borderRadius: '4px'
            }}
            aria-label="添加到收藏"
          >
            <span>★</span>
          </button>
          <span>{isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>
      
      {isExpanded && (
        <div 
          className="thinking-content"
          style={{
            padding: '12px',
            maxHeight: '400px',
            overflowY: 'auto',
            backgroundColor: 'var(--background-primary)',
            color: 'var(--text-normal)',
            whiteSpace: 'pre-wrap',
            fontSize: '14px',
            fontFamily: 'var(--font-monospace)',
            lineHeight: 1.5
          }}
        >
          {segment.content}
        </div>
      )}
    </div>
  );
};
