import React, { useState, useEffect } from "react";

const GenUiLoading: React.FC = () => {
	const rows = 12;
	const cols = 6;
	const [activeCells, setActiveCells] = useState<number[]>([]);
	const totalCells = rows * cols;
	const trailLength = 6; // Length of the trail

	useEffect(() => {
		let currentIndex = 0;
		const interval = setInterval(() => {
			setActiveCells((prev) => {
				const newActiveCells = Array(totalCells).fill(0);
				for (let i = 0; i < trailLength; i++) {
					const index = (currentIndex - i + totalCells) % totalCells;
					newActiveCells[index] = 1 - i * (1 / trailLength); // Decaying opacity
				}
				currentIndex = (currentIndex + 1) % totalCells;
				return newActiveCells;
			});
		}, 50);

		return () => clearInterval(interval);
	}, [totalCells]);

	return (
		<div className="grid grid-cols-12 rounded">
			{Array.from({ length: totalCells }).map((_, index) => (
				<div
					key={index}
					className="w-full"
					style={{
						height: "20px",
						backgroundColor: "black", //`#${Math.floor((Math.abs(Math.sin(index) * 16777215)) % 16777215).toString(16).padStart(6, '0')}`,
						opacity: activeCells[index] || 0,
						transition: "opacity 0.5s",
					}}
				/>
			))}
		</div>
	);
};

export default GenUiLoading;
