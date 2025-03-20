import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { App } from 'obsidian';
import { InboxComponent } from './Inbox';
import { Message } from './Chat';
import ReactIris from '../main';
import { saveMessageToFavorites, loadFavoritesFromStorage } from '../utils/messageUtils';

interface SidebarProps {
  app: App;
  visible: boolean;
  plugin?: ReactIris;
}

// 使用forwardRef包装组件，确保ref正确传递
export const SidebarComponent = forwardRef<{
  addToFavorites: (message: Message) => void, 
  removeFromFavorites: (messageId: string) => void
}, SidebarProps>(
  ({ app, visible, plugin }, ref) => {
    const [favoriteMessages, setFavoriteMessages] = useState<Message[]>([]);
    
    // 从localStorage加载收藏消息
    useEffect(() => {
      loadFavoritesFromStorage().then(favorites => {
        if (favorites && favorites.length > 0) {
          setFavoriteMessages(favorites);
        }
      });
    }, []);
    
    // 保存收藏消息到localStorage
    const saveFavorites = (messages: Message[]) => {
      saveMessageToFavorites(messages).catch(error => {
        console.error('保存收藏消息失败:', error);
      });
    };
    
    // 添加消息到收藏
    const addToFavorites = (message: Message) => {
      // 检查消息是否已在收藏中
      if (!favoriteMessages.some(msg => msg.id === message.id)) {
        const updatedFavorites = [...favoriteMessages, message];
        setFavoriteMessages(updatedFavorites);
        saveFavorites(updatedFavorites);
      }
    };
    
    // 从收藏中移除消息
    const removeFromFavorites = (messageId: string) => {
      const updatedFavorites = favoriteMessages.filter(msg => msg.id !== messageId);
      setFavoriteMessages(updatedFavorites);
      saveFavorites(updatedFavorites);
    };

    // 正确使用useImperativeHandle暴露方法
    useImperativeHandle(ref, () => ({
      addToFavorites,
      removeFromFavorites
    }), [favoriteMessages]);

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
          onRemove={removeFromFavorites}
          app={app}
          plugin={plugin}
        />
      </div>
    );
  }
);
