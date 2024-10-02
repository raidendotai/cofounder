import utils from "@/utils/index.js";
import yaml from "yaml";

async function promptStore({ context, data }) {
	const { pm, db, backend, uxdatamap } = data;
	const { prd, uxdmd, brd } = pm;

	const store = { id: "redux" };
	/*
    [system]
  */

	return [
		{
			role: `system`,
			content: `your role as an expert web app and react senior dev and product manager is to write the code for the ${store.id} store script component based on the provided task; which encompasses all required data states and methods for the app's global states and actions

---

- analysis , in between \`\`\`markdown\`\`\`\` section
- full store component tsx code , in between \`\`\`tsx\`\`\`\` section
- dependencies, in between \`\`\`yaml\`\`\`\` section ; where any needed packages imported into the component code and need to be installed will be mentionned ; the yaml should have object : {dependencies : {"package":"version"} } ; (you can also just put "*" for version)
use doublequotes for every string inside the yaml to make sure formatting is good

---

> ask yourself what should be defined in the store component that will be used by all views later , in terms of global state variables and actions

> your answer should strictly be the code for the store tsx component
your answer will be directly pasted into the component

> it should encompasses everything required by the app's global store states and actions, in one single script
> the store script you will write will wrap the root component of the app ; no need to write the wrapper part ; it will be included later as \`<Provider store={store}> <App/> </Provider>\` , where the store is the actual script your will write and export here

---

try to use async/await when you can

> extremely turbo important :
- you can only use the following packages :
	- @reduxjs/toolkit
	- react-redux
	- redux-persist
	- socket.io-client
	- axios

- you need to export default and make sure everything else that will be needed by views is exported too !

---

note :
  > if app has auth capabilities, make sure you global state covers auth token
  > if app has realtime capabilities, make sure global state covers realtime auth and subscriptions
  feel free to consult the provided backend server code to help you figure out how those details should be implemented

---

> important :
		the store should strictly handle getting and setting the provided global state variables !
		it should not handle making the other api calls - those parts will be handled by concerned components !
> again , very important :
		the store should strictly handle getting and setting the provided global state variables !
		it should not handle making the other api calls - those parts will be handled by concerned components !
> super important : 
    use localstorage to avoid things being lost on refresh !

---
> conduct the analysis first, reply iwith the analysis inside of \`\`\`markdown\`\`\`
> make full complete store component code in \`\`\`tsx\`\`\` based on your analysis
> dependencies, in between \`\`\`yaml\`\`\`\` with object: {dependencies : {package:version}}

you are a genius + you get $9999`,
		},
		{
			role: "user",
			content: `\`\`\`PRD:product-requirements-document
${prd}
\`\`\``,
		},
		{
			role: "user",
			content: `\`\`\`UX-analysis-document
${uxdmd}
\`\`\``,
		},
		{
			role: "user",
			content:
				`\`\`\`BRD:backend-requirements-document
${brd}
\`\`\`

` +
				(!backend?.requirements?.restApi?.required
					? ""
					: `---
\`\`\`BACKEND:specifications:openAPI
${yaml.stringify(backend.specifications.openapi)}
\`\`\`

`) +
				(!backend?.requirements?.realtimeWebsockets?.required
					? ""
					: `---
\`\`\`BACKEND:specifications:asyncAPI
${yaml.stringify(backend.specifications.asyncapi)}
\`\`\`
` +
						`
---

\`\`\`BRD:server:main
${yaml.stringify(backend.server.main)}
\`\`\`

`),
		},
		{
			role: "user",
			content: `\`\`\`app:architecture
${yaml.stringify(uxdatamap)}
\`\`\``,
		},
		{
			role: "user",
			content: `make the analysis and implement the tsx component;
> implement the ${store.id} store component, fully and working from the get go;

---

try to use async/await when you can

> extremely turbo important !!! :
- you can only use the following packages :
	- @reduxjs/toolkit
	- react-redux
	- redux-persist
	- socket.io-client
	- axios

- you need to export default and make sure everything else that will be needed by views is exported too !

---

> make sure it has all the required imports !! no missing imports !
> should export a default method too ! so that it can be imported later as \`import store from '@/store/main'\` !


> important :
		the store should strictly:
      > handle getting and setting the provided global state variables !
      > if applies , handle realtime events subscriptions
		it should not handle making view-specific api calls - those parts will be handled by concerned view components !
> again, important :
		the store should strictly:
      > handle getting and setting the provided global state variables !
      > if applies , handle realtime events subscriptions
		it should not handle making view-specific api calls - those parts will be handled by concerned view components !

> super important : 
    use localstorage to avoid things being lost on refresh !


> do not assume that anything else is implemented !
> do not make any assumptions that something else will be plugged here !
> implement 100% of everything you need to implement ! do not hallucinate importing something that doesnt exist!

> the store component should work 100% out the box without any further edits ! very important !

---

important :
> use snake_case for any naming you do

extremely important :
> ensure full perfect coherence with: backend server methods / events / names, schemas
> field names and schemas epecially

---

- analysis , in between \`\`\`markdown\`\`\`\` section
- full store component tsx code , in between \`\`\`tsx\`\`\`\` section
- dependencies, with object {dependencies:{package:version,...}}, in between \`\`\`yaml\`\`\`\` section

you are a genius + you get $9999`,
		},
	];
}

async function webappStoreGenerate({ context, data }) {
	const timestamp = `${Date.now()}`;

	const messages = await promptStore({ context, data });

	const { generated } = await context.run({
		id: "op:LLM::GEN",
		context: {
			...context, // {streams , project}
			operation: {
				key: `webapp.react.store.redux.latest`,
				meta: {
					name: "Webapp Data Store",
					desc: "redux data store component code",
				},
			},
		},
		data: {
			model: `chatgpt-4o-latest`, //`gpt-4o`,
			messages: messages,
			preparser: false,
			parser: false,
		},
	});

	const extraction = await utils.parsers.extract.backticksMultiple({
		text: generated,
		delimiters: [`markdown`, `tsx`, `yaml`],
	});

	const { markdown, tsx } = extraction;
	if (!tsx.length) {
		throw new Error("webapp:store:generate error - generated tsx is empty");
	}

	const parsedYaml = extraction.yaml ? yaml.parse(extraction.yaml) : {};
	const generatedStore = {
		analysis: markdown,
		tsx,
		dependencies: parsedYaml.dependencies
			? Object.fromEntries(
					Object.keys(parsedYaml.dependencies).map((key) => [key, "*"]),
				)
			: [],
		timestamp,
	};

	await Promise.all(
		[`${timestamp}`, `latest`].map(async (version) => {
			await context.run({
				id: "op:PROJECT::STATE:UPDATE",
				context,
				data: {
					operation: {
						id: `webapp:react:store`,
						refs: {
							id: "redux",
							version,
						},
					},
					type: `end`,
					content: {
						key: `webapp.react.store.redux.${version}`,
						data: generatedStore,
					},
				},
			});
		}),
	);

	if (Object.keys(generatedStore.dependencies).length) {
		await context.run({
			id: "op:PROJECT::STATE:UPDATE",
			context,
			data: {
				operation: {
					id: "settings:config:package",
				},
				type: `end`,
				content: {
					key: "settings.config.package",
					data: {
						webapp: {
							dependencies: generatedStore.dependencies,
						},
					},
				},
			},
		});
	}

	return {
		timestamp,
		webapp: {
			react: {
				store: {
					// ie. "views" , "sections" , "store" , "root"
					redux: {
						// ie. {UV_* , SEC_* , redux} , "app" (in case of root)
						[timestamp]: generatedStore,
						latest: generatedStore,
					},
				},
			},
		},
	};
}

export default {
	"WEBAPP:STORE::GENERATE": webappStoreGenerate,
};
