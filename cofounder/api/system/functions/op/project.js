import utils from "@/utils/index.js";
import { sample, merge } from "lodash-es";
import path from "path";
import fs from "fs";
import yaml from "yaml";
import dotenv from "dotenv";
import fsextra from "fs-extra";
import { exec, execSync } from "child_process";
dotenv.config();

/*
  maps to local / hosted db paths
*/
const pm = {
	"pm:details": "pm/user/details",
	"pm:brd": "pm/docs/brd",
	"pm:drd": "pm/docs/drd",
	"pm:fjmd": "pm/docs/fjmd",
	"pm:frd": "pm/docs/frd",
	"pm:prd": "pm/docs/prd",
	"pm:uxdmd": "pm/docs/uxdmd",
	"pm:uxsmd": "pm/docs/uxsmd",
};
const architecture = {
	"architecture:uxsitemap:structure": "architecture/uxsitemap/structure",
	"architecture:uxdatamap:structure": "architecture/uxdatamap/structure",
	"architecture:uxdatamap:views": "architecture/uxdatamap/views",
};
const backend = {
	"backend:requirements": "backend/structure/requirements",
	"backend:specifications:asyncapi": "backend/specifications/asyncapi",
	"backend:specifications:openapi": "backend/specifications/openapi",
	"backend:server:main": "backend/server/main",
};

const db = {
	"db:schemas": "db/mock/schemas",
	"db:seed": "db/mock/seed",
	"db:postgres": "db/mock/postgres",
};
/*
const ui = {
	"ui:layout:views": "ui/layout/mockup/views/{id}/versions/{version}",
	"ui:layout:sections": "ui/layout/mockup/sections/{id}/versions/{version}",
	//"ui:render:views" : "",
	//"ui:render:sections": "",
	"ui:code:react:stores": "ui/code/react/stores/{id}/versions/{version}",
	"ui:code:react:root": "ui/code/react/root/{id}/versions/{version}",
	"ui:code:react:views": "ui/code/react/views/{id}/versions/{version}",
	"ui:code:react:sections": "ui/code/react/sections/{id}/versions/{version}",
};
*/
const webapp = {
	"webapp:react:store": "webapp/code/react/store/{id}/versions/{version}",
	"webapp:react:root": "webapp/code/react/root/{id}/versions/{version}",
	"webapp:react:views": "webapp/code/react/views/{id}/versions/{version}",

	"webapp:layout:views": "webapp/design/layout/views/{id}/versions/{version}",
};
const settings = {
	// for version control ie. which view / section / version
	// data is ie. {views{[id]:[version]}}
	"settings:preferences:versions": "settings/preferences/versions",
	"settings:config:package": "settings/config/package",
};

const modules = {
	...pm,
	...architecture,
	...db,
	...backend,
	...webapp,
	//...ui,
	...settings,
};

const config = {
	merge: [
		// operation ids where merge data is enabled
		"settings:preferences:versions",
		"settings:config:package",
	],
	exports: [
		// events that trigger app write exports (if enabled)

		"db:postgres",

		"backend:specifications:asyncapi",
		"backend:specifications:openapi",
		"backend:server:main",

		"webapp:react:store",
		"webapp:react:root",
		"webapp:react:views",
		"webapp:layout:views",

		/*
		"ui:layout:views",
		"ui:layout:sections",
		"ui:code:react:stores",
		"ui:code:react:root",
		"ui:code:react:views",
		"ui:code:react:sections",
		*/
		"settings:preferences:versions",
		"settings:config:package",
	],
};

async function run_npm_i(dependenciesRootPath) {
	exec(`npm i`, {
		stdio: "inherit",
		cwd: dependenciesRootPath, // folder where package.json is
	});
}
async function _exportOnSave({ context, data }) {
	if (
		!(
			process.env.AUTOEXPORT_ENABLE &&
			JSON.parse(process.env.AUTOEXPORT_ENABLE.toLowerCase())
		)
	)
		return;
	const { project } = context;
	const { id, refs } = data.operation;
	const root = `${process.env.EXPORT_APPS_ROOT}/${project}`;
	const backendRoot = `${root}/backend`;
	const appRoot = `${root}/vitereact`;
	const appSrcRoot = `${appRoot}/src`;
	// const { data } = data.content.data
	let tasks = [];
	if (id === `backend:server:main`) {
		const { mjs, dependencies, env } = data.content.data;

		tasks.push({
			path: `${backendRoot}/server.js`,
			data: mjs,
		});
	}
	if (id === `backend:specifications:asyncapi`) {
		if (data.content.data) {
			const exportPath = `${backendRoot}/asyncapi.yaml`;
			const exportData = yaml.stringify(data.content.data);
			tasks.push({
				path: exportPath,
				data: exportData,
			});
		}
	}
	if (id === `backend:specifications:openapi`) {
		if (data.content.data) {
			const exportPath = `${backendRoot}/openapi.yaml`;
			const exportData = yaml.stringify(data.content.data);
			tasks.push({
				path: exportPath,
				data: exportData,
			});
		}
	}
	if (id === `db:postgres`) {
		const exportPath = `${backendRoot}/db.sql`;
		const exportData = data.content.data;
		tasks.push({
			path: exportPath,
			data: exportData,
		});
	}
	if (id === `webapp:react:store`) {
		const exportPath = `${appSrcRoot}/store/main.tsx`;
		const exportData = data.content.data.tsx;
		tasks.push({
			path: exportPath,
			data: exportData,
		});
	}
	if (id === `webapp:react:root`) {
		const exportPath = `${appSrcRoot}/App.tsx`;
		const exportData = data.content.data.tsx;
		tasks.push({
			path: exportPath,
			data: exportData,
		});
		// just in case it wasnt setup properly, lets write meta.json here too
		tasks.push({
			path: `${appSrcRoot}/_cofounder/meta.json`,
			data: JSON.stringify({ project }),
		});
	}
	if (id === `webapp:react:views`) {
		// exportPath = `${appSrcRoot}/components/views/${refs.id}/versions/${refs.version}.tsx`
		tasks.push({
			path: `${appSrcRoot}/components/views/${refs.id}.tsx`,
			data: `/*
	[PLACEHOLDER COMPONENT]
		> calls to this component are pre-replaced by @/_cofounder/vite-plugin
		> to edit code for this component, you should go to :
			@/_cofounder/generated/views/${refs.id}/{version_you_want_to_edit}.tsx
*/`,
		});
		tasks.push({
			path: `${appSrcRoot}/_cofounder/generated/views/${refs.id}/empty.tsx`,
			data: `import React from "react";
const {{ID}}: React.FC<any> = (props) => {
	return (
		<div className="bg-[#eee] text-black text-lg p-4 m-2 rounded">
			<strong>{{ID}}</strong> placeholder
			<br /><div className="m-2 text-base p-4 bg-[#222] rounded text-white">
				To browse other versions<br/>
				Use ⌘+K / CMD+K and hover here
			</div>
		</div>
	);
};
export default {{ID}};
`.replaceAll("{{ID}}", refs.id),
		});

		tasks.push({
			path: `${appSrcRoot}/_cofounder/generated/views/${refs.id}/${refs.version}.tsx`,
			data: data.content.data.tsx,
		});
		// write meta.json
		let versions = [];
		try {
			versions = fs
				.readdirSync(`${appSrcRoot}/_cofounder/generated/views/${refs.id}/`)
				.filter((filename) => filename.endsWith(".tsx"))
				.map((filename) => path.basename(filename, ".tsx"));
		} catch (e) {
			false;
			// no dir there yet
		}
		tasks.push({
			path: `${appSrcRoot}/_cofounder/generated/views/${refs.id}/meta.json`,
			data: JSON.stringify(
				{
					versions: [...new Set([...versions, "latest"])],
					choice: "latest",
				},
				null,
				"\t",
			),
		});

		/*
			<-------- should also merge {dependencies} with current packages.json (either directly in app , or op:state:settings:... preferably latter  ; to webapp:react:packages ) 
		*/
	}

	if (id === `webapp:layout:views`) {
		// exportPath = `${appSrcRoot}/components/views/${refs.id}/versions/${refs.version}.tsx`
		const exportPath = `${appRoot}/public/_cofounder/generated/layouts/views/${refs.id}.${refs.version}.png`;
		const exportData = data.content.data.render.image;
		tasks.push({
			path: exportPath,
			data: exportData,
			image: true,
		});
	}

	if (id === `settings:preferences:versions`) {
		/*
			for now, only handle preference exports for views || sections
		*/
		const _category = Object.keys(data.content.data)[0];
		const _id = Object.keys(data.content.data[_category])[0];
		const _version = data.content.data[_category][_id];
		if (_category === `views` || _category === `sections`) {
			// update meta json on @/_cofounder/generated/{_category}/{id}
			let versions = [];
			try {
				versions = fs
					.readdirSync(`${appSrcRoot}/_cofounder/generated/${_category}/${_id}/`)
					.filter((filename) => filename.endsWith(".tsx"))
					.map((filename) => path.basename(filename, ".tsx"));
			} catch (e) {
				false;
			}
			tasks.push({
				path: `${appSrcRoot}/_cofounder/generated/${_category}/${_id}/meta.json`,
				data: JSON.stringify(
					{
						versions: [...new Set([...versions, _version])],
						choice: _version,
					},
					null,
					"\t",
				),
			});
		}
	}
	if (id === `settings:config:package`) {
		/*
			data.content.data : {
				[backend || webapp] : {
					dependencies? : {}, //<--- this instead of list for merging while saving :)
					env?: {},
				}
			}
			load boilerplate package.json,
			try load export/.../package.json else {}
			merge dependencies of both data.content.data[target].dependencies
			
			if (export/.../) merge with that package
			else merge with boilerplate package and export

			only save if diff ; else might restart active dev nodemon every single time ...
		*/

		Object.keys(data.content.data).map((target) => {
			// target : "backend" || "webapp"
			Object.keys(data.content.data[target]).map((category) => {
				// category : "dependencies" || "env"
				const boilerplateDir = `../boilerplate/${target === "backend" ? "backend" : target === "webapp" ? "vitereact" : false}-boilerplate`;
				const exportDir =
					target === "backend" ? backendRoot : target === "webapp" ? appRoot : false;
				if (category === "dependencies") {
					const newDependencies = Object.keys(
						data.content.data[target].dependencies,
					);

					const boilerplatePackage = JSON.parse(
						fs.readFileSync(`${boilerplateDir}/package.json`, "utf8").toString(),
					);
					let exportedProjectPackage = { dependencies: {}, devDependencies: {} };
					try {
						exportedProjectPackage = JSON.parse(
							fs.readFileSync(`${exportDir}/package.json`, "utf8").toString(),
						);
					} catch (e) {
						console.error(`op:project:_exportOnsave:error : ${e}`);
					}

					console.dir(
						{
							"debug:op:project:_exportOnSave : settings:config:package": {
								[target]: {
									[category]: {
										boilerplateDir,
										exportDir,
										boilerplatePackage,
										exportedProjectPackage,
									},
								},
							},
						},
						{ depth: null },
					);

					const previousDevDependencies = [
						...new Set([
							...Object.keys(boilerplatePackage.devDependencies),
							...Object.keys(exportedProjectPackage.devDependencies),
						]),
					];

					const previousDependencies = [
						...new Set([
							...Object.keys(boilerplatePackage.dependencies),
							...Object.keys(exportedProjectPackage.dependencies),
							...previousDevDependencies,
						]),
					];

					const updateDependencies = newDependencies.some(
						(dep) => !previousDependencies.includes(dep),
					);

					if (updateDependencies) {
						const dependenciesToAdd = Object.fromEntries(
							[
								...new Set(
									newDependencies.filter((dep) => !previousDependencies.includes(dep)),
								),
							].map((dep) => [dep, "*"]),
						);

						// filter out devDependencies keys so it doesnt move everything to dependencies on export to package.json
						const mergedDependencies = Object.fromEntries(
							Object.entries(
								merge(
									merge(
										boilerplatePackage.dependencies,
										exportedProjectPackage.dependencies,
									),
									dependenciesToAdd,
								),
							).filter(([key]) => !previousDevDependencies.includes(key)),
						);

						let newPackageJson;
						if (exportedProjectPackage.dependencies) {
							// if exported package.json exists ; merge with rest and export
							newPackageJson = JSON.stringify(
								merge(exportedProjectPackage, { dependencies: mergedDependencies }),
								null,
								2,
							);
						} else {
							// else merge with boilerplate package.json and export
							newPackageJson = JSON.stringify(
								merge(boilerplatePackage, { dependencies: mergedDependencies }),
								null,
								2,
							);
						}

						console.dir(
							{
								"debug:op:project:_exportOnSave : settings:config:package": {
									[target]: {
										[category]: {
											mergedDependencies,
											newPackageJson,
										},
									},
								},
							},
							{ depth: null },
						);

						tasks.push({
							path: `${exportDir}/package.json`,
							data: newPackageJson,
							dependencies: true,
						});
					}
				}
				if (category === "env") {
					// applies to backend only
					const envData = data.content.data[target].env;
					if (Object.keys(envData).length) {
						const envString = Object.entries(envData)
							.map(([key, value]) => `${key}=${value}`)
							.join("\n");
						console.dir(
							{
								"debug:op:project:_exportOnSave : settings:config:package": {
									[target]: {
										[category]: {
											env: envData,
											envString,
										},
									},
								},
							},
							{ depth: null },
						);
						tasks.push({
							path: `${exportDir}/.env`,
							data: envString,
						});
					}
				}
			});
		});

		const _category = Object.keys(data.content.data)[0];
		const _id = Object.keys(data.content.data[_category])[0];
		const _version = data.content.data[_category][_id];
		if (_category === `views` || _category === `sections`) {
			// update meta json on @/_cofounder/generated/{_category}/{id}
			let versions = [];
			try {
				versions = fs
					.readdirSync(`${appSrcRoot}/_cofounder/generated/${_category}/${_id}/`)
					.filter((filename) => filename.endsWith(".tsx"))
					.map((filename) => path.basename(filename, ".tsx"));
			} catch (e) {
				false;
			}
			tasks.push({
				path: `${appSrcRoot}/_cofounder/generated/${_category}/${_id}/meta.json`,
				data: JSON.stringify(
					{
						versions: [...new Set([...versions, _version])],
						choice: _version,
					},
					null,
					"\t",
				),
			});
		}
	}

	await Promise.all(
		tasks.map(async (task) => {
			const dir = path.dirname(task.path);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}
			if (!task.image) {
				fs.writeFileSync(task.path, task.data, "utf8");
			} else {
				// case by case :
				//		local ? copy paste from local path
				//		url ? fetch and write
				if (task.data?.local?.length) {
					const sourcePath = task.data.local;
					await fsextra.copyFile(sourcePath, task.path);
				} else if (task.data?.url?.length) {
					const response = await fetch(task.data.url);
					if (!response.ok) {
						throw new Error(`Failed to fetch image from ${task.data.url}`);
					}
					const buffer = await response.buffer();
					fs.writeFileSync(task.path, buffer);
				}
			}

			if (
				task.dependencies &&
				process.env.AUTOINSTALL_ENABLE &&
				JSON.parse(process.env.AUTOINSTALL_ENABLE.toLowerCase())
			) {
				const dependenciesRootPath = task.path.split("/").slice(0, -1).join("/");
				console.log(
					`\x1b[33m> dependencies updated for : ${dependenciesRootPath}\n> now running 'npm i' inside that folder\x1b[0m`,
				);

				if (context.streams) {
					await context.streams.start({
						project,
						key: "project.dependencies.install",
						meta: {
							name: "Install dependencies",
							desc: "running 'npm i' in app dir",
						},
					});
					await context.streams.write({
						project,
						key: "project.dependencies.install",
						data: `command : 'npm i'\n\n---\n\nupdate :\n\n${yaml.stringify(task.data)}\n\n---\n\npath : ${dependenciesRootPath}`,
					});
				}

				run_npm_i(dependenciesRootPath);

				if (context.streams) {
					await context.streams.end({
						project,
						key: "project.dependencies.install",
					});
				}
			}
		}),
	);
}

async function opProjectStateUpdate({ context, data }) {
	// save, modular
	/*
    aim for stream structure
  */
	/*
    context : { project``, }
    data: {
      local: bool,
      cloud: bool,
      operation: {
        id: "ui:code:lalala",
        refs: {
          [id] : "id value to replace etc",
          [otherId] : "some value etc",
        }
      },
      type: enum start,stream,end
      stream: "" || false,
      content: {
        // should have key here as would be in state :: edge case, how to deal with '.' paths in object ?
        key : "" // state key ? ie. pm.prd ; uxsitemap.views.whatever
        data : {}
      }
    }
  */
	/*
    add :
      _created?
      _updated
  */
	/*
    update stream only if cloud
  */

	const { project } = context;
	const { operation, type, stream, content } = data;
	// const [ local , cloud ] = [ process.env.STATE_LOCAL , process.env.STATE_CLOUD];
	const { id, refs } = operation;
	/*
    cases of start/stream/end
  */
	const query = {
		path: modules[id],
		data: {},
	};
	const ogPath = `${query.path}`;

	if (refs) {
		Object.keys(refs).map((ref) => {
			query.path = query.path.replace(`{${ref}}`, refs[ref]);
		});
	}

	if (type === `start`) {
		query.data._created = Date.now();
		query.data._processing = true;
	}
	if (type === `end`) {
		query.data._updated = Date.now();
		query.data._processing = false;
		// query.data = { ...query.data, ...content }
	}
	if (content) query.data = { ...query.data, ...content };

	console.dir({ "debug:op:project:state:update": { query } });

	if (
		process.env.STATE_LOCAL &&
		JSON.parse(process.env.STATE_LOCAL.toLowerCase())
	) {
		const localPath = `db/projects/${project}/state/${query.path}.yaml`;
		const dir = path.dirname(localPath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		if (config.merge.includes(id)) {
			try {
				const previous = yaml.parse(fs.readFileSync(localPath, "utf8").toString());
				query.data = merge(previous, query.data);
			} catch (e) {
				console.dir({
					"op:project:update:error": `no previous state found for ${id}, will write new instead of merge`,
				});
			}
		}
		fs.writeFileSync(localPath, yaml.stringify(query.data), "utf8");
		if (context.streams) {
			await context.streams.update({
				project,
				...query.data, // query.data : { key , data }
			});
		}
	}

	if (
		process.env.STATE_CLOUD &&
		JSON.parse(process.env.STATE_CLOUD.toLowerCase())
	) {
		if (refs) {
			// need to write dummy timestamp in docs in case of firestore ; to be able to query subcollections
			// query.path find index of "}" and split there+1, replace, log dummy timestamp
			let subs = [];
			for (let i = 0; i < ogPath.length; i++) {
				if (ogPath[i] === "}") {
					let sub = ogPath.slice(0, i + 1);
					Object.keys(refs).map((ref) => {
						sub = sub.replace(`{${ref}}`, refs[ref]);
					});
					subs.push(sub);
				}
			}
			await Promise.all(
				subs.map(async (p) => {
					await utils.firebase.doc.update({
						path: `/db/userdata/projects/${project}/state/${p}`,
						data: { _created: Date.now() },
					});
				}),
			);
		}

		query.path = `/db/userdata/projects/${project}/state/${query.path}`;
		if (config.merge.includes(id)) {
			query.merge = true;
		}
		await utils.firebase.doc.update(query);
	}

	if (
		process.env.AUTOEXPORT_ENABLE &&
		JSON.parse(process.env.AUTOEXPORT_ENABLE.toLowerCase()) &&
		config.exports.includes(id)
	)
		await _exportOnSave({ context, data });
}

async function opProjectStateLoad({ context, data }) {
	// should have local || cloud strategies
	const { project } = context;
	// const [local, cloud] = [process.env.STATE_LOCAL, process.env.STATE_CLOUD];
	try {
		if (
			process.env.STATE_LOCAL &&
			JSON.parse(process.env.STATE_LOCAL.toLowerCase())
		)
			return await utils.load.local({ project });
		if (
			process.env.STATE_CLOUD &&
			JSON.parse(process.env.STATE_CLOUD.toLowerCase())
		)
			return await utils.load.cloud({ project });
	} catch (e) {
		console.error(`op:project:state:load:error : ${e}`);
	}
	console.log(`found no previous local / cloud state for project : ${project}`);
	return {};
}

async function opProjectStateExport({ context, data }) {
	// tons to update , just disregard this for now

	return;
	// force export full project ; from {data}
}

async function opProjectStateSetup({ context, data }) {
	// if local export enabled, duplicate boilerplate
	const { project } = context;
	const dirs = [
		{
			source: `../boilerplate/backend-boilerplate`,
			target: `${process.env.EXPORT_APPS_ROOT}/${project}/backend`,
		},
		{
			source: `../boilerplate/vitereact-boilerplate`,
			target: `${process.env.EXPORT_APPS_ROOT}/${project}/vitereact`,
		},
	];

	for (const { source, target } of dirs) {
		// Copy the directory from source to target while respecting .gitignore
		await fsextra.copy(source, target, {
			filter: (src) => {
				// Respect .gitignore by checking if the file is not listed in .gitignore
				const ignoreFile = `${source}/.gitignore`;
				if (fs.existsSync(ignoreFile)) {
					const ignoreList = fs
						.readFileSync(ignoreFile, "utf-8")
						.split("\n")
						.map((line) => line.trim())
						.filter(Boolean);
					return !ignoreList.some((ignorePattern) => src.includes(ignorePattern));
				}
				return true; // If no .gitignore, copy everything
			},
			recursive: true, // Ensure folders are created recursively
		});
	}

	await fsextra.copyFile(
		`../boilerplate/package.json`,
		`${process.env.EXPORT_APPS_ROOT}/${project}/package.json`,
	);
	await fsextra.copyFile(
		`../boilerplate/README.md`,
		`${process.env.EXPORT_APPS_ROOT}/${project}/README.md`,
	);
	// write meta.json
	fs.writeFileSync(
		`${process.env.EXPORT_APPS_ROOT}/${project}/vitereact/src/_cofounder/meta.json`,
		JSON.stringify({ project }),
	);
}

async function opProjectStateSave({ context, data }) {
	// save, full current state of project
}

export default {
	"op:PROJECT::STATE:UPDATE": opProjectStateUpdate,
	"op:PROJECT::STATE:LOAD": opProjectStateLoad,
	"op:PROJECT::STATE:SETUP": opProjectStateSetup,
	"op:PROJECT::STATE:EXPORT": opProjectStateExport,
	// "op:PROJECT::STATE:SAVE": opProjectStateSave,
};
