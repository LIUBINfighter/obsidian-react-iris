import {App, PluginSettingTab, Setting} from 'obsidian';
import ReactIris from './main';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { SettingComponent } from './component/Setting';

export class ReactIrisSettingTab extends PluginSettingTab {
	plugin: ReactIris;
	private reactRoot: Root | null = null;

	constructor(app: App, plugin: ReactIris) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		// // 原生Obsidian设置部分
		// containerEl.createEl('h2', {text: 'Obsidian原生设置界面'});
		
		// new Setting(containerEl)
		// 	.setName('基础设置')
		// 	.setDesc('通过Obsidian原生设置界面修改')
		// 	.addText(text => text
		// 		.setPlaceholder('输入设置值')
		// 		.setValue(this.plugin.settings.mySetting)
		// 		.onChange(async (value) => {
		// 			this.plugin.settings.mySetting = value;
		// 			await this.plugin.saveSettings();
		// 		}));
		
		// // 分割线
		// containerEl.createEl('hr');
		
		// React设置界面标题
		containerEl.createEl('h2', {text: 'React设置界面'});
		containerEl.createEl('p', {text: '以下是使用React实现的设置界面，两种界面的设置是同步的。'});
		
		// 创建React容器
		const reactContainer = containerEl.createEl('div', {
			cls: 'react-settings-container',
			attr: {
				style: 'margin-top: 20px; border: 1px solid var(--background-modifier-border); border-radius: 5px; overflow: hidden;'
			}
		});
		
		// 卸载旧的React根（如果存在）
		if (this.reactRoot) {
			this.reactRoot.unmount();
		}
		
		// 创建新的React根并渲染设置组件
		this.reactRoot = createRoot(reactContainer);
		this.reactRoot.render(
			React.createElement(SettingComponent, {
				app: this.app,
				plugin: this.plugin,
				autoSave: true // 传递自动保存标志
			})
		);
	}
	
	// 当设置标签页被关闭时清理React根
	hide() {
		if (this.reactRoot) {
			this.reactRoot.unmount();
			this.reactRoot = null;
		}
	}
}
