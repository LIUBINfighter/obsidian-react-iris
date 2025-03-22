import React from 'react';

interface IntroductionProps {
  app: App;
  plugin?: ReactIris;
}

export const Introduction: React.FC<IntroductionProps> = ({ app, plugin }) => {
  return (
    <div className="instructions-container" style={{ 
      padding: '20px', 
      border: '1px solid var(--background-modifier-border)',
      borderRadius: '4px',
      marginTop: '10px'
    }}>
      <h3>欢迎使用 React Iris 插件</h3>
      <ul>
        <li>使用侧边栏中的新芽图标或命令面板打开聊天助手</li>
        <li>在聊天界面中与AI进行对话</li>
        <li>可以创建和管理多个对话会话</li>
        <li>支持将重要消息保存到收藏夹</li>
      </ul>
      <p style={{ marginTop: '15px' }}>
        在设置选项卡中可以配置AI服务的相关参数，如API密钥、模型名称等。
      </p>
    </div>
  );
};
