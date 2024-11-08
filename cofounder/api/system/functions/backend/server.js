import utils from "@/utils/index.js";
import yaml from "yaml";

async function backendServerGenerate({ context, data }) {
	/*
    base on dev:test oneshot function
    mix with the bak api generate for the make sure blabla
  */
	const { pm, db, backend } = data;
	const { prd, frd, drd, brd } = pm;
	const { openapi, asyncapi } = backend.specifications;
	const messages = [
		{
			role: `system`,
			content: `Your task, as the genius backend dev expert you are, is to generate the full nodejs script for a module, based on the provided specifications and details of the backend in development

your role is to implement the full express server for the provided task for the \`server.mjs\` (type: module script)
you will answer in 3 parts :

- analysis , in between \`\`\`markdown\`\`\`\` section
- code , in between \`\`\`mjs\`\`\`\` section
- dependencies and env variables , in between \`\`\`yaml\`\`\`\` section ; where any needed packages to install and needed env variables to setup will be mentionned ; the yaml should have objects : { dependencies : {"package":"version"} , env : {"key" , "temp_value"} } ("dependencies" (for packages) and "env" for env variables (and their temporary values) )
use doublequotes for every string inside the yaml to make sure formatting is good

---

in your analysis, ask yourself :
- what features are expected ?
	does it need DB operations ?
  does it need storage ?
		> if so , how to handle the file storage / uploads / serving locally ?

	does it need realtime features and websocket events ?
	what operations are expected from the server to perfectly meet what the user expects from the feature ?
	think slowly, do not rush to answer ;
	think : am i achieving great UX ? am i doing great, perfect work ?
	do not overlook details !

in your code, include comment blocks before each implemented function or operation where you analyze what is done and why - it wil help you reason through more thoroughly and do a much greater work

> super important :
  - in case a function requires the use of an external API (ie. for checking a stock price , or generating some image , ...  ),
		you should include the following decorator inside your pre-function comment :
			\`@@need:external-api : description of the external api necessitated and what it should do\`
		you should also return a mock response that fits the right schema requirements ! so that the server returns mock responses in worst case !
		important : external APIs should only handle external functionalities like the ones mentionned ; the server already has storage and DB access, so those do not need external APIs !
		important : no placeholders ! no replace later ! no hallucinated unfinished code ! return a mock response that fits schema requirements in case you need to !
		if feature needs external api, include the specified decorator \`@@need:external-api : description...\` in comment and return a mock response instead !

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

notes :
- make sure cors is enabled
- if you need realtime, you can use socket.io
	if you need file storage capabilities (ie. file upload/download features), you can write/read locally from the \`./storage\` folder (create it if needed)
  for any db requirements, use postgres ; you can only use postgres (from @electric-sql/pglite ) with raw queries (no ORMs or anything)
- to use postgres, include this snippet in your script :
\`\`\`
import { PGlite } from "@electric-sql/pglite";
const postgres = new PGlite("./db");
/* then, can be used like this :
await postgres.query("SELECT * FROM exampletable;")
*/
\`\`\`
note : the postgres tables + seed were already created before , you can use the postgres directly without configuring it ; do not create tables in script !
extremely important :
- the DB R/W need to be 100% compatible with the tables and schemas of the provided DB specifications !!

- if auth needed, use jwt middleware
	important : if auth , make sure you return token both on signup and login (even if openapi might have skipped that detail ! else stuff might break ! )
  important : if auth , and also realtime websockets features , make sure auth / jwt also applies to sockets not just the api


- if some function is too complex too implement (ie. needs more than known packages or DB R/W operations or too complex etc ...), you should return a mock response ; most important is : do not leave some "placeholder" function of value , do the mockup work if needed !
everything needs to be implemented and working, no placeholders, no hallucinated imports, no "do this later" ; everything working perfect in one single script !

- if you need realtime, you can use socket.io
	if you need file storage capabilities (ie. file upload/download features), you can write/read locally from the \`./storage\` folder (create it if needed)
  for any db requirements, use postgres ; you can only use postgres (from @electric-sql/pglite ) with raw queries (no ORMs or anything)

- if auth needed, use jwt middleware
	important : if auth , make sure you return token both on signup and login (even if openapi might have skipped that detail ! else stuff might break ! )

- use morgan middleware to log any incoming request and details (ie. method, path, headers, params, query, body) - just for better dev exp

- if it makes use of .env , make your you import \`dotenv\` and \`dotenv.config()\` to read .env before !

---

extremely important :
- get the server port from env ; make default PORT always 1337 !!

---


extremely important :

- you are to implement the entire server as specified in the provided docs , with a focus on DB R/W operations
- you are to implement every single thing needed by the backend server and output one single big working perfect \`server.mjs\` script
  > if backend has REST API , everything required and mentionned in the openAPI specs
  > if backend has realtime websockets , everything required and mentionned in the asyncAPI specs
  > if backend has both REST API and realtime Websockets , everything required by both and everything mentionned in both openAPI specs and asyncAPI specs ; and both working perfectly within the same \`server.mjs\`

- do not assume anything is implemented yet ! you will do 100% of everything needed and output one single big working perfect \`server.mjs\` script
- no placeholders, no hallucinated imports
- again, do not assume anything is implemented yet ! you will do 100% of everything needed and output one single big working perfect \`server.mjs\` script

- again , you are to implement every single thing needed by the backend server:
    > if backend has REST API , everything required and mentionned in the openAPI specs
    > if backend has realtime websockets , everything required and mentionned in the asyncAPI specs
    > if backend has both REST API and realtime Websockets , everything required by both and everything mentionned in both openAPI specs and asyncAPI specs ; and both working perfectly within the same \`server.mjs\`

> one single big working perfect \`server.mjs\` script
- if it makes use of .env , make your you import \`dotenv\` and \`dotenv.config()\` to read .env before !

---

important:
> if some mock data is meant to to store an image url, use a https://picsum.photos/ url with a random seed

---

important :
> use snake_case for any naming you do
> ensure full perfect coherence with DB fields names and provided specs names

---

extremely important :

- the DB R/W need to be 100% compatible with the tables and schemas of the provided DB specifications !!

---

extremely important :
- if you have to mock a function (ie. because it needs external APIs functionalities), make sure that:
	> the endpoint / event still returns something that is fitting with the response schemas
	> the endpoint / event triggers a function that you mock somewhere in the script and uses its response in the flow
	> the mock function that needs to be augmented later is actually triggered by the endpoint / event that needs it !
		and has the right response formats
	> the mock function has instructions in surrounding comments on what the function needs to be updated !
		so that once the function is updated, there are no subsequent updates to make, as it would already be plugged into the server flows and be consistent 100%
	> example :

\`\`\`example-code-snippet
	...

  /*
    @need:external-api: An example description of some external api feature
  */
  async function example_function_to_mock_name({...}){
    // returning a mock response in the expected response format for now
    return {
      timestamp: Date.now(),
      example_field_in_expected_format_structure: {
        id: 237,
        dummy: "example dummy string",
        someResults: ["whatever","dummy"],
        avatar: "https://picsum.photos/id/237/200/300"
      },
    }
  }
	
	...

  app.post('/api/example-complex-feature', async (req, res) => {
    ...
    const fetched_data = await example_function_to_mock_name({ ... })
    ...
  })
	
  ...

\`\`\`
	
- the app flow must still be 100% working perfect everywhere


you are a genius + you get tipped $9999999
`,
		},
		{
			role: "user",
			content: `\`\`\`PRD:product-requirements-document
${prd}
\`\`\``,
		},
		{
			role: "user",
			content: `\`\`\`FRD:features-requirements-document
${frd}
\`\`\``,
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
			role: `user`,
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

extremely important :
- get the server port from env ; make default PORT always 1337 !!

- if a function needs a external api to satisfy the expected feature, include the specified decorator \`@@need:external-api : description...\` in comment (in the code right before the concerned function) and return a mock response instead !

- note : the postgres tables + seed were already created before , you can use the postgres directly without configuring it ; do not create tables in script !

- if auth needed, use jwt middleware
	> important : if auth , make sure you return token both on signup and login (even if openAPI might have skipped that detail ! else stuff might break ! )
  > important : if auth , and also realtime websockets features , make sure auth / jwt also applies to sockets not just the api !

- again, do not assume anything is implemented yet ! you will do 100% of everything needed and output one single big working perfect \`server.mjs\` script
- again , you are to implement every single thing needed by the server and output one single big working perfect \`server.mjs\` script
- no placeholders, no hallucinated imports ; one 100% perfect complete working server script

extremely important :
- the DB R/W need to be 100% compatible with the tables and schemas of the provided DB specifications !!

now do the analysis , write the full working script and specify the dependencies+env`,
		},
	].filter((e) => e);

	const { generated } = await context.run({
		id: "op:LLM::GEN",
		context: {
			...context, // {streams , project}
			operation: {
				key: "backend.server.main",
				meta: {
					name: "Backend code",
					desc: "backend server main",
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
		delimiters: [`markdown`, `mjs`, `yaml`],
	});

	const { mjs } = extraction;
	if (!mjs.length || !extraction.yaml) {
		console.error("backend:server:generate error - generated is empty");
		return {
			backend: {
				...data.backend,
				server: {
					main: {
						mjs: "",
						dependencies: {},
						env: {},
						timestamp: Date.now(),
					},
				},
			},
		};
	}

	const parsedYaml = extraction.yaml ? yaml.parse(extraction.yaml) : {};
	let generatedServer = {
		mjs,
		dependencies: parsedYaml.dependencies
			? Object.fromEntries(
					Object.keys(parsedYaml.dependencies).map((key) => [key, "*"]),
				)
			: [],
		env: parsedYaml.env ? parsedYaml.env : {},
		timestamp: Date.now(),
	};

	/*
	await context.run({
		id: "op:PROJECT::STATE:UPDATE",
		context,
		data: {
			operation: {
				id: "backend:server:main",
			},
			type: `end`,
			content: {
				key: "backend.server.main",
				data: generatedServer,
			},
		},
	});
	*/

	// call swarm/agument:external-apis without waiting ; it will iterate it finds any external api decorators and replace
	generatedServer = {
		...generatedServer,
		...(await context.run({
			id: `SWARM:AUGMENT::BACKEND:EXTERNALAPIS`,
			context,
			data: {
				...data,
				task: {
					code: generatedServer.mjs,
				},
			},
		})), //-> {mjs,dependencies?,env,timestamp} ; will replace if new else returns empty object
	};

	await context.run({
		id: "op:PROJECT::STATE:UPDATE",
		context,
		data: {
			operation: {
				id: "backend:server:main",
			},
			type: `end`,
			content: {
				key: "backend.server.main",
				data: generatedServer,
			},
		},
	});

	if (
		Object.keys(generatedServer.dependencies).length ||
		Object.keys(generatedServer.env).length
	) {
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
						backend: {
							dependencies: generatedServer.dependencies,
							env: generatedServer.env,
						},
					},
				},
			},
		});
	}

	return {
		backend: {
			...data.backend,
			server: {
				main: generatedServer,
			},
		},
	};
}

export default {
	"BACKEND:SERVER::GENERATE": backendServerGenerate,
};
