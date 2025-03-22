import React, { useState } from 'react';
import { LMStudioService } from '../../services/lmstudio/LMStudioService';
import WipComponent from '../WipComponent';
export function LMStudioRestSettings() {
  const [baseUrl, setBaseUrl] = useState<string>('http://127.0.0.1:1234');
  const [apiKey, setApiKey] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lmStudioService = new LMStudioService({ baseUrl, modelName: '' });

  // 测试LM Studio连接
  const testConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      const isConnected = await lmStudioService.testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      if (!isConnected) {
        setError('无法连接到LM Studio服务，请确保LM Studio已启动并运行在指定URL');
      }
    } catch (err) {
      setConnectionStatus('disconnected');
      setError('连接测试出错: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <WipComponent />

      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '8px' }}>基础URL</div>
        <input
          type="text"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid var(--background-modifier-border)',
            backgroundColor: 'var(--background-primary)'
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '8px' }}>API密钥 (可选)</div>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid var(--background-modifier-border)',
            backgroundColor: 'var(--background-primary)'
          }}
        />
      </div>

      <button
        onClick={testConnection}
        disabled={loading}
        style={{
          padding: '8px 16px',
          borderRadius: '4px',
          backgroundColor: 'var(--interactive-accent)',
          color: 'var(--text-on-accent)',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? '测试中...' : '测试连接'}
      </button>

      {connectionStatus !== 'unknown' && (
        <div style={{
          marginTop: '16px',
          padding: '8px',
          borderRadius: '4px',
          backgroundColor: connectionStatus === 'connected' ? 'var(--background-modifier-success)' : 'var(--background-modifier-error)',
          color: 'var(--text-normal)'
        }}>
          {connectionStatus === 'connected' ? '连接成功' : '连接失败'}
          {error && <div style={{ marginTop: '8px', fontSize: '0.9em' }}>{error}</div>}
        </div>
      )}
    </div>
  );
}
