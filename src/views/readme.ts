import { ItemView, WorkspaceLeaf } from 'obsidian';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ExampleReactComponent } from '../component/Example';
import { SettingComponent } from '../component/Setting';
import ReactIris from '../main';

// 定义选项卡类型
enum TabType {
  EXAMPLE = 'example',
  EDITOR = 'editor',
  SETTINGS = 'settings'
  // 移除 CHAT 选项卡
}

// ReadMe视图实现
export class ReadMeView extends ItemView {
  root: Root | null = null;
  activeTab: TabType = TabType.EXAMPLE; // 默认显示Example选项卡
  reactContainer: HTMLElement | null = null;
  plugin: ReactIris | null = null; // 添加插件实例引用

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
    

    // 设置选项卡按钮
    const settingsTab = tabsContainer.createEl("button", {
      text: "设置",
      cls: `tab-button ${this.activeTab === TabType.SETTINGS ? 'active' : ''}`,
      attr: {
        'data-tab': TabType.SETTINGS,
        'style': 'margin-right: 10px;'
      }
    });
    
    // 移除聊天选项卡按钮
    
    // 添加选项卡点击事件
    exampleTab.addEventListener("click", () => {
      this.setActiveTab(TabType.EXAMPLE);
      this.updateTabs(exampleTab, [settingsTab]);
      this.renderReactComponent(container as HTMLElement);
    });
    
    
    // 设置选项卡点击事件
    settingsTab.addEventListener("click", () => {
      this.setActiveTab(TabType.SETTINGS);
      this.updateTabs(settingsTab, [exampleTab]);
      this.renderReactComponent(container as HTMLElement);
    });
    
    // 移除聊天选项卡点击事件
    
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
  
  // 移除聊天相关的方法（toggleSidebar, toggleLeftSidebar, handleAddToInbox, handleSelectSession, handleCreateNewSession）
  
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
      // 显示组件标题
      let componentTitle = "";
      
      switch (this.activeTab) {
        case TabType.EXAMPLE:
          componentTitle = "React 组件示例";
          break;
        case TabType.SETTINGS:
          componentTitle = "React 设置组件";
          break;
      }
      
      const reactHeader = reactSection.createEl("h2", { text: componentTitle });
      
      // 卸载现有的React根节点（如果存在）
      if (this.root) {
        this.root.unmount();
        this.root = null;
      }
      
      // 创建新的React容器
      this.reactContainer = reactSection.createEl("div", { 
        cls: "react-container",
        attr: { 
          style: "padding: 20px; border: 1px solid var(--background-modifier-border); border-radius: 5px; margin-top: 10px;" 
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
      } else if (this.activeTab === TabType.SETTINGS) {
        // 渲染设置组件
        this.root.render(
          React.createElement(SettingComponent, { 
            app: this.app,
            plugin: this.plugin
          })
        );
        console.log("Setting组件已渲染");
      }
      // 移除聊天组件的渲染代码
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
