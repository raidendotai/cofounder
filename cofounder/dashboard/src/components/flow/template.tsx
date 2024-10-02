import { MarkerType } from "@xyflow/react";

const PADDING_X = 150;
const DIST_X = PADDING_X * 2;
const PADDING_Y = 75;
const DIST_Y = PADDING_Y * 6;

export default {
	metrics: {
		PADDING_X,
		PADDING_Y,
		DIST_X,
		DIST_Y,
	},
	layers: {
		// pm layer , etc
	},
	nodes: {
		"pm.details": { position: { x: DIST_X * 2, y: -DIST_Y * 2 } },
		"pm.prd": { position: { x: 0, y: 0 } },
		"pm.frd": { position: { x: DIST_X * 4, y: 0 } },

		"pm.drd": { position: { x: DIST_X * 4, y: DIST_Y } },

		"db.schemas": {
			position: { x: PADDING_X * 2 + DIST_X * 5, y: DIST_Y + PADDING_Y },
		},
		"db.postgres": {
			position: { x: PADDING_X * 2 + DIST_X * 6, y: DIST_Y + PADDING_Y * 2 },
		},

		"pm.brd": { position: { x: DIST_X * 5, y: PADDING_Y + DIST_Y * 2 } },
		"backend.specifications.openapi": {
			position: { x: DIST_X * 7, y: PADDING_Y + DIST_Y * 2 + PADDING_Y },
		},
		"backend.specifications.asyncapi": {
			position: { x: DIST_X * 7, y: PADDING_Y + DIST_Y * 2.75 + PADDING_Y },
		},
		"backend.server.main": { position: { x: DIST_X * 9, y: DIST_Y * 2.5 } },

		"pm.uxsmd": { position: { x: 0, y: DIST_Y } },
		"pm.uxdmd": { position: { x: DIST_X * 2, y: DIST_Y } },

		"uxsitemap.structure": {
			position: { x: -DIST_X * 3.5, y: DIST_Y * 4.5 },
		},
		"uxdatamap.structure": {
			position: { x: DIST_X * 1.5, y: DIST_Y * 2 + PADDING_Y },
		},
		"uxdatamap.views": {
			position: { x: DIST_X * 3, y: DIST_Y * 2 + PADDING_Y * 2 },
		},

		"webapp.react.root": { position: { x: 0, y: DIST_Y * 3 + PADDING_Y * 2 } },
		"webapp.react.store": {
			position: { x: DIST_X * 3, y: DIST_Y * 3 + PADDING_Y * 2 },
		},
		"webapp.react.views": { position: { x: 0, y: DIST_Y * 6 } },

		"settings.config.package": {
			position: { x: DIST_X * 12, y: DIST_Y * 4 },
		},
		"settings.preferences.versions": {
			position: { x: -DIST_X * 5, y: DIST_Y * 4.5 },
		},
	},

	edges: [
		...["pm.prd", "pm.frd"].map((target) => {
			const source = "pm.details";
			return {
				id: `${source}-${target}`,
				source,
				target: target,
			};
		}),
		...["pm.frd", "pm.drd", "pm.uxsmd", "pm.uxdmd", "pm.brd"].map((target) => {
			const source = "pm.prd";
			return {
				id: `${source}-${target}`,
				source,
				target: target,
			};
		}),
		...["pm.brd", "db.schemas", "db.postgres"].map((target) => {
			const source = "pm.drd";
			return {
				id: `${source}-${target}`,
				source,
				target: target,
			};
		}),
		...[
			"backend.specifications.openapi",
			"backend.specifications.asyncapi",
			"pm.uxdmd",
		].map((target) => {
			const source = "pm.brd";
			return {
				id: `${source}-${target}`,
				source,
				target: target,
			};
		}),
		...[
			"pm.brd",
			"backend.specifications.openapi",
			"backend.specifications.asyncapi",
		].map((source) => {
			const target = "backend.server.main";
			return {
				id: `${source}-${target}`,
				source,
				target,
			};
		}),

		...["pm.uxdmd", "uxsitemap.structure"].map((target) => {
			const source = "pm.uxsmd";
			return {
				id: `${source}-${target}`,
				source,
				target: target,
			};
		}),
		...["uxdatamap.structure", "uxdatamap.views"].map((target) => {
			const source = "pm.uxdmd";
			return {
				id: `${source}-${target}`,
				source,
				target: target,
			};
		}),

		...["webapp.react.root.app"].map((target) => {
			const source = "uxsitemap.structure";
			return {
				id: `${source}-${target}`,
				source,
				target: target,
			};
		}),
		...["webapp.react.root.app"].map((target) => {
			const source = "uxdatamap.views";
			return {
				id: `${source}-${target}`,
				source,
				target: target,
			};
		}),
		...["webapp.react.store.redux"].map((target) => {
			const source = "uxdatamap.structure";
			return {
				id: `${source}-${target}`,
				source,
				target: target,
			};
		}),

		...["backend.server.main", "uxsitemap.structure"].map((target) => {
			const source = "settings.config.package";
			return {
				id: `${source}-${target}`,
				source,
				target: target,
			};
		}),
		...["uxsitemap.structure"].map((target) => {
			const source = "settings.preferences.versions";
			return {
				id: `${source}-${target}`,
				source,
				target: target,
			};
		}),
	].map((item) => {
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
};
