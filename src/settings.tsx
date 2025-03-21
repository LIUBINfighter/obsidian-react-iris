import React from 'react';

interface SettingTabProps {
  settings: any;
  onSettingsChange: (newSettings: any) => void;
}

const SettingTab: React.FC<SettingTabProps> = ({ settings, onSettingsChange }) => {
  return (
    <div>
      <div className="setting-item">
        <div className="setting-item-info">
          <div className="setting-item-name">默认导出文件夹</div>
          <div className="setting-item-description">设置导出收藏内容时的默认文件夹位置</div>
        </div>
        <div className="setting-item-control">
          <input 
            type="text" 
            value={settings.defaultExportFolder}
            onChange={(e) => onSettingsChange({
              ...settings,
              defaultExportFolder: e.target.value
            })}
            placeholder="例如: /inbox"
          />
        </div>
      </div>
    </div>
  );
};

export default SettingTab;
