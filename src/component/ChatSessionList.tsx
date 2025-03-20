import React, { useState, useEffect } from 'react';
import { App, Notice } from 'obsidian';
import { ChatSession } from './Chat';
import { getAllChatSessionIds, loadChatSessionFromFile, saveChatSessionToFile, deleteChatSession } from '../utils/chatUtils';

interface ChatSessionListProps {
  app: App;
  currentSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onCreateNewSession: () => void;
}

export const ChatSessionList: React.FC<ChatSessionListProps> = ({
  app,
  currentSessionId,
  onSelectSession,
  onCreateNewSession
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // 加载所有会话
  useEffect(() => {
    loadSessions();
  }, [currentSessionId]);

  // 加载会话列表
  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const sessionIds = await getAllChatSessionIds(app);
      
      const sessionObjects = await Promise.all(
        sessionIds.map(async (id) => {
          const session = await loadChatSessionFromFile(app, id);
          return session;
        })
      );
      
      // 过滤掉 null 值并按更新时间降序排序
      const validSessions = sessionObjects
        .filter((session): session is ChatSession => session !== null)
        .sort((a, b) => b.updatedAt - a.updatedAt);
      
      setSessions(validSessions);
    } catch (error) {
      console.error('加载会话列表失败:', error);
      new Notice('加载会话列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 开始编辑会话标题
  const startEditingTitle = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  // 保存会话标题
  const saveSessionTitle = async (session: ChatSession) => {
    if (!editingTitle.trim()) {
      setEditingTitle(session.title);
      setEditingSessionId(null);
      return;
    }
    
    try {
      const updatedSession = { ...session, title: editingTitle };
      await saveChatSessionToFile(app, session.id, updatedSession);
      
      // 更新本地会话列表
      setSessions(prevSessions => 
        prevSessions.map(s => s.id === session.id ? updatedSession : s)
      );
      
      new Notice('会话标题已保存');
    } catch (error) {
      console.error('保存会话标题失败:', error);
      new Notice('保存会话标题失败');
    }
    
    setEditingSessionId(null);
  };

  // 删除会话
  const handleDeleteSession = async (sessionId: string) => {
    if (sessionId === currentSessionId) {
      new Notice('无法删除当前活动会话');
      return;
    }
    
    try {
      await deleteChatSession(app, sessionId);
      
      // 更新本地会话列表
      setSessions(prevSessions => prevSessions.filter(session => session.id !== sessionId));
      
      new Notice('会话已删除');
    } catch (error) {
      console.error('删除会话失败:', error);
      new Notice('删除会话失败');
    }
  };

  // 会话列表为空时的提示
  if (sessions.length === 0 && !isLoading) {
    return (
      <div className="chat-session-list-empty" style={{
        padding: '16px',
        textAlign: 'center',
        color: 'var(--text-muted)'
      }}>
        <p>还没有保存的会话</p>
        <button 
          onClick={onCreateNewSession}
          style={{
            padding: '6px 12px',
            backgroundColor: 'var(--interactive-accent)',
            color: 'var(--text-on-accent)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '8px'
          }}
        >
          创建新对话
        </button>
      </div>
    );
  }

  return (
    <div className="chat-session-list">
      <div className="session-list-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <h4 style={{ margin: 0 }}>对话列表</h4>
        <button 
          onClick={onCreateNewSession}
          title="新建对话"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-accent)',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '4px 8px',
            borderRadius: '4px'
          }}
        >
          +
        </button>
      </div>
      
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
          加载中...
        </div>
      ) : (
        <div className="session-list" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {sessions.map(session => (
            <div 
              key={session.id}
              className={`session-item ${session.id === currentSessionId ? 'active' : ''}`}
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                backgroundColor: session.id === currentSessionId 
                  ? 'var(--interactive-accent)' 
                  : 'var(--background-secondary)',
                color: session.id === currentSessionId 
                  ? 'var(--text-on-accent)' 
                  : 'var(--text-normal)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background-color 0.2s ease'
              }}
            >
              {editingSessionId === session.id ? (
                <input
                  type="text"
                  value={editingTitle}
                  onChange={e => setEditingTitle(e.target.value)}
                  onBlur={() => saveSessionTitle(session)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      saveSessionTitle(session);
                    } else if (e.key === 'Escape') {
                      setEditingSessionId(null);
                    }
                  }}
                  autoFocus
                  style={{
                    backgroundColor: 'var(--background-primary)',
                    color: 'var(--text-normal)',
                    border: '1px solid var(--background-modifier-border)',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    width: '100%',
                    fontSize: '14px'
                  }}
                />
              ) : (
                <div 
                  className="session-title"
                  onClick={() => onSelectSession(session.id)}
                  style={{
                    flex: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontSize: '14px'
                  }}
                >
                  {session.title || `对话 ${session.id}`}
                </div>
              )}
              
              {editingSessionId !== session.id && (
                <div className="session-actions" style={{
                  display: 'flex',
                  gap: '4px'
                }}>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      startEditingTitle(session);
                    }}
                    title="编辑标题"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: session.id === currentSessionId ? 'var(--text-on-accent)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px 4px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  >
                    ✎
                  </button>
                  
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (confirm('确定要删除这个会话吗？此操作不可撤销。')) {
                        handleDeleteSession(session.id);
                      }
                    }}
                    title="删除会话"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: session.id === currentSessionId ? 'var(--text-on-accent)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                    disabled={session.id === currentSessionId}
                  >
                    ×
                  </button>
                </div>
              )}
              
              <div 
                className="session-timestamp" 
                style={{
                  fontSize: '10px',
                  color: session.id === currentSessionId ? 'var(--text-on-accent-muted)' : 'var(--text-muted)',
                  position: 'absolute',
                  bottom: '2px',
                  right: '8px'
                }}
              >
                {new Date(session.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
