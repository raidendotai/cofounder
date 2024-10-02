import React, { useCallback, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";
import { resetProject } from "@/store/main";

import Flow from "@/components/views/flow.tsx";
import Events from "@/components/views/events.tsx";
import { ExternalLink } from "lucide-react";

const Project: React.FC = () => {
	const { project } = useParams();
	const [tab, setTab] = useState("blueprint");
	const [pingServer, setPingServer] = useState(false);
	const [pingApp, setPingApp] = useState(false);
	const [pingServerChecked, setPingServerChecked] = useState(false);

	const [initialLoad, setInitialLoad] = useState(false);

	const tabs = ["blueprint", "live", "editor", "export"];

	const SERVER_LOCAL_URL = "http://localhost:667/api";
	const WEBAPP_LOCAL_URL = "http://localhost:5173";

	const dispatch = useDispatch();

	useEffect(() => {
		if (!initialLoad) {
			setInitialLoad(true);
			dispatch(resetProject());
		}
	}, []);

	useEffect(() => {
		if (tab === "blueprint") {
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
		}
		if (tab === "live") {
			const checkPingApp = async () => {
				try {
					const response = await fetch(WEBAPP_LOCAL_URL);
					if (response.ok) {
						setPingApp(true);
					} else {
						setPingApp(false);
					}
				} catch (error) {
					setPingApp(false);
				}
			};
			checkPingApp();
		}
	}, [tab]);

	if (!pingServerChecked) return <></>;
	return (
		<>
			{(project?.length && (
				<>
					{/*<Cmdl />*/}
					<div
						className={`fixed top-0 z-10
											bg-[#333]/20
											backdrop-blur-md
											rounded-lg shadow-md
											text-sm text-white font-light
											mt-4 p-2 ml-2 sm:ml-0
											sm:left-1/2 sm:transform sm:-translate-x-1/2
											px-6 `}
					>
						<ul className="flex justify-center space-x-4 items-center">
							<Link
								className={`cursor-pointer p-2 rounded-xl hover:bg-[#333]/50 px-3`}
								key={project}
								to={`/projects`}
							>
								<li>{"<"}</li>
							</Link>
							{tabs.map((tabName) => (
								<li
									key={tabName}
									className={`cursor-pointer p-2 rounded-xl hover:bg-[#333]/50 flex items-center gap-2 px-3
											${tab === tabName ? "bg-black/50" : ""}`}
									onClick={() => setTab(tabName)}
								>
									{tabName.charAt(0).toUpperCase() + tabName.slice(1)}
									{(tabName === "live" && (
										<>
											<a
												href="http://localhost:5371"
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center rounded-xl hover:bg-[#111] p-2"
											>
												<ExternalLink className="w-3 h-3" />
											</a>
										</>
									)) ||
										""}
								</li>
							))}
						</ul>
					</div>

					<div className={tab === "blueprint" ? "" : "hidden"}>
						{(pingServer && (
							<>
								<Flow project={project} />
								<Events project={project} />
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
					</div>

					<div className={tab === "editor" ? "" : "hidden"}>
						<div className="flex items-center justify-center h-screen w-full text-white">
							<h1 className="text-2xl font-light opacity-50 text-center">{`{ editor : not implemented yet }`}</h1>
						</div>
					</div>

					<div className={tab === "export" ? "" : "hidden"}>
						<div className="flex items-center justify-center h-screen w-full text-white">
							<h1 className="text-2xl font-light opacity-50 text-center">{`{ export : not implemented yet }`}</h1>
						</div>
					</div>

					<div className={tab === "live" ? "" : "hidden"}>
						<>
							<div className="flex items-center justify-center h-screen w-full text-white">
								{(pingApp && (
									<>
										<iframe
											src={WEBAPP_LOCAL_URL}
											className="w-full mt-[12vh] min-h-[88vh] border-t border-[#222] overflow-auto"
											style={{
												position: "absolute",
												top: 0,
												left: 0,
												right: 0,
												bottom: 0,
											}}
											title="Live mode"
											sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
										></iframe>
									</>
								)) || (
									<>
										<div className="flex items-center justify-center h-screen w-full text-white">
											<h1 className="text-2xl font-light opacity-50 whitespace-pre-wrap break-all">
												{`{ app at \`${WEBAPP_LOCAL_URL}\` not reachable }`}
												<br />
												<br />
												<br />
												{`either >\twebapp vite server not launched\n\t\t\t\t( use \`npm run dev\` in apps/${project}/ to start )`}
												<br />
												<br />
												{`or > problem in app root/store/view`}
											</h1>
										</div>
									</>
								)}
							</div>
						</>
					</div>
				</>
			)) || (
				<>
					<div className="flex items-center justify-center h-screen w-full text-white">
						<h1 className="text-2xl font-light opacity-50 whitespace-pre-wrap break-all">
							{`{ project not set ; double check your url }`}
						</h1>
					</div>
				</>
			)}
		</>
	);
};

export default Project;
