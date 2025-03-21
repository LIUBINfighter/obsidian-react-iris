import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { App } from 'obsidian';
import { InboxComponent } from './sidebar/Inbox';
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

interface SidebarProps {
  app: App;
  visible: boolean;
  plugin?: ReactIris;
}

// 更新forwardRef类型，增加切换折叠状态方法
export const SidebarComponent = forwardRef<{
  addToFavorites: (message: Message, sessionId?: string) => void, 
  removeFromFavorites: (messageId: string) => void
}, SidebarProps>(
  ({ app, visible, plugin }, ref) => {
    const [favoriteMessages, setFavoriteMessages] = useState<FavoriteItem[]>([]);
    
    // 从文件加载收藏消息
    useEffect(() => {
      // 迁移旧数据并加载新数据
      const initializeFavorites = async () => {
        await migrateFromLocalStorage(app);
        const favorites = await loadFavorites(app);
        setFavoriteMessages(favorites);
      };
      
      initializeFavorites();
    }, [app]);
    
    // 添加消息到收藏
    const handleAddToFavorites = async (message: Message, sessionId?: string) => {
      try {
        const updatedFavorites = await addToFavorites(app, message, sessionId);
        setFavoriteMessages(updatedFavorites);
      } catch (error) {
        console.error('添加消息到收藏失败:', error);
      }
    };
    
    // 从收藏中移除消息
    const handleRemoveFromFavorites = async (messageId: string) => {
      try {
        const updatedFavorites = await removeFromFavorites(app, messageId);
        setFavoriteMessages(updatedFavorites);
      } catch (error) {
        console.error('从收藏中移除消息失败:', error);
      }
    };
    
    // 切换消息折叠状态
    const handleToggleFold = async (messageId: string, folded: boolean) => {
      try {
        const updatedFavorites = await updateFoldState(app, messageId, folded);
        setFavoriteMessages(updatedFavorites);
      } catch (error) {
        console.error('更新折叠状态失败:', error);
      }
    };

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      addToFavorites: handleAddToFavorites,
      removeFromFavorites: handleRemoveFromFavorites
    }), [app]);

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
        <InboxComponent 
          messages={favoriteMessages} 
          onRemove={handleRemoveFromFavorites}
          onToggleFold={handleToggleFold}
          app={app}
          plugin={plugin}
        />
      </div>
    );
  }
);
