import utils from "@/utils/index.js";
import yaml from "yaml";

async function promptAnalysis({ context, data }) {
	const { task } = data;
	const { code, decorators, apis } = task;
	return [
		{
			role: "system",
			content: `you are an expert backend and node js dev
- your role is to generate an analysis for for functions to implement that may require the use of external APIs , either through API calls or npm sdks

- you are provided with descriptions and contextual code snippets of desired functions, from a node server module
	these function are tagged as needing the implementation of external APIs/SDKs for the tasks they are meant to accomplish

- you are also provided with some search results for external APIs for each function from some external APIs that were indexed
	>	you are to determine whether external API search result(s) are relevant or no for the desired use cases descriptions
		> if so , which ones to use and how ? what do they need to run ? how to use them ? how to format their expected response ?
		> if no search result is relevant, do you know, about fitting nodejs/npm SDKs/packages or other APIs you are familiar with that are fit for the task ?
			and if so, how to use them ?
	> note : if a fitting external API is identified and also has SDKs you know about
		its prefereable to call the API using the provided openapi / docs instead of the SDK you already know about
		( because SDKs might have been updated since your last knowledge base ) ;
		use SDKs for when no APIs search results make sense for the analyzed implementation case
	> note : if you are using references from provided docs, extracts and include snippets from them inside your analysis to further document your analysis properly  

conduct a detailed analysis for each of the ${apis.length} provided functions to implement

your reply should start with : "\`\`\`markdown" and end with "\`\`\`"

you will be tipped $999
you're a genius
`,
		},
		// each api entry in its own message
		...apis.map(({ id, description, snippet, rag }) => {
			return {
				role: "user",
				content: `\`\`\`task:${id}
${yaml.stringify({
	functionDescription: description,
	contextCodeSnippet: snippet,
})}
\`\`\`

\`\`\`apis-search-results:${id}
${rag.length ? yaml.stringify(rag) : ""}
\`\`\`
`,
			};
		}),
		{
			role: "user",
			content: `Conduct your analysis each of the ${apis.length} provided functions to implement, with each function in its separate and very detailed section, and make sure you do not miss any useful detail !

be extremely detailed and include every single used reference and detail in your analysis for it to be fully comprehensive and complete

you are a genius`,
		},
	];
}

async function promptImplementMerge({ context, data }) {
	const { pm, db, backend, task } = data;
	const { prd, frd, drd, brd } = pm;
	const { code, apis, analysis } = task;
	const { openapi, asyncapi } = backend.specifications;
	/*
		should also get BRD here ! important ! ie. so it doesnt do stupid placeholders ?
		should provide full code too ? maybe 2 pass implement directly ; implement and revise ?
		no need for rag here
	*/
	return [
		{
			role: "system",
			content: `Your task, as the genius backend dev expert you are, is to generate the full nodejs script for a module, based on the provided specifications and details of the backend in development

- the current code of the server script is provided
  the desired updates are provided
> your main task is to add the provided functions , and return a fully functional script that has both the original features and the newly added updates, with everything working perfectly and as expected

---

your role is to implement the full express server for the provided task for the \`server.mjs\` (type: module script)
you will answer in 3 parts :

- analysis , in between \`\`\`markdown\`\`\`\` section
- code , in between \`\`\`mjs\`\`\`\` section
- dependencies and env variables , in between \`\`\`yaml\`\`\`\` section ; where any needed packages to install and needed env variables to setup will be mentionned ; the yaml should have objects : { dependencies : {"package":"version"} , env : {"key" , "temp_value"} } ("dependencies" (for packages) and "env" for env variables (and their temporary values) )
use doublequotes for every string inside the yaml to make sure formatting is good

---

in your analysis, ask yourself :
  > what are the added functions ?
  > how do i merge all updates perfectly with the working code ?
    > is the full flow covered ?
    > are all the expected functions fullfilled ?
    > am i covering all the parts for all the required updates ? 
      including imports, functions, db operations, ... ?
      are all the new updates congruent with the original code structure, flow, db operations and all that is expected ?

---

for any db requirements, use postgres from \`@electric-sql/pglite\`
- to use postgres, include this snippet in your script :
\`\`\`
import { PGlite } from "@electric-sql/pglite";
const postgres = new PGlite("./db");
/* then, can be used like this :
await postgres.query("SELECT * FROM exampletable;")
*/
// note : the postgres tables + seed were already created before , you can use the postgres directly without configuring it
\`\`\`
postgres is use exactly how is provided in the snippet, do not change anything about loading it / configuring it, else it breaks ;
postgres is imported, initialized and queries EXACTLY AS SHOWN IN THE SNIPPET ! NO OTHER WAY !

---

note : the postgres tables + seed were already created before , you can use the postgres directly without configuring it ; do not create tables in script !
extremely important :
- the DB R/W need to be 100% compatible with the tables and schemas of the provided DB specifications !!
- if it makes use of .env , make your you import \`dotenv\` and \`dotenv.config()\` to read .env before !

---

extremely important :

- you are to implement the entire server as specified in the provided docs , with a focus on DB R/W operations
- you are to implement every single thing needed by the backend server and output one single big working perfect \`server.mjs\` script
- do not assume anything is implemented yet ! you will do 100% of everything needed and output one single big working perfect \`server.mjs\` script
- no placeholders, no hallucinated imports
- again, do not assume anything is implemented yet ! you will do 100% of everything needed and output one single big working perfect \`server.mjs\` script
---

note:
> if ie. some mock data is meant to to store an image url, use a https://picsum.photos/ url with a random seed

super important :
> use snake_case for any new naming you do
> ensure full perfect coherence with DB fields names and all provided specs names

---

extremely important :
- the DB R/W need to be 100% compatible with the tables and schemas of the provided DB specifications !!
- the app flow must be 100% working perfect everywhere

you are a genius + you get tipped $9999999
`,
		},
		{
			role: "user",
			content: `\`\`\`PRD:product-requirements-document
${prd}
\`\`\`

\`\`\`FRD:features-requirements-document
${frd}
\`\`\`
`,
		},
		{
			role: "user",
			content: `
\`\`\`DB:postgres:sql
${db.postgres}
\`\`\`

---

extremely turbo important :
> pay extreme attention to DB details :
	> the things that you are expected to provide with inserts :
			> should you make a uuid before inserting with postgres query ?
			> are there key constraints ?
			> is the db querying code using the exact names as in db fields ?
			> are you providing everything needed to db every single time ?
`,
		},
		{
			role: "user",
			content: `\`\`\`BRD:backend-requirements-document
${brd}
\`\`\``,
		},
		data.backend?.requirements?.restApi?.required && {
			role: "user",
			content: `\`\`\`BACKEND:specifications:openAPI
${yaml.stringify(openapi)}
\`\`\``,
		},
		data.backend?.requirements?.realtimeWebsockets?.required && {
			role: "user",
			content: `\`\`\`BACKEND:specifications:asyncAPI
${yaml.stringify(asyncapi)}
\`\`\``,
		},
		{
			role: "user",
			content: `The functions updates of the original code are the following :

\`\`\`functions:update:tasks
${yaml.stringify({
	toUpdate: apis.map(({ description, snippet }) => {
		return {
			functionDescription: description,
			contextCodeSnippet: snippet,
		};
	}),
})}
\`\`\``,
		},
		{
			role: "user",
			content: `The original full script code to update is :
\`\`\`mjs
${code}
\`\`\`
`,
		},
		{
			role: "user",
			content: `The analysis of the new updates to make to the server code is in the following :

\`\`\`functions:update:analysis
${analysis}
\`\`\``,
		},
		{
			role: "user",
			content: `extremely important :
- you are to implement the entire \`server.mjs\` as specified in the backend specifications , with a focus on DB R/W operations
- you are to implement every single thing needed by the server and output one single big working perfect \`server.mjs\` script
- do not assume anything is implemented yet ! you will do 100% of everything needed and output one single big working perfect \`server.mjs\` script
- no placeholders, no hallucinated imports


---

extremely turbo important :
> pay extreme attention to DB details :
	> the things that you are expected to provide with inserts :
			> should you make a uuid before inserting with a postgres query ?
			> are there key constraints ? should you create something before inserting something else because of contraints ?
			> is the db querying code using the exact names as in db fields ?
			> are you providing everything needed to db every single time ?

---

- again, do not assume anything is implemented yet ! you will do 100% of everything needed and output one single big working perfect \`server.mjs\` script
- again , you are to implement every single thing needed by the server and output one single big working perfect \`server.mjs\` script
- no placeholders, no hallucinated imports ; one 100% perfect complete working server script

extremely important :
- the DB R/W need to be 100% compatible with the tables and schemas of the provided DB specifications !!

now do the analysis , write the full working script and specify the dependencies+env`,
		},
	].filter((e) => e);
}
async function promptImplementReview({ context, data }) {
	const { task } = data;
	const { brd } = pm;
	const { code, decorators, apis, analysis, implementations } = task;
	/*
		maybe double check verify instead ?
	*/
	return [];
}

async function swarmAugmentBackendExternalapis({ context, data }) {
	/*
	 */
	const { task } = data;
	const { code } = task;
	const decorators = (await utils.parsers.extract.decorators({ code })).filter(
		(item) => item.type === "external-api" || item.type === "external-apis",
	);
	if (!decorators.length) return {};

	// apis RAG
	const apis = await Promise.all(
		decorators.map(async (item, idx) => {
			const { description, snippet } = item;
			const ragText = `Description : ${description}\n\nCode Snippet :\n\`\`\`\n${snippet}\n\`\`\``;
			return {
				id: `fn:${idx + 1}/${decorators.length}`,
				description,
				snippet,
				rag: (
					await context.run({
						id: `op:INDEXDB::QUERY`,
						context,
						data: {
							index: "apis",
							text: ragText,
							amount: 5,
						},
					})
				).results,
			};
		}),
	);
	data.task.decorators = decorators;
	data.task.apis = apis;
	const messagesAnalysis = await promptAnalysis({ context, data });

	const analysisPass = (
		await context.run({
			id: "op:LLM::GEN",
			context: {
				...context, // {streams , project}
				operation: {
					key: "swarm.augment.analysis",
					meta: {
						name: "Swarm Post-Gen Check",
						desc: "analysis pass",
					},
				},
			},
			data: {
				model: `chatgpt-4o-latest`, //`gpt-4o`,
				messages: messagesAnalysis,
				preparser: `backticks`,
				parser: false,
			},
		})
	).generated;

	data.task.analysis = analysisPass;

	const messagesImplementMerge = await promptImplementMerge({ context, data });
	const { generated } = await context.run({
		id: "op:LLM::GEN",
		context: {
			...context, // {streams , project}
			operation: {
				key: "swarm.augment.implement",
				meta: {
					name: "Swarm Code Update",
					desc: "implement changes & merge",
				},
			},
		},
		data: {
			model: `chatgpt-4o-latest`, //`gpt-4o`,
			messages: messagesImplementMerge,
			preparser: false,
			parser: false,
		},
	});

	const extraction = await utils.parsers.extract.backticksMultiple({
		text: generated,
		delimiters: [`markdown`, `mjs`, `yaml`],
	});

	const { mjs } = extraction;
	if (!mjs.length || !extraction.yaml) {
		throw new Error(
			"swarm:augment:backend:externalApis:generate error - generated code is empty",
		);
	}

	const parsedYaml = extraction.yaml ? yaml.parse(extraction.yaml) : {};
	const generatedServer = {
		mjs,
		dependencies: parsedYaml.dependencies
			? Object.fromEntries(
					Object.keys(parsedYaml.dependencies).map((key) => [key, "*"]),
				)
			: [],
		env: parsedYaml.env ? parsedYaml.env : {},
		timestamp: Date.now(),
	};

	return generatedServer;
}

export default {
	"SWARM:AUGMENT::BACKEND:EXTERNALAPIS": swarmAugmentBackendExternalapis,
};
