import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { ReadMeView } from './views/readme';
import { ReactIrisSettingTab } from './SettingTab';
import { ReactIrisModal } from './modal';
import { AIServiceType } from './services/AIServiceFactory';
import { ChatView, CHAT_VIEW_TYPE } from './views/chat-view';

interface ReactIrisSettings {
	mySetting: string;
	apiKey: string;
	baseUrl: string;
	modelName: string;
	temperature: number;
	serviceType: AIServiceType;
	defaultExportFolder: string; // 添加默认导出文件夹设置
	aiService?: {
		type: AIServiceType;
		baseUrl: string;
		modelName: string;
		systemPrompt?: string;
		temperature?: number;
		maxTokens?: number;
	};
	// 多模态支持设置
	multimodalEnabled?: boolean;
	multimodalModel?: string;
}

const DEFAULT_SETTINGS: ReactIrisSettings = {
	mySetting: 'default',
	apiKey: '',
	baseUrl: 'http://localhost:11434',
	modelName: 'gemma:2b',
	temperature: 0.7,
	serviceType: 'ollama',
	defaultExportFolder: '/inbox' // 默认导出到 inbox 文件夹
}

export default class ReactIris extends Plugin {
	settings: ReactIrisSettings;

	async onload() {
		await this.loadSettings();
		// 注册视图
		this.registerView(
			"ReadMe-view",
			(leaf) => new ReadMeView(leaf, this)
		);

		// 注册聊天视图
		this.registerView(
			CHAT_VIEW_TYPE,
			(leaf) => new ChatView(leaf, this)
		);

		// 添加命令打开合并后的ReadMe视图
		this.addCommand({
			id: "show-readme-view",
			name: "Show ReadMe and React View",
			callback: () => {
				this.activateReadMeView();
			}
		});

		// 添加命令打开聊天视图
		this.addCommand({
			id: "show-chat-view",
			name: "打开聊天助手",
			callback: () => {
				this.activateChatView();
			}
		});

		// 添加一个info图标到功能区，点击时打开ReadMe视图
		const ribbonIconEl = this.addRibbonIcon('info', 'React Iris Info', (evt: MouseEvent) => {
			// 打开ReadMe视图
			this.activateReadMeView();
		});
		ribbonIconEl.addClass('react-iris-ribbon-icon');

		// 添加一个新芽图标到功能区，点击时打开聊天视图
		const chatRibbonIconEl = this.addRibbonIcon('sprout', '聊天助手', (evt: MouseEvent) => {
			// 打开聊天视图
			this.activateChatView();
		});
		chatRibbonIconEl.addClass('react-iris-chat-ribbon-icon');

		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');


		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ReactIrisSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {
		// 清理所有视图
		this.app.workspace.detachLeavesOfType("ReadMe-view");
		this.app.workspace.detachLeavesOfType(CHAT_VIEW_TYPE);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// 修改激活视图的方法，只保留一个
	async activateReadMeView() {
		console.log("尝试激活合并的ReadMe视图");
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType("ReadMe-view")[0];
		
		if (!leaf) {
			console.log("未找到ReadMe视图，创建新视图");
			leaf = workspace.getLeaf(false);
			await leaf.setViewState({
				type: "ReadMe-view",
				active: true,
			});
			console.log("ReadMe视图状态已设置");
		} else {
			console.log("找到现有ReadMe视图");
		}
		
		workspace.revealLeaf(leaf);
		console.log("ReadMe视图已显示");
		
		// 强制更新视图
		setTimeout(() => {
			if (leaf.view instanceof ReadMeView) {
				console.log("刷新ReadMe视图");
				leaf.view.onOpen();
			}
		}, 100);
	}

	// 激活聊天视图
	async activateChatView() {
		console.log("尝试激活聊天视图");
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(CHAT_VIEW_TYPE)[0];
		
		if (!leaf) {
			console.log("未找到聊天视图，创建新视图");
			leaf = workspace.getLeaf(false);  // 将getRightLeaf改为getLeaf，使其在工作区而非侧边栏创建
			await leaf.setViewState({
				type: CHAT_VIEW_TYPE,
				active: true,
			});
			console.log("聊天视图状态已设置");
		} else {
			console.log("找到现有聊天视图");
		}
		
		workspace.revealLeaf(leaf);
		console.log("聊天视图已显示");
		
		// 强制更新视图
		setTimeout(() => {
			if (leaf.view instanceof ChatView) {
				console.log("刷新聊天视图");
				leaf.view.onOpen();
			}
		}, 100);
	}
}
