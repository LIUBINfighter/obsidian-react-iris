import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { ReadMeView } from './views/readme';

interface ReactIrisSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: ReactIrisSettings = {
	mySetting: 'default'
}

export default class ReactIris extends Plugin {
	settings: ReactIrisSettings;

	async onload() {
		await this.loadSettings();
		// 只注册合并后的ReadMe视图
		this.registerView(
			"ReadMe-view",
			(leaf) => new ReadMeView(leaf)
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

		 // 移除或注释掉旧的dice图标代码
		// const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
		// 	// Called when the user clicks the icon.
		// 	new Notice('This is a notice!');
		// });
		// ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

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
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: ReactIris;

	constructor(app: App, plugin: ReactIris) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
