import React, { useState, useEffect, useCallback } from 'react';
import { App } from 'obsidian';
import ReactIris from '../main';
import { debounce } from 'obsidian';

interface SettingComponentProps {
  app: App;
  plugin?: ReactIris; // 插件实例
  autoSave?: boolean; // 是否自动保存
}

// 插件设置接口
interface PluginSettings {
  mySetting: string;
  // 可以添加更多设置项
  theme?: string;
  fontSize?: number;
  autoSave?: boolean;
}

export const SettingComponent: React.FC<SettingComponentProps> = ({ 
  app, 
  plugin,
  autoSave = false // 默认不自动保存
}) => {
  // 初始化设置状态
  const [settings, setSettings] = useState<PluginSettings>({
    mySetting: 'default',
    theme: 'system',
    fontSize: 16,
    autoSave: true
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error' | 'info'} | null>(null);

  // 定义保存设置的函数
  const saveSettingsToPlugin = async (settingsToSave: PluginSettings) => {
    try {
      // 方法1：如果有插件实例，使用它的保存方法
      if (plugin) {
        // 更新插件设置
        plugin.settings = {...settingsToSave};
        // 保存设置
        await plugin.saveSettings();
        console.log("设置已自动保存到插件");
      } 
      // 方法2：直接写入 data.json (备用方法)
      else {
        const configDir = app.vault.configDir;
        const pluginDataPath = `${configDir}/plugins/obsidian-react-iris/data.json`;
        
        // 将设置转换为JSON字符串
        const data = JSON.stringify(settingsToSave, null, 2);
        
        // 写入文件
        await app.vault.adapter.write(pluginDataPath, data);
        console.log("设置已自动保存到data.json");
      }
      
      // 自动保存成功提示（可选）
      if (!autoSave) {
        setMessage({
          text: "设置已保存",
          type: 'success'
        });
        
        // 3秒后清除消息
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      }
      
    } catch (error) {
      console.error("保存设置失败:", error);
      setMessage({
        text: `保存设置失败: ${error.message}`,
        type: 'error'
      });
    }
  };
  
  // 创建一个防抖的保存函数，避免频繁保存
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce(
      (settingsToSave: PluginSettings) => saveSettingsToPlugin(settingsToSave),
      500 // 500ms的防抖时间
    ),
    [plugin, app]
  );

  // 加载设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        
        // 方法1：如果有插件实例，直接使用它的设置
        if (plugin) {
          setSettings({...plugin.settings});
          console.log("从插件实例加载设置:", plugin.settings);
        } 
        // 方法2：直接从 data.json 读取 (备用方法)
        else {
          const configDir = app.vault.configDir;
          const pluginDataPath = `${configDir}/plugins/obsidian-react-iris/data.json`;
          
          try {
            // 检查文件是否存在
            const exists = await app.vault.adapter.exists(pluginDataPath);
            
            if (exists) {
              const data = await app.vault.adapter.read(pluginDataPath);
              const parsedData = JSON.parse(data);
              setSettings(parsedData);
              console.log("从data.json加载设置:", parsedData);
            } else {
              console.log("设置文件不存在，使用默认设置");
            }
          } catch (e) {
            console.error("读取data.json文件失败:", e);
          }
        }
        
      } catch (error) {
        console.error("加载设置失败:", error);
        setMessage({
          text: `加载设置失败: ${error.message}`,
          type: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [app, plugin]);

  // 手动保存设置（按钮点击时使用）
  const handleManualSave = async () => {
    await saveSettingsToPlugin(settings);
  };

  // 处理设置变更
  const handleSettingChange = (key: keyof PluginSettings, value: any) => {
    const newSettings = {
      ...settings,
      [key]: value
    };
    
    setSettings(newSettings);
    
    // 如果启用了自动保存，则触发防抖保存
    if (autoSave) {
      debouncedSave(newSettings);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>加载设置中...</div>;
  }

  return (
    <div className="setting-component" style={{ 
      padding: '20px',
      backgroundColor: 'var(--background-primary)',
      borderRadius: '5px',
      border: '1px solid var(--background-modifier-border)'
    }}>
      <h2 style={{ marginTop: 0 }}>插件设置</h2>
      
      {/* 显示消息 */}
      {message && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '20px', 
          borderRadius: '5px',
          backgroundColor: message.type === 'success' ? 'var(--background-modifier-success)' : 
                          message.type === 'error' ? 'var(--background-modifier-error)' : 
                          'var(--background-modifier-border)',
          color: message.type === 'error' ? 'var(--text-error)' : 'var(--text-normal)'
        }}>
          {message.text}
        </div>
      )}
      
      {autoSave && (
        <div style={{
          padding: '8px',
          marginBottom: '15px',
          backgroundColor: 'var(--background-primary-alt)',
          borderRadius: '4px',
          fontSize: '0.9em',
          color: 'var(--text-muted)'
        }}>
          设置会在修改后自动保存
        </div>
      )}
      
      {/* 设置项 */}
      <div className="setting-item" style={{ marginBottom: '20px' }}>
        <div className="setting-item-info" style={{ marginBottom: '8px' }}>
          <div className="setting-item-name" style={{ fontWeight: 'bold' }}>基础设置</div>
          <div className="setting-item-description">这是从main.ts中继承的基础设置</div>
        </div>
        <div className="setting-item-control">
          <input 
            type="text" 
            value={settings.mySetting || ''} 
            onChange={(e) => handleSettingChange('mySetting', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid var(--background-modifier-border)',
              borderRadius: '4px',
              backgroundColor: 'var(--background-primary-alt)'
            }}
            placeholder="输入设置值"
          />
        </div>
      </div>
      
      {/* 主题设置 */}
      <div className="setting-item" style={{ marginBottom: '20px' }}>
        <div className="setting-item-info" style={{ marginBottom: '8px' }}>
          <div className="setting-item-name" style={{ fontWeight: 'bold' }}>主题</div>
          <div className="setting-item-description">选择插件界面主题</div>
        </div>
        <div className="setting-item-control">
          <select 
            value={settings.theme || 'system'} 
            onChange={(e) => handleSettingChange('theme', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid var(--background-modifier-border)',
              borderRadius: '4px',
              backgroundColor: 'var(--background-primary-alt)'
            }}
          >
            <option value="system">跟随系统</option>
            <option value="light">亮色主题</option>
            <option value="dark">暗色主题</option>
          </select>
        </div>
      </div>
      
      {/* 字体大小设置 */}
      <div className="setting-item" style={{ marginBottom: '20px' }}>
        <div className="setting-item-info" style={{ marginBottom: '8px' }}>
          <div className="setting-item-name" style={{ fontWeight: 'bold' }}>字体大小</div>
          <div className="setting-item-description">调整编辑器字体大小 ({settings.fontSize}px)</div>
        </div>
        <div className="setting-item-control" style={{ display: 'flex', alignItems: 'center' }}>
          <input 
            type="range" 
            min="12" 
            max="24" 
            value={settings.fontSize || 16} 
            onChange={(e) => handleSettingChange('fontSize', parseInt(e.target.value))}
            style={{ flex: 1, marginRight: '10px' }}
          />
          <span>{settings.fontSize}px</span>
        </div>
      </div>
      
      {/* 自动保存设置 */}
      <div className="setting-item" style={{ marginBottom: '20px' }}>
        <div className="setting-item-info" style={{ marginBottom: '8px' }}>
          <div className="setting-item-name" style={{ fontWeight: 'bold' }}>自动保存</div>
        </div>
        <div className="setting-item-control">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input 
              type="checkbox" 
              checked={settings.autoSave || false} 
              onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
              id="autoSave"
              style={{ marginRight: '8px' }}
            />
            <label htmlFor="autoSave">启用自动保存</label>
          </div>
        </div>
      </div>
      
      {/* 保存按钮 - 即使自动保存启用也显示，作为备用选项 */}
      <button 
        onClick={handleManualSave}
        style={{
          padding: '8px 16px',
          backgroundColor: 'var(--interactive-accent)',
          color: 'var(--text-on-accent)',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        {autoSave ? '手动保存' : '保存设置'}
      </button>
    </div>
  );
};
