import React, { ReactNode } from 'react';

interface HeaderProps {
  title: string;                // 标题
  leftActions?: ReactNode;      // 左侧操作按钮区域
  rightActions?: ReactNode;     // 右侧操作按钮区域
  centerContent?: ReactNode;    // 中间内容（可选）
  className?: string;           // 额外的CSS类名
}

/**
 * 通用头部组件 - 用于统一各处头部样式
 */
export const Header: React.FC<HeaderProps> = ({
  title,
  leftActions,
  rightActions,
  centerContent,
  className = ''
}) => {
  return (
    <div className={`iris-header ${className}`} style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 16px',
      borderBottom: '1px solid var(--background-modifier-border)',
      backgroundColor: 'var(--background-secondary-alt)',
      minHeight: '48px'
    }}>
      <div className="iris-header-left" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px' 
      }}>
        {leftActions}
        <h3 style={{ 
          margin: 0, 
          fontSize: '16px', 
          fontWeight: 'bold', 
          color: 'var(--text-normal)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {title}
        </h3>
      </div>

      {centerContent && (
        <div className="iris-header-center">
          {centerContent}
        </div>
      )}
      
      <div className="iris-header-right" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px',
        marginLeft: 'auto'
      }}>
        {rightActions}
      </div>
    </div>
  );
};

/**
 * 创建一个图标按钮的通用样式
 */
export const createIconButtonStyle = (isActive: boolean = false) => ({
  background: isActive ? 'var(--interactive-accent)' : 'transparent',
  color: isActive ? 'white' : 'var(--text-normal)',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  width: '28px',
  height: '28px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  transition: 'background-color 0.2s ease'
});
