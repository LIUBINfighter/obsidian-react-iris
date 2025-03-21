import { ItemView, WorkspaceLeaf } from 'obsidian';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ChatComponent, Message } from '../component/Chat';
import { SidebarComponent } from '../component/Sidebar';
import { LeftSidebarComponent } from '../component/LeftSidebar';
import ReactIris from '../main';

export const CHAT_VIEW_TYPE = 'chat-view';

export class ChatView extends ItemView {
    plugin: ReactIris;
    root: Root | null = null;
    reactContainer: HTMLElement | null = null;
    sidebarVisible: boolean = true; // 侧边栏可见性状态
    leftSidebarVisible: boolean = true; // 左侧边栏可见性状态
    sidebarRef = React.createRef<any>(); // 修改为any类型，以避免TypeScript警告
    currentSessionId: string = 'default'; // 添加当前会话ID

    constructor(leaf: WorkspaceLeaf, plugin: ReactIris) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return CHAT_VIEW_TYPE;
    }

    getDisplayText(): string {
        return '聊天助手';
    }

    getIcon(): string {
        return 'sprout';
    }

    // 切换侧边栏可见性
    toggleSidebar = () => {
        this.sidebarVisible = !this.sidebarVisible;
        // 重新渲染组件以反映侧边栏状态变化
        this.renderReactComponent();
    }
    
    // 切换左侧边栏可见性
    toggleLeftSidebar = () => {
        this.leftSidebarVisible = !this.leftSidebarVisible;
        // 重新渲染组件以反映侧边栏状态变化
        this.renderReactComponent();
    }
    
    // 添加或删除消息到收藏，确保消息正确传递给Sidebar组件
    handleAddToInbox = (message: Message & { action?: 'remove' }) => {
        if (this.sidebarRef.current) {
            if (message.action === 'remove') {
                // 如果是移除操作
                this.sidebarRef.current.removeFromFavorites(message.id);
            } else {
                // 如果是添加操作，传递当前会话ID
                this.sidebarRef.current.addToFavorites(message, this.currentSessionId);
            }
        } else {
            console.error("无法访问侧边栏引用，无法更新收藏");
        }
    }

    // 切换会话
    handleSelectSession = (sessionId: string) => {
        console.log(`切换到会话: ${sessionId}`);
        this.currentSessionId = sessionId;
        // 重新渲染组件以反映会话变化
        this.renderReactComponent();
    }

    // 创建新会话
    handleCreateNewSession = () => {
        // 生成唯一ID作为新会话ID
        const newSessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        console.log(`创建新会话: ${newSessionId}`);
        this.currentSessionId = newSessionId;
        // 重新渲染组件以反映会话变化
        this.renderReactComponent();
    }

    async onOpen(): Promise<void> {
        const container = this.containerEl.children[1];
        container.empty();
        console.log("聊天视图 onOpen 被调用");
        
        // 渲染React组件
        this.renderReactComponent();
    }
    
    // 渲染React组件
    renderReactComponent() {
        const container = this.containerEl.children[1];
        
        try {
            // 卸载现有的React根节点（如果存在）
            if (this.root) {
                this.root.unmount();
                this.root = null;
            }
            
            // 创建新的React容器，调整样式以填满整个工作区
            container.empty();
            
            // 添加填充容器的样式到父容器
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.height = '100%';
            container.style.overflow = 'hidden';
            
            this.reactContainer = container.createEl("div", { 
                cls: "react-container",
                attr: { 
                    style: "display: flex; flex: 1; border: 1px solid var(--background-modifier-border); border-radius: 5px; height: 100%; overflow: hidden;" 
                }
            });
            
            console.log("React 容器已创建:", this.reactContainer);
            
            // 创建新的React根并渲染组件
            this.root = createRoot(this.reactContainer);
            console.log("React root 已创建");
            
            // 渲染聊天界面，包括左侧边栏、聊天组件和右侧边栏
            this.root.render(
                React.createElement('div', { 
                    style: { 
                        display: 'flex', 
                        width: '100%', 
                        height: '100%' 
                    } 
                }, [
                    // 左侧边栏组件，传递会话相关的props
                    React.createElement(LeftSidebarComponent, {
                        key: 'left-sidebar',
                        app: this.app,
                        visible: this.leftSidebarVisible,
                        plugin: this.plugin,
                        currentSessionId: this.currentSessionId,
                        onSelectSession: this.handleSelectSession,
                        onCreateNewSession: this.handleCreateNewSession
                    }),
                    
                    // 聊天主界面
                    React.createElement('div', { 
                        key: 'chat-main',
                        style: { 
                            flex: 1,
                            height: '100%',
                            overflow: 'hidden'
                        } 
                    }, 
                        React.createElement(ChatComponent, {
                            app: this.app,
                            onAddToInbox: this.handleAddToInbox,
                            sidebarVisible: this.sidebarVisible,
                            toggleSidebar: this.toggleSidebar,
                            leftSidebarVisible: this.leftSidebarVisible,
                            toggleLeftSidebar: this.toggleLeftSidebar,
                            plugin: this.plugin,
                            sessionId: this.currentSessionId // 传递当前会话ID
                        })
                    ),
                    
                    // 右侧边栏组件
                    React.createElement(SidebarComponent, {
                        key: 'chat-sidebar',
                        app: this.app,
                        visible: this.sidebarVisible,
                        ref: this.sidebarRef,
                        plugin: this.plugin
                    })
                ])
            );
            console.log("Chat组件已渲染，会话ID:", this.currentSessionId);
        } catch (error) {
            console.error("渲染React组件时出错:", error);
            container.createEl("div", {
                text: "React组件加载失败: " + error.message,
                attr: { style: "color: red; padding: 20px;" }
            });
        }
    }

    async onClose() {
        console.log("聊天视图正在关闭");
        // 清理React根节点
        if (this.root) {
            try {
                this.root.unmount();
                console.log("React root 已卸载");
            } catch (error) {
                console.error("卸载React组件时出错:", error);
            }
            this.root = null;
            this.reactContainer = null;
        }
    }
}
