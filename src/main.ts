import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { ReadMeView } from './views/readme';
import { ReactIrisSettingTab } from './SettingTab';
import { ReactIrisModal } from './modal';
import { AIServiceType } from './services/AIServiceFactory';

interface ReactIrisSettings {
	mySetting: string;
	aiService: {
		type: AIServiceType;
		baseUrl: string;
		modelName: string;
		systemPrompt: string;
		temperature: number;
		maxTokens: number;
	};
}

const DEFAULT_SETTINGS: ReactIrisSettings = {
	mySetting: 'default',
	aiService: {
		type: 'langchain',
		baseUrl: 'http://localhost:11434',
		modelName: 'deepseek-r1:latest',
		systemPrompt: '你是一个有用的AI助手。',
		temperature: 0.7,
		maxTokens: 4096
	}
}

export default class ReactIris extends Plugin {
	settings: ReactIrisSettings;

	async onload() {
		await this.loadSettings();
		// 只注册合并后的ReadMe视图
		this.registerView(
			"ReadMe-view",
			(leaf) => new ReadMeView(leaf, this)
		);

		// 添加命令打开合并后的ReadMe视图
		this.addCommand({
			id: "show-readme-view",
			name: "Show ReadMe and React View",
			callback: () => {
				this.activateReadMeView();
				}
			});

		// 添加一个info图标到功能区，点击时打开ReadMe视图
		const ribbonIconEl = this.addRibbonIcon('info', 'React Iris Info', (evt: MouseEvent) => {
			// 打开ReadMe视图
			this.activateReadMeView();
		});
		ribbonIconEl.addClass('react-iris-ribbon-icon');

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
		// 只需清理合并后的视图
		this.app.workspace.detachLeavesOfType("ReadMe-view");
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

	// 获取AI服务配置
	getAIServiceConfig() {
		return this.settings.aiService;
	}
}
