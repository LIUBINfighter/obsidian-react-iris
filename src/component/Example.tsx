import React, { useState, useEffect } from 'react';

interface ExampleReactComponentProps {
  name: string;
}

export const ExampleReactComponent: React.FC<ExampleReactComponentProps> = ({ name }) => {
  const [count, setCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  // 添加一个useEffect钩子来确认组件已挂载
  useEffect(() => {
    console.log("ExampleReactComponent 已挂载");
    return () => {
      console.log("ExampleReactComponent 已卸载");
    };
  }, []);
  
  console.log("ExampleReactComponent 渲染中");
  
  return (
    <div className="example-react-component" 
      style={{ 
        padding: "15px", 
        border: "1px solid var(--background-modifier-border)",
        borderRadius: "5px",
        backgroundColor: "var(--background-primary)"
      }}
    >
      <h2 style={{ color: "var(--text-normal)" }}>React组件示例</h2>
      <p style={{ color: "var(--text-normal)" }}>欢迎, {name}!</p>
      <div className="counter" style={{ margin: "20px 0" }}>
        <p>你点击了按钮 <span style={{ color: "var(--text-accent)" }}>{count}</span> 次</p>
        <button 
          onClick={() => setCount(count + 1)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            padding: "8px 16px",
            backgroundColor: isHovered 
              ? "var(--interactive-accent-hover)" 
              : "var(--interactive-accent)",
            color: "var(--text-on-accent)",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            transition: "background-color 0.2s ease",
            transform: isHovered ? "translateY(-1px)" : "translateY(0)",
            boxShadow: isHovered ? "0 2px 4px rgba(0, 0, 0, 0.1)" : "none"
          }}
        >
          点击我
        </button>
      </div>
	<p className="info" style={{ fontSize: "0.9em", color: "var(--text-muted)" }}>
        这是一个简单的React组件，演示了如何在Obsidian插件中使用React。
	</p>
    </div>
  );
};
