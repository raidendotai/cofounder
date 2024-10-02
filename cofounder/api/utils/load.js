import fs from "fs";
import yaml from "yaml";
import path from "path";
import { merge } from "lodash-es";
import utils from "@/utils/index.js";
import pqueue from "p-queue";

async function readLocal({ project }) {
	/*
    with root dir being : ./db/projects/{project}
    read all yaml files (including deeply nested etc) ; all objects in yaml files contain { key , data }
    return this :
    db : [
      {key , data , },
      {key , data , },
      {key , data , },
      {key , data , },
    ]
    
    file/dir operations should be sync
  */
	let db = [];
	const dir = `./db/projects/${project}`;
	const files = fs.readdirSync(dir);
	await Promise.all(
		files.map(async (file) => {
			const fullPath = path.join(dir, file);
			const stat = fs.statSync(fullPath);
			if (stat.isDirectory()) {
				// Recursively read directories if needed
				const nestedDb = await readLocal({ project: path.join(project, file) });
				db.push(...nestedDb);
			} else if (file.endsWith(".yaml") || file.endsWith(".yml")) {
				const fileContent = fs.readFileSync(fullPath, "utf8");
				const parsedData = yaml.parse(fileContent);
				db.push({ key: parsedData.key, data: parsedData.data });
			}
		}),
	);
	return db;
}

async function loadLocal({ project, deconstructed = false }) {
	const db = await readLocal({ project });
	let state = {};
	/*
    example of db -
    db : [
      {
        key: "example.some.nested.key"
        data: {
          value: "example",
          othervalue: "someotherexample",
        },
      },
      {
        key: "whatever.haha"
        data: 99,
      },
    ]
  */
	/*
    expected returned by function is -
    state : {
      example: {
        some : {
          nested : {
            key : {
              value: "example",
              othervalue: "someotherexample",
            }
          }
        }
      },
      whatever: {
        haha: 99
      },
    }
  */
	/*
    + write function that goes through all db items ; uses the "key" field and "data" content to build the object
    + should consider making keys that do not exist in the path, and also make user of merge from es-lodash (already imported in this module) for deep merging
    + consider that "data" field value can either be an object or a primitive 
  */
	db.forEach(({ key, data }) => {
		const keys = key.split(".");
		let current = state;

		keys.forEach((k, index) => {
			if (!current[k]) {
				current[k] = index === keys.length - 1 ? data : {};
			} else if (index === keys.length - 1) {
				current[k] = merge(current[k], data);
			}
			current = current[k];
		});
	});
	if (!deconstructed) return state;
	const keymap = Object.fromEntries(db.map(({ key, data }) => [key, data]));
	return { state, keymap };
}

async function readCloud({ project }) {
	const queue = new pqueue({
		concurrency: 20,
	});
	let db = [];
	const paths = {
		docs: [
			"pm/user/details",
			"pm/docs/ard",
			"pm/docs/drd",
			"pm/docs/fjmd",
			"pm/docs/frd",
			"pm/docs/prd",
			"pm/docs/uxdmd",
			"pm/docs/uxsmd",
			"architecture/uxsitemap/structure",
			"architecture/uxdatamap/structure",
			"architecture/uxdatamap/views",
			"api/openapi/structure",
			"api/openapi/components",
			"db/mock/schemas",
			"db/mock/seed",
			"db/mock/postgres",
			"settings/preferences/versions",
		],
		collections: [
			{ path: `api/operations`, sub: false },
			{ path: `ui/layout/mockup/views`, sub: `versions` },
			{ path: `ui/layout/mockup/sections`, sub: `versions` },
			{ path: `ui/code/react/stores`, sub: `versions` },
			{ path: `ui/code/react/root`, sub: `versions` },
			{ path: `ui/code/react/views`, sub: `versions` },
			{ path: `ui/code/react/sections`, sub: `versions` },
		],
	};

	await Promise.all(
		paths.docs.map(async (doc) => {
			await queue.add(async () => {
				try {
					const docData = await utils.firebase.doc.get({
						path: `/db/userdata/projects/${project}/state/${doc}`,
					});
					db.push(docData);
				} catch (e) {
					console.log(e);
				}
			});
		}),
	);

	await Promise.all(
		paths.collections.map(async (col) => {
			const { path, sub } = col;
			if (!sub) {
				await queue.add(async () => {
					try {
						const { docs } = await utils.firebase.collection.get({
							path: `/db/userdata/projects/${project}/state/${path}`,
						});
						db.push(...docs);
					} catch (e) {
						console.log(e);
					}
				});
			} else {
				try {
					const { docs } = await utils.firebase.collection.get({
						path: `/db/userdata/projects/${project}/state/${path}`,
					});
					docs.map((doc) => {
						if (doc.data && doc.key) db.push(doc);
					});
					await Promise.all(
						docs.map(async (rootDoc) => {
							try {
								const subResponse = await utils.firebase.collection.get({
									path: `/db/userdata/projects/${project}/state/${path}/${rootDoc.id}/${sub}`,
								});
								db.push(...subResponse.docs);
							} catch (err) {
								console.log(err);
							}
						}),
					);
				} catch (e) {
					console.log(e);
				}
			}
		}),
	);

	return db.filter((item) => item.key && item.data);
}
async function loadCloud({ project }) {
	/*
  
  fs.writeFileSync(
    "./dump/_dbFromLoadDebug.yml",
    yaml.stringify(db)
    )
    */
	/*
  const db = yaml.parse(fs.readFileSync("./dump/_dbFromLoadDebug.yml","utf8").toString())
  console.dir("op:project:load:cloud:debug  - loading from local")
  */
	const db = JSON.parse(JSON.stringify(await readCloud({ project })));
	const state = {};
	db.forEach(({ key, data }) => {
		const keys = key.split(".");
		let current = state;

		keys.forEach((k, index) => {
			if (!current[k]) {
				current[k] = index === keys.length - 1 ? data : {};
			} else if (index === keys.length - 1) {
				current[k] = merge(current[k], data);
			}
			current = current[k];
		});
	});

	return state;
}

export default {
	local: loadLocal,
	cloud: loadCloud,
};
