import React, { useCallback, useState, useEffect } from "react";
import "@/components/styles/flow.css";

import {
	ReactFlow,
	MiniMap,
	Controls,
	Background,
	useNodesState,
	useEdgesState,
	addEdge,
	ColorMode,
	MarkerType,
} from "@xyflow/react";

import FloatingEdge from "@/components/flow/helpers/FloatingEdge";
import FloatingConnectionLine from "@/components/flow/helpers/FloatingConnectionLine";
import { createNodesAndEdges } from "@/components/flow/helpers/utils";
import "@/components/flow/helpers/floating.css";

import { useDispatch, useSelector } from "react-redux";
import { setProject } from "@/store/main";

import template from "@/components/flow/template.tsx";
import keymap from "@/components/flow/keymap.tsx";

import CofounderNode from "@/components/flow/nodes/cofounder-node.tsx";
import "@/components/flow/nodes/cofounder-node.css";

// register new components types
const nodeTypes = {
	cofounder_node: CofounderNode,
};
const edgeTypes = {
	floating: FloatingEdge,
};

const proOptions = {
	// hideAttribution: true
};

/*
const initialNodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: '1' } },
  { id: '2', position: { x: 0, y: 100 }, data: { label: '2' } },
];
const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];
*/

const initialNodes = [];
const initialEdges = [];

const Flow: React.FC<{ project: string }> = ({ project }) => {
	const dispatch = useDispatch();
	const nodesKeys = useSelector((state: any) => state.project.nodesKeys);

	useEffect(() => {
		// Set the project in the store when the component loads
		dispatch(setProject(project));
	}, [dispatch, project]);

	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
	const [colorMode, setColorMode] = useState<ColorMode>("dark");

	const [loaded, setLoaded] = useState(false);
	const [streamSimulate, setStreamSimulate] = useState<NodeJS.Timeout | null>(
		null,
	);
	const [refresh, setRefresh] = useState(Date.now());

	useEffect(() => {
		if (nodesKeys && nodesKeys.length) {
			let _multiple_views = {};
			let _multiple_views_edges = [];

			let _webapp_views = nodesKeys.filter((node_key) =>
				node_key.startsWith("webapp.react.views."),
			);
			if (_webapp_views.length) {
				const columns = 5;
				_webapp_views.map((key, idx) => {
					const vertical_scroll = Math.floor(idx / columns); // increment every n indices
					const horizontal_index = idx % columns; // reset every n indices
					_multiple_views[key] = {
						position: {
							x:
								(template.metrics.DIST_X * 2 + template.metrics.PADDING_X * 0.5) *
								horizontal_index,
							y:
								template.nodes["webapp.react.views"].position.y +
								template.metrics.DIST_Y * 2.5 * vertical_scroll -
								horizontal_index * template.metrics.PADDING_Y * 2,
						},
					};
					_multiple_views_edges.push({
						id: `${"uxsitemap.structure"}-${key}`,
						source: "uxsitemap.structure",
						target: key,
					});
				});
				// console.log("debug : multiple views ", _multiple_views);
			}
			setNodes((prev) => {
				const previous_ids = {};
				prev.map((n) => {
					previous_ids[n.id] = { position: n.position };
				});
				return (
					nodesKeys
						.filter((node_key) =>
							Object.keys(template.nodes).some((key) => node_key.startsWith(key)),
						)
						//.filter((node_key) => !node_key.startsWith("webapp."))
						.map((node_key, idx) => {
							let _key = `${node_key}`;
							let _webapp_case = false;
							let _webapp_view_case = false;
							if (node_key.startsWith("webapp")) {
								_key = node_key.split(".").slice(0, 3).join(".");
								_webapp_case = true;
								if (node_key.includes("webapp.react.views")) {
									_webapp_view_case = true;
								}
							}

							const meta = keymap.meta[_key];
							const pos = previous_ids[node_key]
								? previous_ids[node_key]
								: !_webapp_case
									? template.nodes[_key]
									: !_webapp_view_case
										? template.nodes[_key]
										: _multiple_views[node_key];

							return {
								type: "cofounder_node",
								id: node_key,
								data: {
									key: node_key,
									meta: {
										...meta,
										content_type: keymap.types[meta.type],
									},
								},
								...pos,
							};
						})
						.filter((e) => e)
				);
			});

			setEdges([
				...template.edges,
				..._multiple_views_edges.map((item) => {
					return {
						animated: true,
						style: { stroke: "#999" },
						type: "floating",
						markerEnd: {
							type: MarkerType.ArrowClosed,
							width: 30,
							height: 30,
						},
						...item,
					};
				}),
			]);
			// setRefresh(Date.now())
		}
	}, [nodesKeys]);

	const onConnect = useCallback(
		(params) =>
			setEdges((eds) =>
				addEdge(
					{
						...params,
						type: "floating",
						markerEnd: {
							type: MarkerType.Arrow,
						},
					},
					eds,
				),
			),
		[setEdges],
	);

	return (
		<div style={{ width: "100vw", height: "100vh" }}>
			<pre className="m-4 p-4 bg-black text-white text-sm hidden">
				{JSON.stringify(nodes)}
			</pre>
			<ReactFlow
				key={refresh}
				colorMode={colorMode}
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				fitView
				minZoom={0.1}
				edgeTypes={edgeTypes}
				connectionLineComponent={FloatingConnectionLine}
				nodeTypes={nodeTypes}
				proOptions={proOptions}
			>
				<Controls />
				<MiniMap />
				<Background variant="dots" gap={48} size={2} />
			</ReactFlow>
		</div>
	);
};

export default Flow;
