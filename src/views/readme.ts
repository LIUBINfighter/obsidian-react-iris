import { ItemView, WorkspaceLeaf } from 'obsidian';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ExampleReactComponent } from '../component/ExampleComponent';

// ReadMe视图实现
export class ReadMeView extends ItemView {
  root: Root | null = null;
  isComponentVisible: boolean = true; // 控制组件是否显示的状态
  reactContainer: HTMLElement | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
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
    console.log("合并的ReadMe视图 onOpen 被调用");
    
    // 添加ReadMe部分
    const readmeSection = container.createEl("div", { cls: "readme-section" });
    readmeSection.createEl("h1", { text: "React Iris Plugin ReadMe" });
    readmeSection.createEl("p", { text: "这是一个展示如何在Obsidian中使用React的插件示例。" });
    
    // 添加一个切换按钮
    const toggleButton = readmeSection.createEl("button", {
      text: this.isComponentVisible ? "隐藏React组件" : "显示React组件",
      cls: "toggle-react-button",
      attr: {
        style: "padding: 8px 16px; background-color: var(--interactive-accent); color: var(--text-on-accent); border: none; border-radius: 4px; cursor: pointer; margin-top: 10px; margin-bottom: 20px;"
      }
    });
    
    toggleButton.addEventListener("click", () => {
      this.isComponentVisible = !this.isComponentVisible;
      toggleButton.textContent = this.isComponentVisible ? "隐藏React组件" : "显示React组件";
      this.renderReactComponent(container as HTMLElement);
    });
    
    // 创建React部分的容器，稍后可能会显示或隐藏
    const reactSection = container.createEl("div", { 
      cls: "react-section",
      attr: { style: "margin-top: 20px;" }
    });
    
    // 渲染React组件（初始状态）
    this.renderReactComponent(container as HTMLElement);
  }
  
  // 根据状态渲染或隐藏React组件
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
    
    if (this.isComponentVisible) {
      try {
        // 显示组件标题
        const reactHeader = reactSection.createEl("h2", { text: "React 组件演示" });
        
        // 卸载现有的React根节点（如果存在）
        if (this.root) {
          this.root.unmount();
          this.root = null;
        }
        
        // 创建新的React容器
        this.reactContainer = reactSection.createEl("div", { 
          cls: "react-container",
          attr: { style: "padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin-top: 10px;" }
        });
        
        console.log("React 容器已创建:", this.reactContainer);
        
        // 创建新的React根并渲染组件
        this.root = createRoot(this.reactContainer);
        console.log("React root 已创建");
        
        this.root.render(
          React.createElement(ExampleReactComponent, { name: "Obsidian用户" })
        );
        console.log("React组件已渲染");
      } catch (error) {
        console.error("渲染React组件时出错:", error);
        reactSection.createEl("div", {
          text: "React组件加载失败: " + error.message,
          attr: { style: "color: red; padding: 20px;" }
        });
      }
    } else {
      // 如果不可见，卸载React组件并显示提示信息
      if (this.root) {
        this.root.unmount();
        this.root = null;
        this.reactContainer = null;
      }
      reactSection.createEl("p", { 
        text: "React组件当前已隐藏，点击上方按钮可以显示组件。",
        attr: { style: "color: var(--text-muted); font-style: italic; padding: 20px;" }
      });
    }
  }

  async onClose() {
    console.log("合并的ReadMe视图正在关闭");
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
