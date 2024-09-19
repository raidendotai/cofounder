import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import yargs from "yargs";
import fs from "fs";
import { hideBin } from "yargs/helpers";
import { merge } from "lodash-es";
import cofounder from "./build.js";
dotenv.config();

function _slugify(text) {
	return text
		.toString()
		.toLowerCase()
		.replace(/\s+/g, "-") // Replace spaces with -
		.replace(/[^\w\-]+/g, "") // Remove all non-word chars
		.replace(/\-\-+/g, "-") // Replace multiple - with single -
		.replace(/^-+/, "") // Trim - from start
		.replace(/-+$/, ""); // Trim - from end
}

// init project from argv
// to be called like : npm run start -- --p "some-project-name" --d "app description right"
const timestamp = Date.now();
const argv = yargs(hideBin(process.argv)).argv;
const newProject = {
	project:
		(!argv.p && !argv.project) ||
		_slugify(argv.p || argv.project).length === 0 ||
		!_slugify(argv.p || argv.project).match(/[a-z0-9]/)
			? `project-${timestamp}`
			: _slugify(argv.p || argv.project),
	description: argv.description || argv.d || argv.desc || false,
	aesthetics: argv.aesthetics || argv.a || argv.aesthetic || false,
};
if (argv.file || argv.f) {
	newProject.description = fs.readFileSync(argv.file || argv.f, "utf-8");
}
async function createNewProject() {
	if (!newProject.description.length) {
		console.error(
			'Error: -d "project description" is required and cannot be empty.',
		);
		process.exit(1);
	}
	console.log(
		`\x1b[31minitialized generating app : ${newProject.project}\x1b[0m`,
	);
	console.log(
		`\x1b[34m(see ${process.env.EXPORT_APPS_ROOT}/${newProject.project}/README.md for more details)\x1b[0m` +
			`\n\x1b[38;5;37mto start app (api+frontend in parallel)` +
			`\n\t> cd ${process.env.EXPORT_APPS_ROOT}/${newProject.project}` +
			`\n\t> npm i && npm run dev\x1b[0m`,
	);

	const query = {
		pm: {
			details: {
				text: `${newProject.project != `project-${timestamp}` ? "Project '" + newProject.project + "' :" : ""} ${newProject.description}`,
				attachments: [],
				design: {
					aesthetics: {
						text: newProject.aesthetics,
					},
				},
			},
		},
	};
	console.dir({ query }, { depth: null });

	/*
	// debug : to resume ----------------------------------------------------------
	const data = await cofounder.system.run({
		id: "op:PROJECT::STATE:LOAD",
		context: {
			project: newProject.project,
		},
		data: {},
	});
	await cofounder.system.run({
		id: `seq:project:init:v1:resume`,
		context: {
			project: newProject.project,
		},
		data: merge(data, {
			...query,
			debug: {},
		}),
	});
	----------------------------------------------------------
	*/

	await cofounder.system.run({
		id: `seq:project:init:v1`,
		context: {
			project: newProject.project,
		},
		data: query,
	});
}

// Call createNewProject if command args for init project are provided
if (newProject.project && newProject.description) {
	createNewProject();
}


const app = express();
const PORT = process.env.PORT || 667;

app.use(cors());
app.use(express.json({ limit: "5mb" }));

/*
app.post("/project/init", async (req, res) => {
	try {
		// see docs for steps		
		res.status(200).json({ end: true });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "failed to init project" });
	}
});
*/

const actions = {
	// map action to function ; load means load project state before passing
	"update:settings:preferences:versions": {
		fn: _updateProjectPreferences,
		load: false,
	},
	"regenerate:ui": { fn: _regenerateUiComponent, load: true },
	"iterate:ui": { fn: _iterateUiComponent, load: true },
	/*
		later, single universal interface approach, 
		> should go through an analysis sequence ;
				ie. is is a new feature that needs db schemas & apis to be altered, or just at the layout level, etc
	*/
};
const actionsKeys = Object.keys(actions);

app.post("/project/actions", async (req, res) => {
	/*
		in : {
			project : `exampleproject`,
			query : {
				action : "example:action:whatever",
				data : {
				},
			},
		}
	*/
	console.dir(
		{ "cofounder:api:server:actions:debug": req.body },
		{ depth: null },
	);
	try {
		const { project, query } = req.body;
		const { action } = query;
		if (!actionsKeys.includes(action)) {
			throw new Error(`action ${action} not recognized`);
		}
		const { fn, load } = actions[action];
		const data = await fn({
			request: { project, query },
			data: !load
				? {}
				: await cofounder.system.run({
						id: "op:PROJECT::STATE:LOAD",
						context: {
							project,
						},
						data: {},
					}),
		});
		res.status(200).json({ end: true });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "failed to process" });
	}
});

app.listen(PORT, () => {
	console.log(
		"\x1b[32m\ncofounder/api : server is running on port " + PORT + "\x1b[0m",
	);
});

// ------------ helpers --------------------------------------------------------
async function _updateProjectPreferences({ request }) {
	/*
		in : {
			project : `exampleproject`,
			query : {
				action : "example:action:whatever",
				data : {
					[views || sections] : {
						[id] : {version}
					}
				},
			},
		}
	*/
	const { project, query } = request;
	await cofounder.system.run({
		id: "op:PROJECT::STATE:UPDATE",
		context: { project },
		data: {
			operation: {
				id: `settings:preferences:versions`,
			},
			type: `end`,
			content: {
				key: `settings.preferences.versions`,
				data: query.data,
			},
		},
	});
}
async function _regenerateUiComponent({ request, data }) {
	const { project, query } = request;
	/*
		in : request: {
			project : `exampleproject`,
			query : {
				action : "regenerate:ui"
				data : {
					[views || sections] : `{id}`, // <--- update : sections stuff removed, is views only (for now)
				},
			},
		}
	*/

	const type = Object.keys(query.data)[0];
	const id = query.data[type];

	/*
		need to make :
		task {
			type: "view",
			view: {
				type: unique || shared,
				id,
			},
			passes: {
				functional: true,
				redesign: process.env.DESIGNER_ENABLE
					? JSON.parse(process.env.DESIGNER_ENABLE.toLowerCase())
					: true,
			}
		}
	*/
	const task = {
		type: "view",
		view: {
			type: id.startsWith(`UV_`) ? `unique` : `shared`,
			id,
		},
		passes: {
			functional: true,
			redesign: process.env.DESIGNER_ENABLE
				? JSON.parse(process.env.DESIGNER_ENABLE.toLowerCase())
				: false,
		},
	};
	console.dir({ "debug:server:task:regen:ui": { request, task } });
	await cofounder.system.run({
		id: "WEBAPP:VIEW::GENERATE",
		context: { project },
		data: {
			...data,
			task,
		},
	});
}

async function _iterateUiComponent({ request, data }) {
	console.dir({ "cofounder:api:server:iterate:ui": "starts" });
	/*
		designer/layoutv1 might be overkill, but its best way to have primitives to retrieve design system docs (if applies)
		
	*/

	/*
		in : {
			project: meta.project,
			query: {
				action: "iterate:ui",
				data: {
					views : {
						[id] : {
							[version] : {
								user : {
									text: editUserText,
									attachments: [], // later, can attach image
								},
								screenshot: { base64: image ? image : false},
								designer: bool
							}
						},
					}
				},
			},
		}),
		}
	*/
	const { project, query } = request;
	const id = Object.keys(query.data.views)[0];
	const version = Object.keys(query.data.views[id])[0];
	const { notes, screenshot, designer } = query.data.views[id][version];

	const task = {
		type: "view",
		view: {
			type: id.startsWith(`UV_`) ? `unique` : `shared`,
			id,
			version,
		},
		iteration: {
			notes, // {text,attachements}
			screenshot, // {base64 : "base64str" || false }
			designer: process.env.DESIGNER_ENABLE
				? JSON.parse(process.env.DESIGNER_ENABLE.toLowerCase()) && designer
					? true
					: false
				: false,
		},
	};
	console.dir({ "debug:server:task:regen:ui": { request, task } });
	await cofounder.system.run({
		id: "WEBAPP:VIEW::ITERATE",
		context: { project },
		data: {
			...data,
			task,
		},
	});
}