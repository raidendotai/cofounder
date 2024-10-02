export default {
	meta: {
		"pm.details": {
			type: "pm",
			name: "Details",
			desc: "User-submitted Project Details",
		},

		"pm.prd": { type: "pm", name: "PRD", desc: "Product Requirements Document" },
		"pm.frd": { type: "pm", name: "FRD", desc: "Features Requirements Document" },
		"pm.drd": { type: "pm", name: "DRD", desc: "Database Requirements Document" },
		"pm.brd": { type: "pm", name: "BRD", desc: "Backend Requirements Document" },
		"pm.uxsmd": { type: "pm", name: "UXSMD", desc: "UX Sitemap Document" },
		"pm.uxdmd": { type: "pm", name: "UXDMD", desc: "UX Datamap Document" },

		"db.schemas": {
			type: "db",
			name: "DB/schemas",
			desc: "Database Tables Schemas",
		},
		"db.postgres": {
			type: "db",
			name: "DB/postgres",
			desc: "Database Postgresql Commands",
		},

		"backend.specifications.openapi": {
			type: "backend",
			name: "backend/define:openapi",
			desc: "Backend Definition : openAPI",
		},
		"backend.specifications.asyncapi": {
			type: "backend",
			name: "backend/define:asyncapi",
			desc: "Backend Definition : asyncAPI",
		},

		"backend.server.main": {
			type: "backend",
			name: "backend/server:main",
			desc: "Backend Server : Main",
		},

		"uxsitemap.structure": {
			type: "ux",
			name: "ux/sitemap:structure",
			desc: "UX Sitemap",
		},
		"uxdatamap.structure": {
			type: "ux",
			name: "ux/datamap:structure",
			desc: "UX Datamap Structure",
		},
		"uxdatamap.views": {
			type: "ux",
			name: "ux/datamap:views",
			desc: "UX Datamap Views",
		},

		"webapp.react.root": {
			type: "webapp-structure",
			name: "webapp/react:root",
			desc: "Webapp App Root Component",
		},
		"webapp.react.store": {
			type: "webapp-structure",
			name: "webapp/react:store",
			desc: "Webapp Data Store",
		},
		"webapp.react.views": {
			type: "webapp-view",
			name: "webapp/react:views",
			desc: "Webapp View",
		},
		"settings.config.package": {
			type: "ux",
			name: "settings/config:package",
			desc: "Dependencies & .env for package.json",
		},
		"settings.preferences.versions": {
			type: "ux",
			name: "settings/preferences:versions",
			desc: "Components versions preferences",
		},
	},
	types: {
		"pm.details": "yaml", // is kinda ignored , hardcoded fix in "@/components/flow/nodes/cofounder-node"
		pm: "markdown",
		db: "yaml",
		backend: "complex",
		uxsitemap: "yaml",
		uxdatamap: "yaml",
		"webapp-structure": "complex",
		"webapp-view": "complex",
		settings: "yaml",
	},
};
