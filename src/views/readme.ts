import { ItemView, WorkspaceLeaf } from 'obsidian';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ExampleReactComponent } from '../component/Example';
import { EditorComponent } from '../component/MarkdownEditor';
import { SettingComponent } from '../component/Setting';
import { ChatComponent, Message } from '../component/Chat';
import { SidebarComponent } from '../component/Sidebar';
import { LeftSidebarComponent } from '../component/LeftSidebar';
import ReactIris from '../main';

// 定义选项卡类型
enum TabType {
  EXAMPLE = 'example',
  EDITOR = 'editor',
  SETTINGS = 'settings',
  CHAT = 'chat' // 新增聊天选项卡
}

// ReadMe视图实现
export class ReadMeView extends ItemView {
  root: Root | null = null;
  activeTab: TabType = TabType.EXAMPLE; // 默认显示Example选项卡
  reactContainer: HTMLElement | null = null;
  plugin: ReactIris | null = null; // 添加插件实例引用
  sidebarVisible: boolean = true; // 侧边栏可见性状态
  leftSidebarVisible: boolean = true; // 左侧边栏可见性状态
  sidebarRef = React.createRef<any>(); // 修改为any类型，以避免TypeScript警告

  constructor(leaf: WorkspaceLeaf, plugin?: ReactIris) {
    super(leaf);
    this.plugin = plugin || null;
  }

  getViewType(): string {
    return "ReadMe-view";
  }

  getDisplayText(): string {
    return "ReadMe & React View";
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    console.log("ReadMe视图 onOpen 被调用");
    
    // 添加ReadMe部分
    const readmeSection = container.createEl("div", { cls: "readme-section" });
    readmeSection.createEl("h1", { text: "React Iris Plugin ReadMe" });
    readmeSection.createEl("p", { text: "这是一个展示如何在Obsidian中使用React的插件示例。" });
    
    // 创建选项卡容器
    const tabsContainer = readmeSection.createEl("div", { 
      cls: "tabs-container",
      attr: { style: "margin: var(--size-4-6) 0;" }
    });
    
    // 创建选项卡按钮
    const exampleTab = tabsContainer.createEl("button", {
      text: "组件示例",
      cls: `tab-button ${this.activeTab === TabType.EXAMPLE ? 'active' : ''}`,
      attr: {
        'data-tab': TabType.EXAMPLE,
        'style': 'margin-right: 10px;'
      }
    });
    
    const editorTab = tabsContainer.createEl("button", {
      text: "编辑器",
      cls: `tab-button ${this.activeTab === TabType.EDITOR ? 'active' : ''}`,
      attr: {
        'data-tab': TabType.EDITOR,
        'style': 'margin-right: 10px;'
      }
    });
    
    // 新增设置选项卡按钮
    const settingsTab = tabsContainer.createEl("button", {
      text: "设置",
      cls: `tab-button ${this.activeTab === TabType.SETTINGS ? 'active' : ''}`,
      attr: {
        'data-tab': TabType.SETTINGS,
        'style': 'margin-right: 10px;'
      }
    });
    
    // 新增聊天选项卡按钮
    const chatTab = tabsContainer.createEl("button", {
      text: "聊天",
      cls: `tab-button ${this.activeTab === TabType.CHAT ? 'active' : ''}`,
      attr: {
        'data-tab': TabType.CHAT,
        'style': 'margin-right: 10px;'
      }
    });
    
    // 添加选项卡点击事件
    exampleTab.addEventListener("click", () => {
      this.setActiveTab(TabType.EXAMPLE);
      this.updateTabs(exampleTab, [editorTab, settingsTab, chatTab]);
      this.renderReactComponent(container as HTMLElement);
    });
    
    editorTab.addEventListener("click", () => {
      this.setActiveTab(TabType.EDITOR);
      this.updateTabs(editorTab, [exampleTab, settingsTab, chatTab]);
      this.renderReactComponent(container as HTMLElement);
    });
    
    // 新增设置选项卡点击事件
    settingsTab.addEventListener("click", () => {
      this.setActiveTab(TabType.SETTINGS);
      this.updateTabs(settingsTab, [exampleTab, editorTab, chatTab]);
      this.renderReactComponent(container as HTMLElement);
    });
    
    // 新增聊天选项卡点击事件
    chatTab.addEventListener("click", () => {
      this.setActiveTab(TabType.CHAT);
      this.updateTabs(chatTab, [exampleTab, editorTab, settingsTab]);
      this.renderReactComponent(container as HTMLElement);
    });
    
    // 创建React部分的容器
    const reactSection = container.createEl("div", { 
      cls: "react-section",
      attr: { style: "margin-top: 20px;" }
    });
    
    // 渲染当前选中的React组件
    this.renderReactComponent(container as HTMLElement);
  }
  
  // 更新选项卡样式，修改为接受多个非活动选项卡
  updateTabs(activeTab: HTMLElement, inactiveTabs: HTMLElement[]) {
    activeTab.addClass('active');
    inactiveTabs.forEach(tab => tab.removeClass('active'));
  }
  
  // 设置当前活动选项卡
  setActiveTab(tab: TabType) {
    this.activeTab = tab;
  }
  
  // 切换侧边栏可见性
  toggleSidebar = () => {
    this.sidebarVisible = !this.sidebarVisible;
    // 重新渲染组件以反映侧边栏状态变化
    this.renderReactComponent(this.containerEl.children[1] as HTMLElement);
  }
  
  // 切换左侧边栏可见性
  toggleLeftSidebar = () => {
    this.leftSidebarVisible = !this.leftSidebarVisible;
    // 重新渲染组件以反映侧边栏状态变化
    this.renderReactComponent(this.containerEl.children[1] as HTMLElement);
  }
  
  // 添加消息到收藏，确保消息正确传递给Sidebar组件
  handleAddToInbox = (message: Message) => {
    if (this.sidebarRef.current) {
      this.sidebarRef.current.addToFavorites(message);
    } else {
      console.error("无法访问侧边栏引用，无法添加收藏");
    }
  }
  
  // 根据当前选项卡渲染相应的React组件
  renderReactComponent(container: Element) {
    // 将Element转换为HTMLElement
    const containerEl = container as HTMLElement;
    
    // 获取或创建React部分
    let reactSection = containerEl.querySelector(".react-section");
    if (!reactSection) {
      reactSection = containerEl.createEl("div", { 
        cls: "react-section",
        attr: { style: "margin-top: 20px;" }
      });
    }
    
    // 清空当前内容
    reactSection.empty();
    
    try {
      // 显示组件标题，聊天界面不需要标题
      if (this.activeTab !== TabType.CHAT) {
        let componentTitle = "";
        
        switch (this.activeTab) {
          case TabType.EXAMPLE:
            componentTitle = "React 组件示例";
            break;
          case TabType.EDITOR:
            componentTitle = "React 编辑器组件";
            break;
          case TabType.SETTINGS:
            componentTitle = "React 设置组件";
            break;
        }
        
        const reactHeader = reactSection.createEl("h2", { text: componentTitle });
      }
      
      // 卸载现有的React根节点（如果存在）
      if (this.root) {
        this.root.unmount();
        this.root = null;
      }
      
      // 创建新的React容器，聊天界面需要特殊样式
      this.reactContainer = reactSection.createEl("div", { 
        cls: "react-container",
        attr: { 
          style: this.activeTab === TabType.CHAT 
            ? "height: 500px; display: flex; border: 1px solid var(--background-modifier-border); border-radius: 5px;" 
            : "padding: 20px; border: 1px solid var(--background-modifier-border); border-radius: 5px; margin-top: 10px;" 
        }
      });
      
      console.log("React 容器已创建:", this.reactContainer);
      
      // 创建新的React根并渲染组件
      this.root = createRoot(this.reactContainer);
      console.log("React root 已创建");
      
      // 根据当前选项卡渲染不同的组件
      if (this.activeTab === TabType.EXAMPLE) {
        this.root.render(
          React.createElement(ExampleReactComponent, { name: "Obsidian用户" })
        );
        console.log("Example组件已渲染");
      } else if (this.activeTab === TabType.EDITOR) {
        // 创建包含Mermaid图表的示例文本
        const sampleText = `# Markdown编辑器示例

这是一个简单的Markdown编辑器示例，支持Obsidian的渲染功能。

## Mermaid流程图示例

\`\`\`mermaid
graph TD
    A[开始] --> B{是否继续?}
    B -->|是| C[处理任务]
    B -->|否| D[结束流程]
    C --> E[保存结果]
    E --> B
    D --> F[完成]
\`\`\`

## 代码块示例

\`\`\`javascript
// 一个简单的JavaScript函数
function sayHello(name) {
    console.log(\`你好，\${name}！\`);
    return \`欢迎使用Obsidian，\${name}\`;
}
\`\`\`

## 表格示例

| 功能 | 描述 | 支持状态 |
|------|------|---------|
| Markdown | 基本Markdown语法 | ✅ |
| Mermaid | 流程图等图表支持 | ✅ |
| 代码高亮 | 支持多种语言 | ✅ |

可以在编辑模式下修改文本，然后切换回预览模式查看效果。`;

        this.root.render(
          React.createElement(EditorComponent, { 
            initialText: sampleText,
            app: this.app
          })
        );
        console.log("Editor组件已渲染");
      } else if (this.activeTab === TabType.SETTINGS) {
        // 渲染设置组件
        this.root.render(
          React.createElement(SettingComponent, { 
            app: this.app,
            plugin: this.plugin
          })
        );
        console.log("Setting组件已渲染");
      } else if (this.activeTab === TabType.CHAT) {
        // 渲染聊天界面，包括左侧边栏、聊天组件和右侧边栏
        this.root.render(
          React.createElement('div', { 
            style: { 
              display: 'flex', 
              width: '100%', 
              height: '100%' 
            } 
          }, [
            // 左侧边栏组件
            React.createElement(LeftSidebarComponent, {
              key: 'left-sidebar',
              app: this.app,
              visible: this.leftSidebarVisible,
              plugin: this.plugin
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
                plugin: this.plugin
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
        console.log("Chat组件已渲染");
      }
    } catch (error) {
      console.error("渲染React组件时出错:", error);
      reactSection.createEl("div", {
        text: "React组件加载失败: " + error.message,
        attr: { style: "color: red; padding: 20px;" }
      });
    }
  }

  async onClose() {
    console.log("ReadMe视图正在关闭");
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
