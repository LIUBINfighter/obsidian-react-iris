import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { App, Modal, Notice, TFolder } from 'obsidian';
import { FavoriteItem } from '../../utils/favoriteUtils';
import { Message } from '../Chat';
import ReactIris from '../../main';

interface ExportModalProps {
  app: App;
  plugin: ReactIris;
  messages: Message[] | FavoriteItem[];
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  defaultTitle?: string;
}

export interface ExportOptions {
  title: string;
  tags: string[];
  folderPath: string;
}

export class ExportModal extends Modal {
  private onCloseCallback: () => void;
  private onExportCallback: (options: ExportOptions) => void;
  private props: ExportModalProps;
  
  constructor(app: App, props: ExportModalProps) {
    super(app);
    this.props = props;
    this.onCloseCallback = props.onClose;
    this.onExportCallback = props.onExport;
  }
  
  onOpen() {
    this.contentEl.empty();
    
    // 使用正确的React渲染方法
    ReactDOM.render(
      <ExportModalContent 
        {...this.props}
        onClose={() => {
          this.onCloseCallback();
          this.close();
        }}
        onExport={(options) => {
          this.onExportCallback(options);
          this.close();
        }}
      />,
      this.contentEl
    );
  }
  
  onClose() {
    // 清理React组件
    ReactDOM.unmountComponentAtNode(this.contentEl);
    this.contentEl.empty();
  }
}

const ExportModalContent: React.FC<ExportModalProps> = ({
  app,
  plugin,
  messages,
  onClose,
  onExport,
  defaultTitle = ''
}) => {
  const settings = plugin.settings;
  
  // 状态
  const [title, setTitle] = useState(defaultTitle || '导出的AI对话');
  const [tags, setTags] = useState<string[]>(['AI', 'chat']);
  const [folderPath, setFolderPath] = useState(settings.defaultExportFolder || 'inbox/');
  const [tagsInput, setTagsInput] = useState('AI, chat');
  const [folders, setFolders] = useState<string[]>([]);
  
  // 加载文件夹列表
  useEffect(() => {
    const loadFolders = () => {
      const folderList: string[] = [];
      const rootFolder = app.vault.getRoot();
      
      // 递归获取所有文件夹
      const collectFolders = (folder: TFolder, path: string = '') => {
        folderList.push(path + folder.name);
        
        folder.children.forEach(child => {
          if (child instanceof TFolder) {
            collectFolders(child, path + folder.name + '/');
          }
        });
      };
      
      // 从根目录开始收集文件夹
      rootFolder.children.forEach(child => {
        if (child instanceof TFolder) {
          collectFolders(child, '/');
        }
      });
      
      // 添加根目录
      folderList.unshift('/');
      
      setFolders(folderList);
      
      // 如果默认路径不在列表中，添加它
      if (settings.defaultExportFolder && !folderList.includes(settings.defaultExportFolder)) {
        setFolders(prev => [...prev, settings.defaultExportFolder]);
      }
    };
    
    loadFolders();
  }, [app.vault, settings.defaultExportFolder]);
  
  // 处理标签输入变化
  const handleTagsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagsInput(e.target.value);
    setTags(e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag));
  };
  
  // 处理保存默认文件夹
  const handleSaveAsDefault = () => {
    plugin.settings.defaultExportFolder = folderPath;
    plugin.saveSettings();
    new Notice('已保存默认导出路径');
  };
  
  // 处理导出
  const handleExport = () => {
    onExport({
      title,
      tags,
      folderPath
    });
  };
  
  return (
    <div className="export-modal-content" style={{ padding: '10px' }}>
      <h2 style={{ marginTop: 0, marginBottom: '15px' }}>导出设置</h2>
      
      <div className="form-group" style={{ marginBottom: '15px' }}>
        <label htmlFor="export-title" style={{ display: 'block', marginBottom: '5px' }}>
          标题:
        </label>
        <input 
          id="export-title"
          type="text"
          className="form-control"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>
      
      <div className="form-group" style={{ marginBottom: '15px' }}>
        <label htmlFor="export-tags" style={{ display: 'block', marginBottom: '5px' }}>
          标签: (用逗号分隔)
        </label>
        <input 
          id="export-tags"
          type="text"
          className="form-control"
          value={tagsInput}
          onChange={handleTagsInputChange}
          style={{ width: '100%' }}
        />
      </div>
      
      <div className="form-group" style={{ marginBottom: '15px' }}>
        <label htmlFor="export-folder" style={{ display: 'block', marginBottom: '5px' }}>
          保存位置:
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            id="export-folder"
            className="dropdown"
            value={folderPath}
            onChange={(e) => setFolderPath(e.target.value)}
            style={{ flex: 1 }}
          >
            {folders.map((folder) => (
              <option key={folder} value={folder}>
                {folder === '/' ? '/ (根目录)' : folder}
              </option>
            ))}
          </select>
          <button
            className="mod-cta"
            onClick={handleSaveAsDefault}
            title="保存为默认导出位置"
            style={{ padding: '0 10px' }}
          >
            保存为默认
          </button>
        </div>
      </div>
      
      <div className="form-buttons" style={{ 
        display: 'flex', 
        justifyContent: 'flex-end',
        gap: '10px',
        marginTop: '20px'
      }}>
        <button className="mod-warning" onClick={onClose}>
          取消
        </button>
        <button className="mod-cta" onClick={handleExport}>
          导出{messages.length > 1 ? ` (${messages.length}条)` : ''}
        </button>
      </div>
    </div>
  );
};
