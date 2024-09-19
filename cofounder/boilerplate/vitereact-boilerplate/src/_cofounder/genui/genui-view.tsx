// @ts-ignore

import React, { useEffect, useRef, useState } from "react";
import { ErrorBoundary } from "@/_cofounder/genui/error-boundary";
import GenUiPlaceholder from "@/_cofounder/genui/genui-placeholder";
import { useScreenshot } from "use-screenshot-hook";
import { createFileName } from "use-react-screenshot";
import { RefreshCcw, PencilRuler } from "lucide-react";
import meta from "@/_cofounder/meta.json";

interface GenUiViewProps {
	//component: { [key: string]: any };
	[key: string]: any;
}

const GenUiView: React.FC<GenUiViewProps> = (query) => {
	const COFOUNDER_LOCAL_API = `{COFOUNDER_LOCAL_API_BASE_URL}`;

	const viewId = query.viewId;
	let _query = { ...query };
	delete _query.viewId;

	const [Component, setComponent] = useState<React.FC | null>(null);
	const [components, setComponents] = useState<{ [key: string]: React.FC }>({});
	const [choice, setChoice] = useState("");
	const [versions, setVersions] = useState<string[]>([]);
	const [versionsWithImportProblems, setVersionsWithImportProblems] = useState<
		string[]
	>([]);
	const [loaded, setLoaded] = useState(false);
	const [ready, setReady] = useState(false);
	const [newMenu, setNewMenu] = useState(false);
	const [editUserText, setEditUserText] = useState("");
	const [editEnableDesigner, setEditEnableDesigner] = useState(true);

	const [inferenceStream, setInferenceStream] = useState("");
	const [processing, setProcessing] = useState(false);

	const [isOpenTooltip, setIsOpenTooltip] = useState(false);
	const [isOpenTooltipTab, setIsOpenTooltipTab] = useState(false);
	const [layoutPreviewUrl, setLayoutPreviewUrl] = useState(``);
	const [layoutPreviewBlob, setLayoutPreviewBlob] = useState(``);

	// _____________________________________________________________________
	const [cmdk, setCmdk] = useState(() => {
		// Retrieve the initial state from local storage or default to false
		// const savedCmdk = localStorage.getItem("cmdkState");
		// return savedCmdk === "true"; // Convert string to boolean
		const savedCmdk = false;
		return savedCmdk;
	});

	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setCmdk((prev) => {
					const newState = !prev;
					// localStorage.setItem("cmdkState", newState.toString()); // Save the new state to local storage
					return newState;
				});
			} else if (e.key === "Escape") {
				setCmdk(false);
				// localStorage.setItem("cmdkState", "false"); // Reset state in local storage
			}
		};
		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	const ref = useRef(null);
	const tooltipRef = useRef<HTMLDivElement | null>(null);
	const tooltipTabRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (Component) {
			_delayed_screenshot();
		}
	}, [Component]);

	// _____________________________________________________________________

	const { image, takeScreenshot } = useScreenshot({ ref });
	const testScreenshot = () => {
		takeScreenshot();
	};
	async function _delayed_screenshot() {
		await new Promise((resolve) => setTimeout(resolve, 1e3));
		takeScreenshot();
	}

	const download = (image, { name = "img", extension = "png" } = {}) => {
		const a = document.createElement("a");
		a.href = image;
		a.download = createFileName(extension, name);
		a.click();
	};
	useEffect(() => {
		if (image) {
			// download(image, { name: "lorem-ipsum", extension: "png" });
		}
	}, [image]);

	useEffect(() => {
		const loadLayoutPreview = async () => {
			if (layoutPreviewUrl.length > 0) {
				setLayoutPreviewBlob("");
				try {
					const layoutPreviewModule = new URL(layoutPreviewUrl, import.meta.url)
						.href;
					setLayoutPreviewBlob(layoutPreviewModule);
					// check after
					const response = await fetch(`http://localhost:5173${layoutPreviewUrl}`, {
						method: "HEAD",
					});
					if (
						!response.ok ||
						!response.headers.get("content-type")?.includes("image")
					) {
						setLayoutPreviewBlob("");
						// console.log("> fetched resource is not an image ; probably empty, skipping preview layout assignment");
					}
				} catch (error) {
					console.error("no layout preview", error);
				}
			}
		};

		loadLayoutPreview();
	}, [layoutPreviewUrl]);

	const api_updateVersionPreference = async ({ version }) => {
		try {
			await fetch(`${COFOUNDER_LOCAL_API}/project/actions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					project: meta.project,
					query: {
						action: "update:settings:preferences:versions",
						data: {
							views: {
								[viewId]: `${version}`,
							},
						},
					},
				}),
			});
		} catch (error) {
			console.error({ "genui:callApi:error": error });
		}
	};

	const api_regenerateComponent = async () => {
		if (processing) return;
		setProcessing(true);
		try {
			await fetch(`${COFOUNDER_LOCAL_API}/project/actions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					project: meta.project,
					query: {
						action: "regenerate:ui",
						data: {
							views: viewId,
						},
					},
				}),
			});
		} catch (error) {
			console.error({ "genui:callApi:error": error });
		}
		setProcessing(false);
	};

	const api_iterateComponent = async () => {
		if (processing) return;
		setProcessing(true);
		try {
			await fetch(`${COFOUNDER_LOCAL_API}/project/actions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					project: meta.project,
					query: {
						action: "iterate:ui",
						data: {
							views: {
								[viewId]: {
									[choice]: {
										notes: {
											text: editUserText,
											attachments: [], // later, can attach extra image dragged into dropzone
										},
										screenshot: {
											base64: image ? image : false,
										},
										designer: editEnableDesigner,
									},
								},
							},
						},
					},
				}),
			});
		} catch (error) {
			console.error({ "genui:callApi:error": error });
		}
		setProcessing(false);
	};

	const api_updateComponent = async ({ operation }) => {
		return; // <------- debug ; is old method ; update later
		if (processing) return;
		setProcessing(true);
		let _query = { ...query };
		if (operation === `edit`) {
			_query.edit = {
				version: choice,
				iteration: `${editUserText}`,
			};
		}
		setEditUserText(``);
		try {
			const response = await fetch(`http://localhost:1337/${operation}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(_query),
			});

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let completion = ``;
			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					break;
				}
				const chunk = decoder.decode(value);
				completion += chunk;
				setInferenceStream(completion);
			}
		} catch (error) {
			console.error({ "genui:callApi:error": error });
		}
		setProcessing(false);
	};

	const loadComponent = async () => {
		if (loaded) return;
		setLoaded(true);

		// reset everything
		setComponent(null);
		setComponents({});
		setChoice("");
		setVersions([]);
		setLoaded(false);
		setNewMenu(false);
		setInferenceStream("");
		setProcessing(false);

		try {
			const _meta = await import(
				`@/_cofounder/generated/views/${viewId}/meta.json`
			);
			const meta = _meta.default; // Access the default export
			// console.log({ id, choice: meta.choice, versions: meta.versions });

			let loadedComponents: { [key: string]: React.FC } = {};
			let problematicVersions: string[] = [];
			await Promise.all(
				meta.versions
					.sort((a, b) => {
						if (a === "empty") return -1;
						if (b === "empty") return 1;
						return a.localeCompare(b);
					})
					.reverse()
					.map(async (version: string) => {
						try {
							const { default: LoadedVersionComponent } = await import(
								`@/_cofounder/generated/views/${viewId}/${version}.tsx`
							);
							loadedComponents[version] = LoadedVersionComponent;
							// console.log({ "genui:load:version:success": version });
						} catch (err) {
							// console.log({ "genui:load:version:error": { version, err } });
							problematicVersions.push(version);
						}
					}),
			);

			const workingVersions = meta.versions.filter(
				(v) => !problematicVersions.includes(v),
			);
			setVersions(workingVersions);
			if (!workingVersions.length) {
				throw new Error("no working version found");
			}
			problematicVersions.map((_v) => {
				delete loadedComponents[_v];
			});

			const _choice = problematicVersions.includes(meta.choice)
				? `${workingVersions[0]}`
				: `${meta.choice}`;

			setChoice(_choice);

			setLayoutPreviewUrl(
				`/_cofounder/generated/layouts/views/${viewId}.${_choice}.png`,
			);

			/*
			console.log({
				viewId: query.viewId,
				workingVersions,
				problematicVersions,
				choice: workingVersions[0],
				loadedComponents,
			});
			*/

			setComponents(loadedComponents);
			setComponent(() => loadedComponents[_choice]);
		} catch (e) {
			// console.log({ "genui:error": e });
			// await callApi({ operation: `new` });
			/*
				reload this current react component right here at this point in some way
			*/
			setLoaded(false);
		}
		setReady(true);
	};

	useEffect(() => {
		if (loaded) return;
		loadComponent();
	}, [viewId, loaded]);

	const _delayed_api_updateVersionPreference = async ({ version }) => {
		await new Promise((resolve) => setTimeout(resolve, 500));
		await api_updateVersionPreference({ version });
	};
	useEffect(() => {
		// should cascade alongside error-boundary to filter out bad components
		if (versionsWithImportProblems.length) {
			setVersions((prev) => {
				const filteredVersions = prev.filter(
					(version) => !versionsWithImportProblems.includes(version),
				);
				if (
					filteredVersions.length &&
					versionsWithImportProblems.includes(choice)
				) {
					setComponent(null);
					setChoice("");
					const newChoice = filteredVersions[0];
					setChoice(newChoice);
					setComponent(() => components[newChoice]);

					_delayed_api_updateVersionPreference({ version: newChoice });
				} else {
					setComponent(null);
					setChoice("");
				}
				return filteredVersions;
			});
		}
	}, [versionsWithImportProblems]);

	const handleVersionChange = (version: string) => {
		console.log(`handleVersionChange : ${viewId} : ${version}`);
		if (version != choice) {
			setChoice(version);
			api_updateVersionPreference({ version });
			setLayoutPreviewUrl(
				`/_cofounder/generated/layouts/views/${viewId}.${version}.png`,
			);
		}
		setComponent(() => components[version]);
	};

	return (
		<>
			{processing && (
				<div className="m-2 p-4 bg-gray-100 text-black rounded text-left text-base">
					<div className="mb-2">
						building <span className="font-semibold">{viewId}</span>
						<span className="animate-ping"> ...</span>
					</div>
					{<GenUiPlaceholder /> || ``}
				</div>
			)}
			{(loaded && ready && !processing && !versions.length && (
				<div className="m-2 p-4 w-[80vw] mx-auto bg-[#333] rounded rounded-xl text-white text-sm">
					<div className="p-2">
						no working version for <strong>{viewId}</strong> ; Try to regenerate ?
					</div>
					<button
						id="new_generation"
						className="flex mb-1 rounded text-left text-sm p-4 bg-[#000080] hover:bg-[#0000a0] duration-100 w-full max-w-[30vw]"
						onClick={() => {
							api_regenerateComponent();
						}}
					>
						<RefreshCcw className="mr-2 w-4 h-4" />
						<span>
							New Generation
							<br />
							<span className="text-xs opacity-50">
								{"might trigger 2 passes : recode -> redesign"}
							</span>
						</span>
					</button>
				</div>
			)) ||
				""}
			{(versions.length && Component && (
				<div className="relative group/view">
					<ErrorBoundary
						key={choice}
						type="views"
						choice={choice}
						setVersionsWithImportProblems={setVersionsWithImportProblems}
					>
						{(Component && (
							<div
								className={
									cmdk
										? `border-0 group-hover/view:border group-hover/view:border-2 group-hover/view:border-dashed group-hover/view:border-black duration-100 group-hover/view:rounded`
										: `border-0`
								}
							>
								<div
									ref={ref}
									key={choice}
									onMouseOver={() => setIsOpenTooltip(true)}
									onMouseOut={() => setIsOpenTooltip(false)}
								>
									<Component {...(_query || {})} />
								</div>
							</div>
						)) || <></>}
					</ErrorBoundary>
					{cmdk && (
						<div
							ref={tooltipRef}
							id="version_selector_popup"
							className="absolute top-2 right-2 p-2
                          border border-4 border-gray-300
                          bg-white text-black rounded rounded-lg shadow
                          border
                          hidden group-hover/view:block opacity-0 group-hover/view:opacity-100
                          text-left text-xs
                          min-w-[40vw] lg:min-w-[10vw]
                          z-0	group-hover/view:z-[9999]
													shadow shadow-xl
                          transition-opacity duration-300"
						>
							<p className="text-xs border-b pb-2 my-2">
								<span className="font-semibold">{viewId}</span> versions
							</p>

							{!processing ? (
								<>
									<button
										id="new_generation"
										className="flex mb-1 text-left text-xs border-b p-2 bg-gray-50 hover:bg-gray-100 duration-100 w-full"
										onClick={() => {
											api_regenerateComponent();
										}}
									>
										<RefreshCcw className="mr-2 w-4 h-4" />
										<span>
											New Generation
											<br />
											<span className="text-xs opacity-50">
												{"might trigger 2 passes : recode -> redesign"}
											</span>
										</span>
									</button>

									<div
										id="new_iteration_group"
										className="flex flex-col relative"
										onMouseEnter={() => setNewMenu(true)}
										onMouseLeave={() => setNewMenu(false)}
										onMouseOver={() => setIsOpenTooltipTab(true)}
										onMouseOut={() => setIsOpenTooltipTab(false)}
										onClick={() => setNewMenu(true)}
									>
										<button
											id="new_iteration"
											className="flex text-left text-xs border-b p-2 bg-gray-50 hover:bg-gray-100 duration-100"
										>
											<PencilRuler className="mr-2 w-4 h-4" />
											<span>
												Edit
												<br />
												<span className="text-xs opacity-50">
													{"new iteration from extra notes & screenshot"}
												</span>
											</span>
										</button>
										{newMenu && (
											<div
												ref={tooltipTabRef}
												id="new_iteration_menu"
												className="absolute right-0 top-10 md:right-full md:top-0 bg-white border rounded p-2 shadow-lg
												min-w-[60vw] max-w-[60vw] md:min-w-[30vw] md:max-w-[60vw] break-words"
											>
												{image && (
													<>
														<div className="text-black text-xs py-2 border-b mb-2 text-right opacity-80">
															Attached current view screenshot
														</div>
														<img
															src={image}
															title="Current screenshot of the view"
															alt="Current screenshot of the view"
															className="w-[20vw] h-[20vh] object-contain m-2 mx-auto"
														/>
													</>
												)}
												<textarea
													className="border rounded p-2 text-sm w-full"
													rows={3}
													placeholder="describe edits here ..."
													value={editUserText}
													onChange={(e) => setEditUserText(e.target.value)}
												></textarea>

												{editUserText.length ? (
													<>
														<div className="flex items-center my-2 p-2">
															<label
																htmlFor="editLayout"
																className="inline-flex items-center cursor-pointer"
															>
																<input
																	type="checkbox"
																	id="editLayout"
																	checked={editEnableDesigner}
																	onChange={(e) => setEditEnableDesigner(e.target.checked)}
																	className="sr-only peer"
																/>
																<div className="relative w-11 h-6 after:h-5 after:w-5 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-gray-300  peer-checked:bg-[#222] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:transition-all"></div>
																<p className="ms-3 text-sm text-gray-900 mr-2">
																	Redesign using{" "}
																	<strong>
																		{editEnableDesigner ? `{designer/layoutv1 + code}` : `code`}
																	</strong>{" "}
																	{(!editEnableDesigner && "only") || ""}
																	<br />
																	<span className="text-xs opacity-80">
																		{editEnableDesigner
																			? `Designer creates a new design before recoding the view`
																			: `Useful for ie. quick fixes / adding lightweight packages / ...`}
																	</span>
																</p>
															</label>
														</div>
														<button
															className="mt-2 text-sm bg-[#222] hover:bg-[#000] duration-100 w-full text-white shadow rounded p-2"
															onClick={() => {
																api_iterateComponent();
															}}
														>
															Start
														</button>
													</>
												) : (
													<></>
												)}
											</div>
										)}
									</div>
								</>
							) : (
								<div className="animate-pulse text-center">{`[...] processing [...]`}</div>
							)}

							{!processing &&
								versions.map((version) => (
									<div
										key={version}
										onClick={() => handleVersionChange(version)}
										onMouseEnter={() => {
											setComponent(() => components[version]);
											setLayoutPreviewUrl(
												`/_cofounder/generated/layouts/views/${viewId}.${version}.png`,
											);
										}}
										onMouseLeave={() => {
											setComponent(() => components[choice]);
											setLayoutPreviewUrl(
												`/_cofounder/generated/layouts/views/${viewId}.${choice}.png`,
											);
										}}
										className="cursor-pointer duration-100 hover:bg-gray-300 p-1 hover:p-2 rounded text-xs"
									>
										<div className="grid grid-cols-2">
											{choice === version ? (
												<span className="font-semibold">{version}</span>
											) : (
												<span>{version}</span>
											)}
										</div>
									</div>
								))}

							{(layoutPreviewUrl?.length && layoutPreviewBlob?.length && (
								<img
									src={layoutPreviewBlob}
									title="Reference layout design generated by Cofounder for this ui component version"
									alt="Reference layout design generated by Cofounder for this ui component version"
									className="mx-auto w-[25vw] h-[25vh] object-contain"
								/>
							)) || (
								<div className="mx-auto w-[25vw] h-[25vh] object-contain text-xl opacity-40 p-12 whitespace-pre-line break-words">
									No reference layout design made for this version
								</div>
							)}
						</div>
					)}
				</div>
			)) || <></>}
		</>
	);
};

export default GenUiView;
