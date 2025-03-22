import React, { useState } from 'react';
import { OnlineModel } from './OnlineSettings';
import { parseModelJson } from '../../utils/modelImportUtils';

interface OnlineModelFormProps {
  onAddModel: (model: OnlineModel) => void;
  editingModel: OnlineModel | null;
}

export const OnlineModelForm: React.FC<OnlineModelFormProps> = ({ onAddModel, editingModel }) => {
  const [formData, setFormData] = useState<OnlineModel>(editingModel || {
    provider: '',
    url: '',
    model: '',
    apiKey: '',
    supportsVision: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddModel(formData);
    setFormData({
      provider: '',
      url: '',
      model: '',
      apiKey: '',
      supportsVision: false
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  React.useEffect(() => {
    if (editingModel) {
      setFormData(editingModel);
    }
  }, [editingModel]);

  return (
    <div style={{ flex: 1, padding: '16px', backgroundColor: 'var(--background-secondary)', borderRadius: '5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, color: 'var(--text-normal)' }}>{editingModel ? '编辑模型' : '添加新模型'}</h3>
        <input
          type="file"
          accept=".json"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = async (event) => {
                const content = event.target?.result as string;
                const result = parseModelJson(content);
                if (result.success && result.models) {
                  result.models.forEach(model => onAddModel(model));
                }
              };
              reader.readAsText(file);
            }
          }}
          style={{
            display: 'none'
          }}
          id="modelImportInput"
        />
        <button
          onClick={() => document.getElementById('modelImportInput')?.click()}
          style={{
            padding: '4px 8px',
            backgroundColor: 'var(--interactive-accent)',
            color: 'var(--text-on-accent)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          批量导入
        </button>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-normal)' }}>提供商</label>
          <input
            type="text"
            name="provider"
            value={formData.provider}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid var(--background-modifier-border)',
              borderRadius: '4px',
              backgroundColor: 'var(--background-primary)'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-normal)' }}>URL</label>
          <input
            type="url"
            name="url"
            value={formData.url}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid var(--background-modifier-border)',
              borderRadius: '4px',
              backgroundColor: 'var(--background-primary)'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-normal)' }}>模型</label>
          <input
            type="text"
            name="model"
            value={formData.model}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid var(--background-modifier-border)',
              borderRadius: '4px',
              backgroundColor: 'var(--background-primary)'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-normal)' }}>API Key</label>
          <input
            type="password"
            name="apiKey"
            value={formData.apiKey}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid var(--background-modifier-border)',
              borderRadius: '4px',
              backgroundColor: 'var(--background-primary)'
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            name="supportsVision"
            checked={formData.supportsVision}
            onChange={handleChange}
            style={{ margin: 0 }}
          />
          <label style={{ color: 'var(--text-normal)' }}>支持Vision</label>
        </div>
        <button
          type="submit"
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--interactive-accent)',
            color: 'var(--text-on-accent)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '8px'
          }}
        >
          {editingModel ? '保存修改' : '添加模型'}
        </button>
      </form>
      
      <div style={{ marginTop: '24px', borderTop: '1px solid var(--background-modifier-border)', paddingTop: '16px' }}>
        <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-normal)' }}>主流服务商</h4>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          <li style={{ marginBottom: '8px' }}>
            <a
              href="https://platform.openai.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--text-accent)' }}
            >
              OpenAI
            </a>
          </li>
          <li style={{ marginBottom: '8px' }}>
            <a
              href="https://www.anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--text-accent)' }}
            >
              Anthropic
            </a>
          </li>
          <li style={{ marginBottom: '8px' }}>
            <a
              href="https://www.perplexity.ai"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--text-accent)' }}
            >
              Perplexity
            </a>
          </li>
          <li style={{ marginBottom: '8px' }}>
            <a
              href="https://aistudio.google.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--text-accent)' }}
            >
              Google AI Studio
            </a>
          </li>
          <li style={{ marginBottom: '8px' }}>
            <a
              href="https://platform.deepseek.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--text-accent)' }}
            >
              Deepseek
            </a>
          </li>
          <li>
            <a
              href="https://cloud.siliconflow.cn"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--text-accent)' }}
            >
              硅基流动
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};