import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatHeader } from '../ChatHeader';
import { AIServiceType } from '../../services/AIServiceFactory';

describe('ChatHeader', () => {
  const defaultProps = {
    title: '测试会话',
    serviceType: 'ollama' as AIServiceType,  // 修复类型
    leftSidebarVisible: false,
    sidebarVisible: false,
    toggleLeftSidebar: jest.fn(),
    toggleSidebar: jest.fn(),
    toggleService: jest.fn(),
    isLoading: false,
    isStreaming: false
  };

  test('renders correctly', () => {
    render(<ChatHeader {...defaultProps} />);
    expect(screen.getByText('测试会话')).toBeInTheDocument();
  });

  test('calls toggle functions when buttons are clicked', () => {
    render(<ChatHeader {...defaultProps} />);
    
    // 点击侧边栏切换按钮
    const sidebarButton = screen.getByTitle('切换左侧边栏');
    fireEvent.click(sidebarButton);
    
    expect(defaultProps.toggleLeftSidebar).toHaveBeenCalled();
  });
});
