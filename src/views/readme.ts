import { ItemView, WorkspaceLeaf } from 'obsidian';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
// 仅保留设置组件的导入
import { SettingComponent } from '../component/Setting';
import ReactIris from '../main';

// 修改选项卡类型
enum TabType {
  INSTRUCTIONS = 'instructions',
  SETTINGS = 'settings'
}

// ReadMe视图实现
export class ReadMeView extends ItemView {
  root: Root | null = null;
  activeTab: TabType = TabType.INSTRUCTIONS;
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
    return "Iris ReadMe & Docs";
  }
  getIcon(): string {
	return 'info';
  }
  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    console.log("ReadMe视图 onOpen 被调用");
    
    // 添加ReadMe部分
    const readmeSection = container.createEl("div", { cls: "readme-section" });
    readmeSection.createEl("h1", { text: "React Iris Plugin ReadMe" });
    
    // 创建内容部分的容器
    const contentSection = container.createEl("div", { 
      cls: "content-section",
      attr: { style: "margin-top: 20px;" }
    });
    
//     // 渲染当前选中的内容
//     this.renderContent(container as HTMLElement);
//   }
  
//   // 更新选项卡样式，修改为接受多个非活动选项卡
//   updateTabs(activeTab: HTMLElement, inactiveTabs: HTMLElement[]) {
//     activeTab.addClass('active');
//     inactiveTabs.forEach(tab => tab.removeClass('active'));
//   }
  
//   // 设置当前活动选项卡
//   setActiveTab(tab: TabType) {
//     this.activeTab = tab;
//   }
  
//   // 重命名方法，从renderReactComponent改为renderContent
//   renderContent(container: Element) {
//     // 将Element转换为HTMLElement
//     const containerEl = container as HTMLElement;
    
//     // 获取或创建内容部分
//     let contentSection = containerEl.querySelector(".content-section");
//     if (!contentSection) {
//       contentSection = containerEl.createEl("div", { 
//         cls: "content-section",
//         attr: { style: "margin-top: 20px;" }
//       });
//     }
    
//     // 清空当前内容
//     contentSection.empty();
    
    try {
      // 卸载现有的React根节点（如果存在）
      if (this.root) {
        this.root.unmount();
        this.root = null;
      }
      
      if (false) {
      } else if (true) {
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
