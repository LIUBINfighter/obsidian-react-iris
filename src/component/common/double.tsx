import { setIcon, moment } from 'obsidian';
import React, { useState, useEffect, useRef } from 'react';

interface DoubleConfirmDeleteProps {
	onDelete: () => void;
	size?: number;
}

const DoubleConfirmDelete: React.FC<DoubleConfirmDeleteProps> = ({ onDelete, size = 20 }) => {
	const [isFirstClick, setIsFirstClick] = useState(false);
	const [timeLeft, setTimeLeft] = useState<number>(0);
	const iconRef = useRef<HTMLDivElement>(null);
	const expiryTimeRef = useRef<moment.Moment>();
	let intervalId: NodeJS.Timeout;

	useEffect(() => {
		if (iconRef.current) {
			setIcon(iconRef.current, 'trash-2', size);
		}
		return () => {
			if (intervalId) clearInterval(intervalId);
		};
	}, [size]);

	const handleClick = () => {
		if (!isFirstClick) {
			setIsFirstClick(true);
			expiryTimeRef.current = moment().add(3, 'seconds');
			
			intervalId = setInterval(() => {
				const remaining = moment.duration(expiryTimeRef.current?.diff(moment())).asSeconds();
				if (remaining <= 0) {
					setIsFirstClick(false);
					setTimeLeft(0);
					clearInterval(intervalId);
				} else {
					setTimeLeft(Math.ceil(remaining));
				}
			}, 100);
		} else {
			setIsFirstClick(false);
			setTimeLeft(0);
			if (intervalId) clearInterval(intervalId);
			onDelete();
		}
	};

	return (
		<div
			className="clickable-icon"
			style={{
				padding: '6px',
				borderRadius: '4px',
				backgroundColor: isFirstClick ? 'var(--background-modifier-error)' : 'transparent',
				transition: 'background-color 0.2s ease',
				cursor: 'pointer',
				position: 'relative'
			}}
			onClick={handleClick}
		>
			<div ref={iconRef} />
			{isFirstClick && timeLeft > 0 && (
				<div style={{
					position: 'absolute',
					top: '-8px',
					right: '-8px',
					fontSize: '12px',
					backgroundColor: 'var(--background-modifier-error)',
					borderRadius: '50%',
					width: '16px',
					height: '16px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center'
				}}>
					{timeLeft}
				</div>
			)}
		</div>
	);
};

export default DoubleConfirmDelete;
