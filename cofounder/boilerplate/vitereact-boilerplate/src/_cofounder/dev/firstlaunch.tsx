import React, { useEffect, useState } from "react";
import meta from "@/_cofounder/meta.json";

const FirstLaunch: React.FC = () => {
	const [showOverlay, setShowOverlay] = useState(true); // State to control overlay visibility

	const handleCloseOverlay = () => {
		setShowOverlay(false);
	};

	useEffect(() => {
		const handleClickOrKeyPress = () => {
			setShowOverlay(false);
		};

		document.addEventListener("click", handleClickOrKeyPress);
		document.addEventListener("keydown", handleClickOrKeyPress);

		return () => {
			document.removeEventListener("click", handleClickOrKeyPress);
			document.removeEventListener("keydown", handleClickOrKeyPress);
		};
	}, []);

	return (
		<>
			{showOverlay && (
				<div className="fixed inset-0 bg-black bg-opacity-90 backdrop-blur-sm z-[9999] flex justify-center items-start text-white text-2xl p-5 text-center whitespace-pre-line break-words">
					<div className="mt-20 bg-black rounded rounded-2xl p-8 bg-opacity-80">
						<div className="text-left p-12 pb-0">
							<p className="text-base text-right font-light mb-2">
								<a
									target="_blank"
									className="duration-200 text-[#ccc] hover:text-white"
									href="https://cofounder.openinterface.ai"
								>
									cofounder.openinterface.ai
								</a>{" "}
							</p>
							<p className="text-lg text-right font-light">
								dev mode{" "}
								<span className="ml-1 p-2 bg-[#222] rounded">{meta.project}</span>
							</p>
							<div className="my-4 p-8 bg-[#222] text-white rounded">
								<p className="mt-4">use ⌘+K | CTRL+K to toggle edit mode</p>
								<p className="mt-4 opacity-30">
									use ⌘+L | CTRL+L for control panel (soon)
								</p>
							</div>

							<p className="my-4 p-8 bg-[#000080] text-base text-white rounded whitespace-pre-line break-words justify">
								If app was just launched, be patient for few seconds / refresh a few
								times
								<br />
								while <strong>confounder/vite-plugin</strong> loads & transforms paths
								<br />
								<span className="text-sm opacity-80">
									initial errors are expected to dissapear as it rebuilds
								</span>
							</p>
						</div>
						<button
							onClick={handleCloseOverlay}
							className="text-right bg-[#222] rounded rounded-full hover:bg-[#000080] duration-200 mt-5 px-8 py-5 text-xl cursor-pointer"
						>
							Got it
						</button>
					</div>
				</div>
			)}
		</>
	);
};

export default FirstLaunch;
