import { ItemView, WorkspaceLeaf } from 'obsidian';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ExampleReactComponent } from '../component/Example';
import { EditorComponent } from '../component/MarkdownEditor';

// 定义选项卡类型
enum TabType {
  EXAMPLE = 'example',
  EDITOR = 'editor'
}

// ReadMe视图实现
export class ReadMeView extends ItemView {
  root: Root | null = null;
  activeTab: TabType = TabType.EXAMPLE; // 默认显示Example选项卡
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
        'data-tab': TabType.EXAMPLE
      }
    });
    
    const editorTab = tabsContainer.createEl("button", {
      text: "编辑器",
      cls: `tab-button ${this.activeTab === TabType.EDITOR ? 'active' : ''}`,
      attr: {
        'data-tab': TabType.EDITOR
      }
    });
    
    // 添加选项卡点击事件
    exampleTab.addEventListener("click", () => {
      this.setActiveTab(TabType.EXAMPLE);
      this.updateTabs(exampleTab, editorTab);
      this.renderReactComponent(container as HTMLElement);
    });
    
    editorTab.addEventListener("click", () => {
      this.setActiveTab(TabType.EDITOR);
      this.updateTabs(editorTab, exampleTab);
      this.renderReactComponent(container as HTMLElement);
    });
    
    // readmeSection.createEl("hr"); // 无需分割线
    
    // 创建React部分的容器
    const reactSection = container.createEl("div", { 
      cls: "react-section",
      attr: { style: "margin-top: 20px;" }
    });
    
    // 渲染当前选中的React组件
    this.renderReactComponent(container as HTMLElement);
  }
  
  // 更新选项卡样式
  updateTabs(activeTab: HTMLElement, inactiveTab: HTMLElement) {
    activeTab.addClass('active');
    inactiveTab.removeClass('active');
  }
  
  // 设置当前活动选项卡
  setActiveTab(tab: TabType) {
    this.activeTab = tab;
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
      // 显示组件标题
      let componentTitle = "";
      
      switch (this.activeTab) {
        case TabType.EXAMPLE:
          componentTitle = "React 组件示例";
          break;
        case TabType.EDITOR:
          componentTitle = "React 编辑器组件";
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
        attr: { style: "padding: 20px; border: 1px solid var(--background-modifier-border); border-radius: 5px; margin-top: 10px;" }
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
      } else {
        this.root.render(
          React.createElement(EditorComponent, { initialText: "# 开始编辑\n\n在这里输入Markdown文本..." })
        );
        console.log("Editor组件已渲染");
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
