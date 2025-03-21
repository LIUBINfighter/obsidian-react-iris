import { ItemView, WorkspaceLeaf } from 'obsidian';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
// 仅保留设置组件的导入
import { SettingComponent } from '../component/Setting';
import ReactIris from '../main';

// 修改选项卡类型
enum TabType {
  INSTRUCTIONS = 'instructions', // 将EXAMPLE改为INSTRUCTIONS
  SETTINGS = 'settings'
}

// ReadMe视图实现
export class ReadMeView extends ItemView {
  root: Root | null = null;
  activeTab: TabType = TabType.INSTRUCTIONS; // 默认显示使用说明选项卡
  reactContainer: HTMLElement | null = null;
  plugin: ReactIris | null = null;

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
    
    // 创建使用说明选项卡按钮
    const instructionsTab = tabsContainer.createEl("button", {
      text: "使用说明",
      cls: `tab-button ${this.activeTab === TabType.INSTRUCTIONS ? 'active' : ''}`,
      attr: {
        'data-tab': TabType.INSTRUCTIONS,
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
    
    // 添加选项卡点击事件
    instructionsTab.addEventListener("click", () => {
      this.setActiveTab(TabType.INSTRUCTIONS);
      this.updateTabs(instructionsTab, [settingsTab]);
      this.renderContent(container as HTMLElement);
    });
    
    // 设置选项卡点击事件
    settingsTab.addEventListener("click", () => {
      this.setActiveTab(TabType.SETTINGS);
      this.updateTabs(settingsTab, [instructionsTab]);
      this.renderContent(container as HTMLElement);
    });
    
    // 创建内容部分的容器
    const contentSection = container.createEl("div", { 
      cls: "content-section",
      attr: { style: "margin-top: 20px;" }
    });
    
    // 渲染当前选中的内容
    this.renderContent(container as HTMLElement);
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
  
  // 重命名方法，从renderReactComponent改为renderContent
  renderContent(container: Element) {
    // 将Element转换为HTMLElement
    const containerEl = container as HTMLElement;
    
    // 获取或创建内容部分
    let contentSection = containerEl.querySelector(".content-section");
    if (!contentSection) {
      contentSection = containerEl.createEl("div", { 
        cls: "content-section",
        attr: { style: "margin-top: 20px;" }
      });
    }
    
    // 清空当前内容
    contentSection.empty();
    
    try {
      // 显示组件标题
      let contentTitle = "";
      
      switch (this.activeTab) {
        case TabType.INSTRUCTIONS:
          contentTitle = "使用说明";
          break;
        case TabType.SETTINGS:
          contentTitle = "插件设置";
          break;
      }
      
      const contentHeader = contentSection.createEl("h2", { text: contentTitle });
      
      // 卸载现有的React根节点（如果存在）
      if (this.root) {
        this.root.unmount();
        this.root = null;
      }
      
      if (this.activeTab === TabType.INSTRUCTIONS) {
        // 使用说明选项卡，显示纯文本内容而不是React组件
        const instructionsContainer = contentSection.createEl("div", {
          cls: "instructions-container",
          attr: { 
            style: "padding: 20px; border: 1px solid var(--background-modifier-border); border-radius: 5px; margin-top: 10px;" 
          }
        });
        
        // 添加使用说明内容
        instructionsContainer.createEl("h3", { text: "欢迎使用 React Iris 插件" });
        
        const featuresList = instructionsContainer.createEl("ul");
        featuresList.createEl("li", { text: "使用侧边栏中的新芽图标或命令面板打开聊天助手" });
        featuresList.createEl("li", { text: "在聊天界面中与AI进行对话" });
        featuresList.createEl("li", { text: "可以创建和管理多个对话会话" });
        featuresList.createEl("li", { text: "支持将重要消息保存到收藏夹" });
        
        instructionsContainer.createEl("p", { 
          text: "在设置选项卡中可以配置AI服务的相关参数，如API密钥、模型名称等。",
          attr: { style: "margin-top: 15px;" }
        });
        
        console.log("使用说明内容已渲染");
      } else if (this.activeTab === TabType.SETTINGS) {
        // 创建React容器用于设置组件
        this.reactContainer = contentSection.createEl("div", { 
          cls: "react-container",
          attr: { 
            style: "padding: 20px; border: 1px solid var(--background-modifier-border); border-radius: 5px; margin-top: 10px;" 
          }
        });
        
        console.log("React 容器已创建:", this.reactContainer);
        
        // 创建新的React根并渲染设置组件
        this.root = createRoot(this.reactContainer);
        console.log("React root 已创建");
        
        // 渲染设置组件
        this.root.render(
          React.createElement(SettingComponent, { 
            app: this.app,
            plugin: this.plugin
          })
        );
        console.log("Setting组件已渲染");
      }
    } catch (error) {
      console.error("渲染内容时出错:", error);
      contentSection.createEl("div", {
        text: "内容加载失败: " + error.message,
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
