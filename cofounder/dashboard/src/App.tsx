import React, { useCallback, useState, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import cofounder from "@/assets/cofounder.webp";
import Sidebar from "@/components/views/sidebar";
import ProjectsList from "@/components/views/projects-list";
import ComponentsDesigner from "@/components/views/component-designer";
import Settings from "@/components/views/settings";
import Project from "@/components/views/project";

const App: React.FC = () => {
	const [pingServer, setPingServer] = useState(false);
	const [pingServerChecked, setPingServerChecked] = useState(false);
	const location = useLocation();

	const SERVER_LOCAL_URL = "http://localhost:667/api";
	useEffect(() => {
		const checkPingServer = async () => {
			try {
				const response = await fetch(`${SERVER_LOCAL_URL}/ping`);
				if (response.ok) {
					setPingServer(true);
				} else {
					setPingServer(false);
				}
			} catch (error) {
				setPingServer(false);
			}
			setPingServerChecked(true);
		};
		checkPingServer();
	}, []);
	if (!pingServerChecked) return <></>;

	return (
		<>
			{(pingServer && (
				<>
					<div className="flex h-screen">
						{!location.pathname.startsWith("/project/") && <Sidebar />}
						<div className="flex-1 overflow-auto">
							<Routes>
								<Route
									path="/"
									element={
										<>
											<div className="container text-white mx-auto w-full max-w-[90vw] xl:max-w-[60vw] p-12 mt-12 text-left whitespace-pre-line break-words">
												<section className="pb-4 mb-4 text-center">
													<a
														href="https://github.com/raidendotai/cofounder"
														target="_blank"
														className="opacity-100 hover:opacity-90 duration-200"
													>
														<img
															className="rounded rounded-xl max-w-[90vw] md:max-w-[35vw] mx-auto"
															src={cofounder}
														/>
													</a>
												</section>
												<h2 className="mt-4 text-2xl opacity-50 font-light text-center uppercase">
													early alpha release
												</h2>
											</div>
										</>
									}
								/>
								<Route
									path="/projects"
									element={
										<div className="container text-white mx-auto w-full max-w-[90vw] xl:max-w-[80vw] p-6 mt-6 text-left whitespace-pre-line break-words">
											<ProjectsList />
										</div>
									}
								/>
								<Route path="/project/:project" element={<Project />} />
								<Route path="/playground/designer" element={<ComponentsDesigner />} />
								<Route path="/settings" element={<Settings />} />
							</Routes>
						</div>
					</div>
				</>
			)) || (
				<>
					<div className="flex items-center justify-center h-screen w-full text-white">
						<h1 className="text-2xl font-light opacity-50 whitespace-pre-wrap break-all">
							{`{ local cofounder/api server at \`${SERVER_LOCAL_URL}\` not reachable }`}
							<br />
							<br />
							{`>\tmake sure local cofounder server is launched\n\t( use \`npm run start\` in cofounder/api/ )`}
						</h1>
					</div>
				</>
			)}
		</>
	);
};

export default App;
