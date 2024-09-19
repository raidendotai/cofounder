import React, { useState, useRef, useEffect } from "react";

const Tooltip = () => {
	const [isOpen, setIsOpen] = useState(false);
	const tooltipRef = useRef<HTMLDivElement | null>(null);
	const dropdownRef = useRef<HTMLDivElement | null>(null);

	const handleDropdownPosition = () => {
		const screenPadding = 16;
		const placeholderRect = tooltipRef.current?.getBoundingClientRect();
		const dropdownRect = dropdownRef.current?.getBoundingClientRect();

		if (!placeholderRect || !dropdownRect) return;

		const dropdownRightX = dropdownRect.x + dropdownRect.width;
		const placeholderRightX = placeholderRect.x + placeholderRect.width;

		if (dropdownRect.x < 0) {
			dropdownRef.current.style.left = "0";
			dropdownRef.current.style.right = "auto";
			dropdownRef.current.style.transform = `translateX(${-placeholderRect.x + screenPadding}px)`;
		} else if (dropdownRightX > window.outerWidth) {
			dropdownRef.current.style.left = "auto";
			dropdownRef.current.style.right = "0";
			dropdownRef.current.style.transform = `translateX(${window.outerWidth - placeholderRightX - screenPadding}px)`;
		}
	};

	const toggleTooltip = () => {
		setIsOpen(!isOpen);
	};

	useEffect(() => {
		if (isOpen) {
			handleDropdownPosition();
		}
	}, [isOpen]);

	return (
		<div className="relative inline-flex flex-col justify-center">
			<div
				ref={tooltipRef}
				className="tooltip__label cursor-help"
				aria-describedby="tooltip-demo-content"
				data-tooltip-placeholder
				onMouseOver={() => setIsOpen(true)}
				onMouseOut={() => setIsOpen(false)}
				onTouchStart={toggleTooltip}
			>
				Here is a tooltip label
			</div>
			{isOpen && (
				<div
					ref={dropdownRef}
					className="tooltip-dropdown absolute top-0 left-1/2 transform -translate-x-1/2 z-10 pt-8"
					data-tooltip-dropdown
				>
					<div
						role="tooltip"
						id="tooltip-demo-content"
						className="tooltip-dropdown__content bg-black text-white rounded p-2 w-72 text-left"
					>
						It is a long established fact that a reader will be{" "}
						<strong>distracted</strong> by the readable content of a page when looking
						at its layout.
					</div>
				</div>
			)}
		</div>
	);
};

export default Tooltip;
