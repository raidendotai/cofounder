import React from "react";
import { Route, Routes } from "react-router-dom";
import cofounder from "@/assets/cofounder.webp";

const App: React.FC = () => {
	return (
		<>
			<div className="container mx-auto w-full xl:w-[60vw] p-12 mt-12 text-left whitespace-pre-line break-words">
				<section className="pb-4 mb-4 text-center">
					<a
						href="https://github.com/raidendotai/cofounder"
						target="_blank"
						className="opacity-100 hover:opacity-90 duration-200"
					>
						<img
							className="rounded rounded-xl md:max-w-[30vw] mx-auto"
							src={cofounder}
						/>
					</a>
					<h1 className="mt-8 text-2xl">Vite + React</h1>
					<h1 className="mt-2">your app will update here as it generates</h1>
				</section>
			</div>
		</>
	);
};

export default App;
