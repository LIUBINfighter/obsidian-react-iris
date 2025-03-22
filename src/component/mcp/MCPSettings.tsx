import React from 'react';

export const MCPSettings: React.FC = () => {
  return (
	
    <div style={{ padding: '16px' }}>
      <div style={{ 
        backgroundColor: 'var(--background-modifier-border)', 
        padding: '8px 16px',
        borderRadius: '4px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>Beta</span>
        <span>此功能目前处于测试阶段，可能存在不稳定性</span>
      </div>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-normal)' }}>基本设置</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-normal)' }}>服务器地址</label>
            <input
              type="url"
              placeholder="http://localhost:8000"
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
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid var(--background-modifier-border)',
                borderRadius: '4px',
                backgroundColor: 'var(--background-primary)'
              }}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-normal)' }}>高级选项</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="enableDebug"
              style={{ margin: 0 }}
            />
            <label htmlFor="enableDebug" style={{ color: 'var(--text-normal)' }}>启用调试模式</label>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-normal)' }}>超时设置 (秒)</label>
            <input
              type="number"
              min="1"
              defaultValue="30"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid var(--background-modifier-border)',
                borderRadius: '4px',
                backgroundColor: 'var(--background-primary)'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};