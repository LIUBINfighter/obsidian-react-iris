import React from 'react';
import { OnlineModel } from './OnlineSettings';
import { ButtonComponent } from 'obsidian';
import DoubleConfirmDelete from '../common/double';

interface OnlineModelListProps {
  models: OnlineModel[];
  onDeleteModel?: (index: number) => void;
  onEditModel?: (index: number) => void;
}

export const OnlineModelList: React.FC<OnlineModelListProps> = ({ models, onDeleteModel, onEditModel }) => {
  return (
    <div className="online-model-list" style={{ flex: 1, padding: '16px', backgroundColor: 'var(--background-secondary)', borderRadius: 'var(--radius-m)' }}>
      <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-normal)', borderBottom: '2px solid var(--background-modifier-border)', paddingBottom: '8px' }}>已配置的模型</h3>
      {models.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>暂无配置的模型</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {models.map((model, index) => (
            <div
              key={index}
              style={{
                padding: '16px',
                backgroundColor: 'var(--background-primary)',
                borderRadius: 'var(--radius-s)',
                border: '1px solid var(--background-modifier-border)',
                position: 'relative'
              }}
            >
              <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ color: 'var(--text-normal)', fontSize: '1.1em' }}>{model.provider}</strong>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '8px', fontSize: '0.9em' }}>({model.model})</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {onEditModel && (
                    <button
                      className="clickable-icon"
                      onClick={() => onEditModel(index)}
                      style={{ padding: '0 8px' }}
                    >
                      编辑
                    </button>
                  )}
                  {onDeleteModel && (
                    <DoubleConfirmDelete
                      onDelete={() => onDeleteModel(index)}
                      size={16}
                    />
                  )}
                </div>
              </div>
              <div style={{ display: 'grid', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9em' }}>
                <div>
                  <strong style={{ color: 'var(--text-normal)' }}>URL：</strong>
                  {model.url}
                </div>
                <div>
                  <strong style={{ color: 'var(--text-normal)' }}>API Key：</strong>
                  {model.apiKey ? '已配置' : '未配置'}
                </div>
                <div>
                  <strong style={{ color: 'var(--text-normal)' }}>Vision支持：</strong>
                  {model.supportsVision ? '是' : '否'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};