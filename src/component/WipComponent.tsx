import React from 'react';

const WipComponent: React.FC = () => {
	return (
		<>
			{/* WIP - 测试功能区域 */}
			<div style={{
				padding: '8px 12px',
				backgroundColor: 'rgba(255, 150, 0, 0.1)',
				border: '1px solid rgba(255, 150, 0, 0.3)',
				borderRadius: '4px',
				marginBottom: '20px',
				display: 'flex',
				alignItems: 'center',
				gap: '8px'
			}}>
				<span style={{
					backgroundColor: '#ff9600',
					color: 'white',
					padding: '2px 6px',
					borderRadius: '4px',
					fontSize: '12px',
					fontWeight: 'bold'
				}}>WIP</span>
				<span>以下是测试功能区域，正在开发中...</span>
			</div>
			<div style={{
				display: 'flex',
				gap: '20px',
				flexDirection: window.innerWidth < 1000 ? 'column' : 'row',
				maxWidth: '100%',
				overflow: 'auto'
			}}></div>
		</>
	);
};

export default WipComponent;
