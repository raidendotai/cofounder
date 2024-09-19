// @ts-ignore

import React, { useEffect, useRef, useState } from "react";
import { ErrorBoundary } from "@/_cofounder/genui/error-boundary";
import GenUiPlaceholder from "@/_cofounder/genui/genui-placeholder";
import { useScreenshot } from "use-screenshot-hook";
import { createFileName } from "use-react-screenshot";
import { RefreshCcw, PencilRuler } from "lucide-react";
import meta from "@/_cofounder/meta.json";

interface GenUiSectionProps {
	//component: { [key: string]: any };
	[key: string]: any;
}

const GenUiSection: React.FC<GenUiSectionProps> = (query) => {
	const COFOUNDER_LOCAL_API = `{COFOUNDER_LOCAL_API_BASE_URL}`;

	const sectionId = query.sectionId;
	let _query = { ...query };
	delete _query.sectionId;
	// console.log({ "genui:section": query });

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
	const [editUserLayout, setEditUserLayout] = useState(true);

	const [inferenceStream, setInferenceStream] = useState("");
	const [processing, setProcessing] = useState(false);

	const [isOpenTooltip, setIsOpenTooltip] = useState(false);
	const [isOpenTooltipTab, setIsOpenTooltipTab] = useState(false);
	const [layoutPreviewUrl, setLayoutPreviewUrl] = useState(``);

	// _____________________________________________________________________
	const [cmdk, setCmdk] = useState(() => {
		// Retrieve the initial state from local storage or default to false
		const savedCmdk = localStorage.getItem("cmdkState");
		return savedCmdk === "true"; // Convert string to boolean
	});

	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setCmdk((prev) => {
					const newState = !prev;
					localStorage.setItem("cmdkState", newState.toString()); // Save the new state to local storage
					return newState;
				});
			} else if (e.key === "Escape") {
				setCmdk(false);
				localStorage.setItem("cmdkState", "false"); // Reset state in local storage
			}
		};
		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	const ref = useRef(null);
	const tooltipRef = useRef<HTMLDivElement | null>(null);
	const tooltipTabRef = useRef<HTMLDivElement | null>(null);
	const handleDropdownPositionTooltip = async () => {
		await new Promise((resolve) => setTimeout(resolve, 100));
		const dropdownRect = tooltipRef.current?.getBoundingClientRect();
		console.log({ dropdownRect });
		const dropdownRightX = dropdownRect.x + dropdownRect.width;
		const dropdownBottomY = dropdownRect.y + dropdownRect.height;
		const screenPadding = 0;

		// Horizontal positioning
		if (dropdownRect.x < 0) {
			tooltipRef.current.style.left = "0";
			tooltipRef.current.style.right = "auto";
			tooltipRef.current.style.transform = `translateX(${-dropdownRect.x + screenPadding}px)`;
		} else if (dropdownRightX > window.innerWidth) {
			tooltipRef.current.style.left = "auto";
			tooltipRef.current.style.right = "0";
			tooltipRef.current.style.transform = `translateX(${window.outerWidth - dropdownRect.x - screenPadding}px)`;
		}

		// Vertical positioning
		/*if (dropdownRect.y < 0) {
      tooltipRef.current.style.top = '0';
      tooltipRef.current.style.bottom = 'auto';
      tooltipRef.current.style.transform += ` translateY(${-dropdownRect.y + screenPadding}px)`;
    }else if (dropdownBottomY > window.innerHeight ) {
      tooltipRef.current.style.top = 'auto';
      tooltipRef.current.style.bottom = '0';
      tooltipRef.current.style.transform += ` translateY(${(window.innerHeight - dropdownRect.y) - screenPadding}px)`;
    }*/
	};
	useEffect(() => {
		if (isOpenTooltip) {
			handleDropdownPositionTooltip();
		}
	}, [isOpenTooltip]);

	useEffect(() => {
		if (Component) {
			_delayed_screenshot();
		}
	}, [Component]);

	const handleDropdownPositionTooltipTab = () => {
		const tooltipRootRect = tooltipRef.current?.getBoundingClientRect();
		const dropdownRect = tooltipTabRef.current?.getBoundingClientRect();
		console.log({ dropdownRect });
		const dropdownRightX = dropdownRect.x + dropdownRect.width;
		const dropdownBottomY = dropdownRect.y + dropdownRect.height;
		const screenPadding = 0;

		// Horizontal positioning
		if (dropdownRect.x < 0) {
			tooltipTabRef.current.style.left = "0";
			tooltipTabRef.current.style.right = "auto";
			tooltipTabRef.current.style.transform = `translateX(${-dropdownRect.x + screenPadding}px)`;
		} else if (dropdownRightX > window.outerWidth) {
			tooltipTabRef.current.style.left = "auto";
			tooltipTabRef.current.style.right = "0";
			tooltipTabRef.current.style.transform = `translateX(${window.outerWidth - dropdownRect.x - tooltipRootRect.width - screenPadding}px)`;
		}
		/*
    // Vertical positioning
    if (dropdownRect.y < 0) {
      tooltipTabRef.current.style.top = '0';
      tooltipTabRef.current.style.bottom = 'auto';
      tooltipTabRef.current.style.transform += ` translateY(${-dropdownRect.y + screenPadding}px)`;
    } else if (dropdownBottomY > window.innerHeight) {
      tooltipTabRef.current.style.top = 'auto';
      tooltipTabRef.current.style.bottom = '0';
      tooltipTabRef.current.style.transform += ` translateY(${(window.innerHeight - dropdownRect.y) - screenPadding}px)`;
    }*/
	};
	useEffect(() => {
		if (isOpenTooltipTab) {
			handleDropdownPositionTooltipTab();
		}
	}, [isOpenTooltipTab]);

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
							sections: {
								[sectionId]: `${version}`,
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
							sections: sectionId,
						},
					},
				}),
			});
		} catch (error) {
			console.error({ "genui:callApi:error": error });
		}
		setProcessing(false);
	};

	const api_IterateComponent = async () => {
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
							sections: {
								[sectionId]: {
									user: {
										text: editUserText,
										attachments: [], // later, can attach image
									},
									screenshot: {
										base64: image ? image : false,
									},
									new: {
										layout: editUserLayout, // whether to redo layout design or just code
										code: true, // no need to mention but for clarity
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
		// setLoaded(false);
		setNewMenu(false);
		setInferenceStream("");
		setProcessing(false);

		try {
			const _meta = await import(
				`@/_cofounder/generated/sections/${sectionId}/meta.json`
			);
			const meta = _meta.default; // Access the default export
			// console.log({ id, choice: meta.choice, versions: meta.versions });

			let loadedComponents: { [key: string]: React.FC } = {};
			let problematicVersions: string[] = [];
			await Promise.all(
				meta.versions
					.sort()
					.reverse()
					.map(async (version: string) => {
						try {
							const { default: LoadedVersionComponent } = await import(
								`@/_cofounder/generated/sections/${sectionId}/${version}.tsx`
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
				`/_cofounder/generated/layouts/sections/${sectionId}.${_choice}.png`,
			);

			/*
      console.log({
        sectionId: query.sectionId,
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
	}, [sectionId, loaded]);

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
		console.log(`handleVersionChange : ${sectionId} : ${version}`);
		if (version != choice) {
			setChoice(version);
			api_updateVersionPreference({ version });
			setLayoutPreviewUrl(
				`/_cofounder/generated/layouts/sections/${sectionId}.${version}.png`,
			);
		}
		setComponent(() => components[version]);
	};

	return (
		<>
			{(!Component || processing) && (
				<div className="m-1 p-2 bg-gray-100 text-black rounded text-left text-sm">
					<div className="mb-2">
						building <span className="font-semibold">{sectionId}</span>
						<span className="animate-ping"> ...</span>
					</div>
					{<GenUiPlaceholder /> || ``}
				</div>
			)}
			{(loaded && ready && !processing && !versions.length && (
				<div className="p-2 w-[100vw] bg-red-800 text-white text-sm">
					no working version for {sectionId} ; Try to regenerate ?
				</div>
			)) ||
				""}
			{(versions.length && Component && !processing && (
				<div className="relative group/section">
					<ErrorBoundary
						key={choice}
						type="sections"
						choice={choice}
						setVersionsWithImportProblems={setVersionsWithImportProblems}
					>
						{(Component && (
							<div
								className={
									cmdk
										? `border-0 group-hover/section:border group-hover/section:border-2 group-hover/section:border-dashed group-hover/section:border-black duration-100 group-hover/section:rounded`
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
							className="absolute top-0 right-0 p-2
                          border border-4 border-gray-300
                          bg-white text-black rounded rounded-lg shadow
                          border
                          hidden group-hover/section:block opacity-0 group-hover/section:opacity-100
                          text-left text-xs
                          min-w-[10vw]
                          z-0	group-hover/section:z-[9999]
                          transition-opacity duration-300"
							style={{ transform: "translate(100%, 0%)" }}
						>
							<img
								src={layoutPreviewUrl}
								title="Reference layout design generated by Cofounder for this ui component version"
								alt="Reference layout design generated by Cofounder for this ui component version"
								className="w-[200px] h-[200px] object-contain"
							/>
							{!processing ? (
								<>
									<button
										id="test_screenshot"
										className="flex mb-1 text-left text-xs border-b p-2 bg-gray-50 hover:bg-gray-100 duration-100 w-full"
										onClick={testScreenshot}
									>
										test_screenshot
									</button>
									<button
										id="new_generation"
										className="flex mb-1 text-left text-xs border-b p-2 bg-gray-50 hover:bg-gray-100 duration-100 w-full"
										onClick={() => {
											api_regenerateComponent();
										}}
									>
										<RefreshCcw className="mr-2 w-4 h-4" /> New Generation
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
											<PencilRuler className="mr-2 w-4 h-4" /> Edit
										</button>
										{newMenu && (
											<div
												ref={tooltipTabRef}
												id="new_iteration_menu"
												className="absolute left-full top-0 bg-white border rounded p-2 shadow-lg min-w-[20vw] max-w-[35vw] break-words"
											>
												<textarea
													className="border rounded p-1 text-xs w-full"
													rows={3}
													placeholder="describe edits here ..."
													value={editUserText}
													onChange={(e) => setEditUserText(e.target.value)}
												></textarea>

												{editUserText.length ? (
													<>
														<div className="flex items-center mt-2">
															<label
																htmlFor="editLayout"
																className="inline-flex items-center cursor-pointer"
															>
																<input
																	type="checkbox"
																	id="editLayout"
																	checked={editUserLayout}
																	onChange={(e) => setEditUserLayout(e.target.checked)}
																	className="sr-only peer"
																/>
																<div className="relative w-11 h-6 after:h-5 after:w-5 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-gray-300  peer-checked:bg-[#222] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:transition-all"></div>
																<span className="ms-3 text-xs text-gray-900 mr-2">
																	{editUserLayout ? `Redesign Layout + Code` : `Code Only`}
																</span>
															</label>
														</div>
														<button
															className="mt-2 text-xs bg-[#222] hover:bg-[#000] duration-100 w-full text-white shadow rounded p-2"
															onClick={() => {
																api_IterateComponent();
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

							<p className="text-xs border-b pb-2 pt-4">
								<span className="font-semibold">{sectionId}</span> versions
							</p>

							{versions.map((version) => (
								<div
									key={version}
									onClick={() => handleVersionChange(version)}
									onMouseEnter={() => {
										setComponent(() => components[version]);
										setLayoutPreviewUrl(
											`/_cofounder/generated/layouts/sections/${sectionId}.${version}.png`,
										);
									}}
									onMouseLeave={() => {
										setComponent(() => components[choice]);
										setLayoutPreviewUrl(
											`/_cofounder/generated/layouts/sections/${sectionId}.${choice}.png`,
										);
									}}
									className="cursor-pointer duration-100 hover:bg-gray-300 p-1 hover:p-2 rounded text-xs"
								>
									<div className="grid grid-cols-2">
										{version === choice ? (
											<span className="font-semibold">{version}</span>
										) : (
											<span>{version}</span>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)) || <></>}
		</>
	);
};

export default GenUiSection;
