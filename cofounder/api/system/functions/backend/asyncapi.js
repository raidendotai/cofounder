import utils from "@/utils/index.js";
import yaml from "yaml";

async function backendAsyncapiDefine({ context, data }) {
	if (!data.backend.requirements?.realtimeWebsockets?.required) {
		await context.run({
			id: "op:PROJECT::STATE:UPDATE",
			context,
			data: {
				operation: {
					id: "backend:specifications:asyncapi",
				},
				type: `end`,
				content: {
					key: "backend.specifications.asyncapi",
					data: {},
				},
			},
		});
		return {
			backend: {
				specifications: {
					asyncapi: {},
				},
			},
		};
	}

	const { pm, db, backend } = data;
	const { prd, frd, drd, brd } = pm;
	const messages = [
		{
			role: "system",
			content: `- you are a genius Product Manager & Software Architect & Backend designer
- your role is to make the backend asyncAPI specs for the realtime features of the provided task

- your asyncAPI specs should be comprehensive, and include schema object for each case,
which will be used as references to build the frontend app connected to the backend

- cover all cases ; data-related tasks only (ie. you are making a mock backend for user-facing data operations)

- do a thorough analysis of the provided task

- think from perspectives of multiple personas, put yourself in situation, to make sure your asyncAPI definition is fully comprehensive and ready to be used in production exactly as is

- ask yourself:
  * what are all the events & schemas required by features expected to be seen by users in the frontend ?

- ask yourself:
  * what are all the events & schemas required by features expected to be seen by users in the app ?
- your aim is to cover all realtime use cases, as the expert product manager & architect you are

---

the root dev url for the server is "http://localhost:1337" ; you can specify that in specs

---

give a final, super comprehensive answer in strict, parseable asyncAPI YAML format
which will be perfectly ready to plug into the backend in development,
and pushed to staging directly and work flawlessly

it should be comprehensive for the needs required by all the realtime events described in the provided docs
answer in strict parseable asyncAPI in YAML format,
with all schemas, for all scenarios ; - and specifying cases when a given schema field is required

super important :
> methods, routes, operationIds, and components (parameters and components) only
> no input/output examples objects !
> you are only to detail realtime events and their schemas for realtime features described in the provided documents !

---

important :
use snake_case for any naming you do

---

your reply will be directly transferred as the final asyncAPI structure for the realtime events part of the backend,
so do not put anything else in your reply besides the asyncAPI structure that details the realtime events parts of the backend only !
your reply should start with : "\`\`\`yaml" and end with "\`\`\`"


you will be tipped $99999 + major company shares for nailing it perfectly off the bat`,
		},
		{
			role: "user",
			content: `\`\`\`PRD:product-requirements-document
${prd}
\`\`\``,
		},
		{
			role: "user",
			content: `\`\`\`PRD:product-requirements-document
${frd}
\`\`\``,
		},
		{
			role: "user",
			content: `\`\`\`DRD:database-requirements-document
${drd}
\`\`\`

---

\`\`\`DB:schemas
${yaml.stringify({ schemas: db.schemas })}
\`\`\`

`,
		},
		{
			role: "user",
			content: `\`\`\`BRD:Backend-requirements-document
${brd}
\`\`\``,
		},
		{
			role: "user",
			content: `implement the asyncAPI structure , for the realtime features specified in the provided documents
super important :
- your only focus is to make the asyncAPI for realtime events and their details , not anything else (such as a REST API ...)
- asyncAPI for realtime events and their details only !

it is expected to be very comprehensive and detailed ; in a VALID PARSEABLE YAML format

you're a genius`,
		},
	];

	const asyncapiStructure = (
		await context.run({
			id: "op:LLM::GEN",
			context: {
				...context, // {streams , project}
				operation: {
					key: "backend.specifications.asyncapi",
					meta: {
						name: "asyncAPI",
						desc: "asyncAPI specifications",
					},
				},
			},
			data: {
				model: `chatgpt-4o-latest`, //`gpt-4o`,
				messages,
				preparser: `backticks`,
				parser: `yaml`,
			},
		})
	).generated;

	await context.run({
		id: "op:PROJECT::STATE:UPDATE",
		context,
		data: {
			operation: {
				id: "backend:specifications:asyncapi",
			},
			type: `end`,
			content: {
				key: "backend.specifications.asyncapi",
				data: asyncapiStructure,
			},
		},
	});

	return {
		backend: {
			...data.backend,
			specifications: {
				asyncapi: asyncapiStructure,
			},
		},
	};
}

export default {
	"BACKEND:ASYNCAPI::DEFINE": backendAsyncapiDefine,
};
