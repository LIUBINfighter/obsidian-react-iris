import React from 'react';
import { OnlineModelList } from './OnlineModelList';
import { OnlineModelForm } from './OnlineModelForm';

export interface OnlineModel {
  provider: string;
  url: string;
  model: string;
  apiKey: string;
  supportsVision: boolean;
}

export const OnlineSettings: React.FC = () => {
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
    <div style={{ display: 'flex', gap: '20px' }}>
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
  );
};