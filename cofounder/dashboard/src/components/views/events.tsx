import React, { useCallback, useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setProject } from "@/store/main";

const Events: React.FC<{ project: string }> = ({ project }) => {
	const dispatch = useDispatch();
	const streams = useSelector((state: any) => state.project.streamEvents);
	const [sidebarExpanded, setSidebarExpanded] = useState(true);
	const [streamExpandedKey, setStreamExpandedKey] = useState("");
	const [streamStayExpanded, setStreamStayExpanded] = useState(false);

	const streamContainerRef = useRef<HTMLDivElement>(null);

	/*
    useEffect(() => {
    if (streamContainerRef.current) {
      streamContainerRef.current.scrollTop = streamContainerRef.current.scrollHeight;
    }
  }, [node_stream]);
  */

	useEffect(() => {
		const filtered_streams = Object.entries(streams).filter(
			([_, item]) => item.is_running,
		);
		if (filtered_streams.length && streamExpandedKey?.length) {
			streamContainerRef.current.scrollTop =
				streamContainerRef.current.scrollHeight;
		}
	}, [streams]);

	return (
		<>
			{(Object.keys(streams).length && streamExpandedKey?.length && (
				<>
					<div
						className="fixed top-0 left-0 inset-0 flex items-start justify-center
												h-[80vh] w-[75vw] overflow-hidden"
						style={{ zIndex: 999 }}
					>
						<div
							className={`text-white text-sm font-light
													overflow-auto shadow-2xl rounded rounded-lg
													bg-[#444]/30 backdrop-blur-md
													whitespace-pre-wrap break-words
													mt-[10vh]
													w-full
                          max-h-[65vh]
													m-12 p-12
													duration-300`}
							ref={streamContainerRef}
						>
							<p>{streams[streamExpandedKey]?.data?.data?.trim()}</p>
						</div>
					</div>
				</>
			)) || <></>}

			<div
				className={`dark text-white
											fixed top-0 right-0 m-4
											${
												sidebarExpanded
													? "w-[25vw] h-[70vh] p-8 bg-[#333]/20"
													: "w-[3vw] h-[70vh] flex items-center justify-center text-center cursor-pointer bg-[#666]/20 hover:bg-white/20"
											}
											backdrop-blur-md
											rounded rounded-lg duration-300`}
				onClick={() => {
					if (!sidebarExpanded) setSidebarExpanded(true);
				}}
				style={{ zIndex: 2 }}
			>
				<div>
					<a
						className={`cursor-pointer hover:text-[#ccc] duration-200  ${sidebarExpanded ? "" : "text-xl font-light"}`}
						onClick={() => {
							setSidebarExpanded(!sidebarExpanded);
						}}
					>
						{`${sidebarExpanded ? "Operations Streams >" : "<"}`}
					</a>
					{(sidebarExpanded && (
						<>
							<div className="py-2 mt-2 border-t border-[#222] max-h-[60vh] overflow-auto">
								{(!Object.keys(streams).length && (
									<>
										<h2 className="opacity-50 text-lg font-light">
											No current streaming operations
										</h2>
									</>
								)) || <></>}

								{Object.entries(streams)
									.filter(([_, item]) => item.is_running)
									.map(([key, item], index) => (
										<div
											key={key}
											className={`group p-2 my-2 rounded bg-[#222] hover:bg-black cursor-pointer duration-200 font-light whitespace-pre-wrap break-words`}
											onMouseEnter={() => {
												setStreamExpandedKey(key);
											}}
											onMouseLeave={() => {
												if (!streamStayExpanded) {
													setStreamExpandedKey("");
												}
											}}
											onClick={() => {
												if (!streamStayExpanded) {
													setStreamExpandedKey(key);
													setStreamStayExpanded(true);
												} else {
													setStreamExpandedKey("");
													setStreamStayExpanded(false);
												}
											}}
										>
											<div className="flex gap-2 items-center mb-1">
												<div role="status">
													<svg
														aria-hidden="true"
														className="w-3 h-3 text-gray-200 animate-spin fill-[#666]"
														viewBox="0 0 100 101"
														fill="none"
														xmlns="http://www.w3.org/2000/svg"
													>
														<path
															d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
															fill="currentColor"
														/>
														<path
															d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
															fill="currentFill"
														/>
													</svg>
													<span className="sr-only">Loading...</span>
												</div>
												<h2 className="text-sm">
													{item.meta?.name ? item.meta.name : item.data.key}
												</h2>
											</div>
											{(item.meta?.desc && (
												<>
													<div className="flex gap-2 items-center mb-1">
														<div role="status opacity-0">
															<svg
																aria-hidden="true"
																className="opacity-0 w-3 h-3 text-gray-200 animate-spin fill-[#666]"
																viewBox="0 0 100 101"
																fill="none"
																xmlns="http://www.w3.org/2000/svg"
															>
																<path
																	d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
																	fill="currentColor"
																/>
																<path
																	d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
																	fill="currentFill"
																/>
															</svg>
														</div>
														<h3 className="text-xs text-[#aaa]">{item.meta?.desc}</h3>
													</div>
												</>
											)) || <></>}
										</div>
									))}
							</div>
						</>
					)) || <></>}
				</div>
			</div>
		</>
	);
};

export default Events;
