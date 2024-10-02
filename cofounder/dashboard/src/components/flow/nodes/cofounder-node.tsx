import React, { memo, useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";
import { useDispatch, useSelector } from "react-redux";
import yaml from "yaml";
import colormap from "colormap";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import yaml_syntax from "react-syntax-highlighter/dist/esm/languages/prism/yaml";
import js_syntax from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import sql_syntax from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import typescript_syntax from "react-syntax-highlighter/dist/esm/languages/prism/typescript";

import {
	dracula,
	duotoneDark,
	vscDarkPlus,
	zTouch,
} from "react-syntax-highlighter/dist/esm/styles/prism";

import zTouchEdit from "@/components/flow/helpers/zTouchEdit.js";

export default memo(({ data, isConnectable }) => {
	const color_map = {
		pm: "#FFA500",
		db: "#000080",
		backend: "#FF10F0",
		ux: "#A020F0",
		"webapp-structure": "#39FF14",
		"webapp-view": "#05D9FF",
	};
	SyntaxHighlighter.registerLanguage("yaml", yaml_syntax);
	SyntaxHighlighter.registerLanguage("js", js_syntax);
	SyntaxHighlighter.registerLanguage("sql", sql_syntax);
	SyntaxHighlighter.registerLanguage("typescript", typescript_syntax);

	const dispatch = useDispatch();
	const node_stream = !data.key.includes("webapp.react.views")
		? useSelector((state: any) => state.project.streamEvents[data.key])
		: useSelector(
				(state: any) =>
					state.project.streamEvents[`${data.key.split(".").slice(0, 4).join(".")}`],
			);

	const node_data = useSelector(
		(state: any) => state.project.projectData[data.key],
	);
	let node_extra;
	if (data.key.includes("webapp.react.views")) {
		node_extra = useSelector(
			(state: any) =>
				state.project.projectData[data.key.replace(".react.", ".layout.")],
		);
	}

	const streamContainerRef = useRef<HTMLDivElement>(null);
	const [metaHeaderClass, setMetaHeaderClass] = useState("");
	const [refresh, setRefresh] = useState(Date.now());

	function getColor() {
		return data?.meta?.type && color_map[data.meta.type]
			? `[${color_map[data.meta.type]}]`
			: "none";
	}
	function getLanguage() {
		if (data.key === "db.postgres") return "sql";
		return "yaml";
	}
	function getContent() {
		if (!node_data) return "";
		if (data.key === "db.postgres") return node_data;
		return yaml.stringify(node_data);
	}

	const [selectedVersion, setSelectedVersion] = useState<string | boolean>(
		false,
	);
	useEffect(() => {
		if (data.key.includes("webapp.")) {
			if (node_data && Object.keys(node_data).length) {
				setSelectedVersion(Object.keys(node_data).reverse()[0]);
			}
		}
	}, [node_data]);

	/*
	useEffect(() => {
		setRefresh(Date.now())
	}, [node_data , node_stream , node_extra]);
	*/

	function getMinifiedContent() {
		// webapp component with versionning case
		if (
			data.key.includes("webapp.react.root") ||
			data.key.includes("webapp.react.store")
		) {
			return (
				<div className={`grid grid-cols-12`}>
					<div className="col-span-9 grid grid-cols-2">
						{(node_stream?.is_running && node_stream?.data && (
							<pre
								className="p-2 m-2 max-h-[40vh] overflow-auto whitespace-pre-wrap break-words"
								style={{ fontFamily: "JetBrains Mono", fontWeight: 400 }}
							>
								<div className={`mx-2`}>
									<div className="flex justify-center items-center p-4 m-4">
										<div className="animate-spin rounded-full h-5 w-5 border-r border-[#aaa]"></div>
									</div>
								</div>
							</pre>
						)) || <></>}

						<pre
							ref={streamContainerRef}
							className={`p-2 m-2 max-h-[40vh] overflow-auto whitespace-pre-wrap break-words duration-200
													${node_stream?.is_running && node_stream?.data ? "" : "col-span-2"}`}
							style={{ fontFamily: "JetBrains Mono", fontWeight: 400 }}
						>
							{(node_stream?.is_running && node_stream?.data && (
								<>{node_stream.data.data}</>
							)) || (
								<>
									{selectedVersion && node_data
										? node_data[selectedVersion].tsx.slice(0, 300) + " ..."
										: ""}
								</>
							)}
						</pre>
					</div>
					{(node_stream?.is_running && node_stream?.data && (
						<>
							<div className="col-span-3 text-sm p-2 m-2">
								<h3 className="py-2 mb-2 opacity-50">processing</h3>
							</div>
						</>
					)) || (
						<>
							{(node_data && (
								<div className="col-span-3 text-sm p-2 m-2">
									<h3 className="border-b py-2 mb-2 border-[#333]">versions</h3>
									<div className="grid">
										{Object.entries(node_data)
											.reverse()
											.map(([version, item], index) => (
												<a
													key={index}
													className={`rounded cursor-pointer p-2 mb-1 hover:bg-[#222] duration-200 ${
														selectedVersion === version ? "bg-[#333]" : ""
													} `}
													onClick={() => {
														setSelectedVersion(version);
													}}
												>
													{version}
												</a>
											))}
									</div>
								</div>
							)) ||
								""}
						</>
					)}
				</div>
			);
		}

		// webapp view with layout and versionning case
		if (data.key.includes("webapp.react.views")) {
			return (
				<div className={`grid grid-cols-12`}>
					<div className={`col-span-9 grid grid-cols-2`}>
						{(node_stream?.is_running && node_stream?.data && (
							<pre
								className="p-2 m-2 max-h-[40vh] overflow-auto whitespace-pre-wrap break-words"
								style={{ fontFamily: "JetBrains Mono", fontWeight: 400 }}
							>
								<div className={`mx-2`}>
									<div className="flex justify-center items-center p-4 m-4">
										<div className="animate-spin rounded-full h-5 w-5 border-r border-[#aaa]"></div>
									</div>
								</div>
							</pre>
						)) || <></>}

						<pre
							ref={streamContainerRef}
							className={`p-2 m-2 max-h-[40vh] overflow-auto whitespace-pre-wrap break-words duration-200
													${node_stream?.is_running && node_stream?.data ? "" : "col-span-2"}
													text-xs
												`}
							style={{ fontFamily: "JetBrains Mono", fontWeight: 400 }}
						>
							{(node_stream?.is_running && node_stream?.data && (
								<>{node_stream.data.data}</>
							)) || (
								<>
									{selectedVersion && node_data
										? node_data[selectedVersion].tsx.slice(0, 300) + " ..."
										: ""}
								</>
							)}
						</pre>
					</div>

					{(node_stream?.is_running && node_stream?.data && (
						<>
							<div className="col-span-3 text-sm p-2 m-2">
								<h3 className="py-2 mb-2 opacity-50">processing</h3>
							</div>
						</>
					)) || (
						<>
							<div className="col-span-3 text-sm p-2 m-2 max-h-[40vh] overflow-auto">
								<h3 className="border-b py-2 mb-2 border-[#333]">versions</h3>
								<div className="grid">
									{(node_data &&
										Object.entries(node_data)
											.reverse()
											.map(([version, item], index) => (
												<a
													key={index}
													className={`rounded cursor-pointer p-2 mb-1 hover:bg-[#222] duration-200 ${
														selectedVersion === version ? "bg-[#333]" : ""
													} `}
													onClick={() => {
														setSelectedVersion(version);
													}}
												>
													{version}
												</a>
											))) || <></>}
								</div>
							</div>
						</>
					)}

					{(node_extra &&
						selectedVersion &&
						node_extra[selectedVersion] &&
						(node_extra[selectedVersion]?.render?.image?.url?.length ||
							node_extra[selectedVersion]?.render?.image?.local?.length) && (
							<div className="col-span-12 p-2 m-2 text-xs">
								<img
									title={`Design mockup reference generated for ${data.key}, version : ${selectedVersion}`}
									alt={`Design mockup reference generated for ${data.key}, version : ${selectedVersion}`}
									src={
										node_extra[selectedVersion]?.render?.image?.url?.length
											? node_extra[selectedVersion]?.render?.image?.url
											: `http://localhost:667/storage/${node_extra[selectedVersion]?.render?.image?.local.split("/storage/")[1]}`
									}
								></img>
							</div>
						)) || <></>}
				</div>
			);
		}

		// default case
		return (
			<div
				className={`grid ${node_stream?.is_running && node_stream?.data ? "grid-cols-2" : ""}`}
			>
				<div>
					<pre
						className="p-2 m-2 max-h-[25vh] overflow-auto whitespace-pre-wrap break-words"
						style={{ fontFamily: "JetBrains Mono", fontWeight: 400 }}
					>
						{(node_stream?.is_running && node_stream?.data && (
							<>
								<div className="flex justify-center items-center p-4 m-4">
									<div className="animate-spin rounded-full h-5 w-5 border-r border-[#aaa]"></div>
								</div>
							</>
						)) || <></>}
						{(node_data && (
							<>
								{typeof node_data === "string"
									? node_data.slice(0, 100) + " ..."
									: yaml.stringify(node_data).slice(0, 100) + " ..."}
							</>
						)) || <></>}
					</pre>
				</div>
				{(node_stream?.is_running && node_stream?.data && (
					<div>
						<pre
							ref={streamContainerRef}
							className="p-2 m-2 max-h-[25vh] overflow-auto whitespace-pre-wrap break-words font-light"
						>
							{node_stream.data.data}
						</pre>
					</div>
				)) || <></>}
			</div>
		);
	}

	function getExpandedContent() {
		// webapp root/store case
		if (
			data.key.includes("webapp.react.root") ||
			data.key.includes("webapp.react.store")
		) {
			if (!selectedVersion) return <></>;
			return (
				<>
					{(selectedVersion && node_data && (
						<pre className="rounded grid grid-cols-6 gap-2 rounded-lg p-2 text-white text-xs overflow-auto whitespace-pre-wrap break-words">
							<SyntaxHighlighter
								className="col-span-4 rounded bg-black text-xs"
								language={"typescript"}
								style={zTouchEdit}
								wrapLines={true}
								wrapLongLines={true}
							>
								{node_data[selectedVersion].tsx}
							</SyntaxHighlighter>
							<SyntaxHighlighter
								className="col-span-2 rounded bg-black text-xs"
								language={getLanguage()}
								style={zTouchEdit}
								wrapLines={true}
								wrapLongLines={true}
							>
								{yaml.stringify({
									...(node_data[selectedVersion]?.dependencies
										? { dependencies: node_data[selectedVersion].dependencies }
										: {}),
									...(node_data[selectedVersion]?.analysis
										? { analysis: node_data[selectedVersion].analysis }
										: {}),
								})}
							</SyntaxHighlighter>
						</pre>
					)) ||
						""}
				</>
			);
		}
		// webapp view case
		if (data.key.includes("webapp.react.views")) {
			if (!selectedVersion) return <></>;
			return (
				<>
					{(selectedVersion && node_data && (
						<pre className="rounded grid grid-cols-6 gap-2 rounded-lg p-2 text-white text-xs overflow-auto whitespace-pre-wrap break-words">
							<SyntaxHighlighter
								className="col-span-4 rounded bg-black text-xs"
								language={"typescript"}
								style={zTouchEdit}
								wrapLines={true}
								wrapLongLines={true}
							>
								{node_data[selectedVersion].tsx}
							</SyntaxHighlighter>
							<SyntaxHighlighter
								className="col-span-2 rounded bg-black text-xs"
								language={getLanguage()}
								style={zTouchEdit}
								wrapLines={true}
								wrapLongLines={true}
							>
								{yaml.stringify({
									...(node_data[selectedVersion]?.dependencies
										? { dependencies: node_data[selectedVersion].dependencies }
										: {}),
									...(node_data[selectedVersion]?.analysis
										? { analysis: node_data[selectedVersion].analysis }
										: {}),
								})}
							</SyntaxHighlighter>
						</pre>
					)) ||
						""}
				</>
			);
		}

		// server case
		if (data.key === "backend.server.main") {
			return (
				<>
					{(node_data && (
						<pre className="rounded grid grid-cols-6 gap-2 rounded-lg p-2 text-white text-xs overflow-auto whitespace-pre-wrap break-words">
							<SyntaxHighlighter
								className="col-span-4 rounded bg-black text-xs"
								language={"javascript"}
								style={zTouchEdit}
								wrapLines={true}
								wrapLongLines={true}
							>
								{node_data.mjs}
							</SyntaxHighlighter>
							<SyntaxHighlighter
								className="col-span-2 rounded bg-black text-xs"
								language={getLanguage()}
								style={zTouchEdit}
								wrapLines={true}
								wrapLongLines={true}
							>
								{yaml.stringify({
									env: node_data.env,
									dependencies: node_data.dependencies,
								})}
							</SyntaxHighlighter>
						</pre>
					)) ||
						""}
				</>
			);
		}
		// default
		return (
			<>
				<pre className="rounded rounded-lg p-2 text-white text-xs overflow-auto whitespace-pre-wrap break-words">
					<SyntaxHighlighter
						className="rounded bg-black text-xs"
						language={getLanguage()}
						style={zTouchEdit}
						wrapLines={true}
						wrapLongLines={true}
					>
						{getContent()}
					</SyntaxHighlighter>
				</pre>
			</>
		);
	}

	useEffect(() => {
		if (streamContainerRef.current) {
			streamContainerRef.current.scrollTop =
				streamContainerRef.current.scrollHeight;
		}
	}, [node_stream]);

	return (
		<>
			<div className="hidden bg-[#FFA500] bg-[#000080] bg-[#FF10F0] bg-[#A020F0] bg-[#05D9FF] bg-[#39FF14]">
				_tw_manual_debugging_ _preload_all_colors_variations_so_it_builds_them
			</div>
			<div
				className={`dark bg-[#0a0a0a] font-light ${node_stream?.is_running && node_stream?.data ? "max-w-[60vw] xl:max-w-[50vw]" : "max-w-[60vw] xl:max-w-[40vw]"} overflow-auto text-xs`}
				key={refresh}
			>
				<div className="opacity-0">
					<Handle
						type="target"
						id="top"
						position={Position.Top}
						style={{ background: "#555" }}
						onConnect={(params) => console.log("handle onConnect", params)}
						isConnectable={isConnectable}
					/>
					<Handle
						type="target"
						id="botom"
						position={Position.Bottom}
						style={{ background: "#555" }}
						onConnect={(params) => console.log("handle onConnect", params)}
						isConnectable={isConnectable}
					/>
					<Handle
						type="target"
						id="left"
						position={Position.Left}
						style={{ background: "#555" }}
						onConnect={(params) => console.log("handle onConnect", params)}
						isConnectable={isConnectable}
					/>
					<Handle
						type="target"
						id="right"
						position={Position.Right}
						style={{ background: "#555" }}
						onConnect={(params) => console.log("handle onConnect", params)}
						isConnectable={isConnectable}
					/>
				</div>

				<div className="text-white rounded rounded-xl p-2 font-light">
					<div
						key={refresh}
						className="text-base p-2 m-2 duration-200 rounded flex gap-2 items-start"
					>
						<div className={`h-8 w-8 m-2 rounded bg-${getColor()}`}></div>
						<div>
							<strong>{data.meta.name}</strong>
							<br />
							<span className="opacity-80">
								{data.meta.desc}{" "}
								{!data.key.includes("webapp.react.views")
									? ""
									: ` : ${data.key.split(".")[3]}`}
							</span>
						</div>
					</div>

					{getMinifiedContent()}

					{(node_data && (
						<Dialog>
							<div className="flex justify-end border-t pt-2 my-2 border-[#222]">
								<DialogTrigger asChild>
									<Button variant="outline">View</Button>
								</DialogTrigger>
							</div>
							<DialogContent className="font-light bg-white/10 backdrop-blur-md border-[#222] max-w-[90vw] h-[90vh] max-h-[90vh] overflow-auto p-8">
								<DialogHeader className="text-[#aaa]">
									<DialogTitle>Detailed View</DialogTitle>
									<DialogDescription className="text-white text-lg whitespace-pre-wrap break-words font-light">
										{data.key}{" "}
										<strong className="text-base">
											{selectedVersion ? `{ ${selectedVersion} }` : ""}
										</strong>
									</DialogDescription>
								</DialogHeader>

								{(data.meta.content_type === "markdown" && data.key != "pm.details" && (
									<>
										<div className="rounded rounded-lg p-12 m-2 bg-[#2a2a2a] text-white text-sm overflow-auto whitespace-pre-wrap break-words">
											<Markdown className="markdown" remarkPlugins={[remarkGfm]}>
												{node_data}
											</Markdown>
										</div>
									</>
								)) ||
									getExpandedContent()}

								<pre
									className=""
									style={{ fontFamily: "JetBrains Mono", fontWeight: 400 }}
								>
									{/*<SyntaxHighlighter language="yaml" style={vscDarkPlus} wrapLines={true} wrapLongLines={true} >
                  {yaml.stringify(node_data)}
                </SyntaxHighlighter>
                */}
								</pre>

								<DialogFooter>
									<DialogClose asChild>
										<Button variant="">Back</Button>
									</DialogClose>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					)) || <></>}

					{/*
          <input
            className="nodrag rounded-lg p-1" style={{backgroundColor:bgColor}}
            type="color"
            onChange={(event) => {
              const newColor = event.target.value;
              setBgColor(newColor);
              data.onChange(event);
            }}
            defaultValue={data.color}
            style={{ cursor: 'pointer', width: '50px', height: '50px' }}
          />
          */}
				</div>
				<div className="opacity-0">
					<Handle
						type="source"
						position={Position.Top}
						id="top"
						style={{ left: 10, background: "#555" }}
						isConnectable={isConnectable}
					/>
					<Handle
						type="source"
						position={Position.Right}
						id="right"
						style={{ top: 10, background: "#555" }}
						isConnectable={isConnectable}
					/>
					<Handle
						type="source"
						position={Position.Bottom}
						id="bottom"
						style={{ left: 10, background: "#555" }}
						isConnectable={isConnectable}
					/>
					<Handle
						type="source"
						position={Position.Left}
						id="left"
						style={{ top: 10, background: "#555" }}
						isConnectable={isConnectable}
					/>
				</div>
			</div>
		</>
	);
});
