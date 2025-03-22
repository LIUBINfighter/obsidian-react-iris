import React, { useEffect } from 'react';
import { OnlineModelList } from './OnlineModelList';
import { OnlineModelForm } from './OnlineModelForm';
import { debounce } from '../../utils/debounceUtils';
import ReactIris from '../../main';
import WipComponent from 'component/WipComponent';

export interface OnlineModel {
  provider: string;
  url: string;
  model: string;
  apiKey: string;
  supportsVision: boolean;
}

interface OnlineSettingsProps {
  plugin: ReactIris;
}

export const OnlineSettings: React.FC<OnlineSettingsProps> = ({ plugin }) => {
  const [editingModel, setEditingModel] = React.useState<OnlineModel | null>(null);
  const defaultModels: OnlineModel[] = [
    {
      provider: 'OpenAI',
      url: 'https://api.openai.com/v1',
      model: 'gpt-4-turbo-preview',
      apiKey: '',
      supportsVision: true
    },
    {
      provider: 'Anthropic',
      url: 'https://api.anthropic.com/v1',
      model: 'claude-3-opus-20240229',
      apiKey: '',
      supportsVision: true
    },
    {
      provider: 'Perplexity',
      url: 'https://api.perplexity.ai',
      model: 'pplx-70b-online',
      apiKey: '',
      supportsVision: false
    }
  ];

  const [models, setModels] = React.useState<OnlineModel[]>(defaultModels);

  // 初始化时从插件配置中读取模型列表
  useEffect(() => {
    const loadModels = async () => {
      const savedModels = plugin.settings.onlineModels || [];
      if (savedModels.length > 0) {
        setModels(savedModels);
      }
    };
    loadModels();
  }, [plugin]);

  // 当模型列表变更时，更新插件配置
  useEffect(() => {
    const saveModels = debounce(async () => {
      plugin.settings.onlineModels = models;
      await plugin.saveSettings();
    }, 1000);
    saveModels();
  }, [models, plugin]);

  const handleAddModel = (model: OnlineModel) => {
    if (editingModel) {
      const index = models.findIndex(m => m === editingModel);
      if (index !== -1) {
        const newModels = [...models];
        newModels[index] = model;
        setModels(newModels);
        setEditingModel(null);
      }
    } else {
      setModels([...models, model]);
    }
  };

  const handleDeleteModel = (index: number) => {
    const newModels = [...models];
    newModels.splice(index, 1);
    setModels(newModels);
  };

  const handleEditModel = (index: number) => {
    setEditingModel(models[index]);
  };

  return (
	<>
	<WipComponent/>
    <div style={{
      display: 'flex',
      gap: '20px',
      flexDirection: window.innerWidth < 1000 ? 'column' : 'row',
      maxWidth: '100%',
      overflow: 'auto'
    }}>
      <OnlineModelList
        models={models}
        onDeleteModel={handleDeleteModel}
        onEditModel={handleEditModel}
      />
      <OnlineModelForm
        onAddModel={handleAddModel}
        editingModel={editingModel}
      />
    </div>
	</>
  );
};
