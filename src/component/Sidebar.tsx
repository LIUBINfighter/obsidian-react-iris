import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { App, setIcon } from 'obsidian';
import { InboxComponent } from './sidebar/Inbox';
import { EmptyTab } from './sidebar/EmptyTab';
import { Message } from './Chat';
import ReactIris from '../main';
import { 
  loadFavorites, 
  saveFavorites, 
  addToFavorites, 
  removeFromFavorites, 
  updateFoldState, 
  FavoriteItem,
  migrateFromLocalStorage 
} from '../utils/favoriteUtils';
import { Header, createIconButtonStyle } from './common/Header';

interface SidebarProps {
  app: App;
  visible: boolean;
  plugin?: ReactIris;
  toggleSidebar: () => void;  // 替换 onClose 为 toggleSidebar
  sidebarVisible: boolean;    // 添加可见状态
}

export const SidebarComponent = forwardRef<{
  addToFavorites: (message: Message, sessionId?: string) => void, 
  removeFromFavorites: (messageId: string) => void
}, SidebarProps>(
  ({ app, visible, plugin, toggleSidebar, sidebarVisible }, ref) => {
    const [activeTab, setActiveTab] = useState<'inbox' | 'empty'>('inbox');
    const [favoriteMessages, setFavoriteMessages] = useState<FavoriteItem[]>([]);
    const closeIconRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
      if (closeIconRef.current) {
        setIcon(closeIconRef.current, 'sidebar-right'); // 改为使用侧边栏图标
      }
    }, []);

    useEffect(() => {
      const initializeFavorites = async () => {
        await migrateFromLocalStorage(app);
        const favorites = await loadFavorites(app);
        setFavoriteMessages(favorites);
      };
      
      initializeFavorites();
    }, [app]);
    
    const handleAddToFavorites = async (message: Message, sessionId?: string) => {
      try {
        const updatedFavorites = await addToFavorites(app, message, sessionId);
        setFavoriteMessages(updatedFavorites);
      } catch (error) {
        console.error('添加消息到收藏失败:', error);
      }
    };
    
    const handleRemoveFromFavorites = async (messageId: string) => {
      try {
        const updatedFavorites = await removeFromFavorites(app, messageId);
        setFavoriteMessages(updatedFavorites);
      } catch (error) {
        console.error('从收藏中移除消息失败:', error);
      }
    };
    
    const handleToggleFold = async (messageId: string, folded: boolean) => {
      try {
        const updatedFavorites = await updateFoldState(app, messageId, folded);
        setFavoriteMessages(updatedFavorites);
      } catch (error) {
        console.error('更新折叠状态失败:', error);
      }
    };

    useImperativeHandle(ref, () => ({
      addToFavorites: handleAddToFavorites,
      removeFromFavorites: handleRemoveFromFavorites
    }), [app]);

    // 添加选项卡头部渲染函数
    const renderTabHeader = () => (
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--background-modifier-border)',
        // marginBottom: '8px', // 移除这行  // 这里控制选项卡与下面内容的间距
        backgroundColor: 'var(--background-secondary-alt)',
        padding: '0 8px'
      }}>
        <button
          onClick={() => setActiveTab('inbox')}
          style={{
            padding: '0px 16px',
            background: 'none',
            border: 'none',
            borderBottom: `2px solid ${activeTab === 'inbox' ? 'var(--interactive-accent)' : 'transparent'}`,
            color: activeTab === 'inbox' ? 'var(--text-normal)' : 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          收藏夹
        </button>
        <button
          onClick={() => setActiveTab('empty')}
          style={{
            padding: '0px 16px',
            background: 'none',
            border: 'none',
            borderBottom: `2px solid ${activeTab === 'empty' ? 'var(--interactive-accent)' : 'transparent'}`,
            color: activeTab === 'empty' ? 'var(--text-normal)' : 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          空白页
        </button>
      </div>
    );

    if (!visible) return null;
    
    return (
      <div className="sidebar-container" style={{
        width: '300px',
        height: '100%',
        borderLeft: '1px solid var(--background-modifier-border)',
        backgroundColor: 'var(--background-primary)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease'
      }}>
        <Header
          title=""
          rightActions={
            <button
              onClick={toggleSidebar}
              style={createIconButtonStyle(sidebarVisible)}
              title="切换右侧边栏"
            >
              <div 
                ref={closeIconRef}
                style={{ width: '16px', height: '16px' }}
              />
            </button>
          }
          className="sidebar-header"
        />
        
        {renderTabHeader()}
        
        {activeTab === 'inbox' ? (
          <InboxComponent 
            messages={favoriteMessages} 
            onRemove={handleRemoveFromFavorites}
            onToggleFold={handleToggleFold}
            app={app}
            plugin={plugin}
          />
        ) : (
          <EmptyTab app={app} />
        )}
      </div>
    );
  }
);
