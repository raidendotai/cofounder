import utils from "@/utils/index.js";
import yaml from "yaml";

async function backendOpenapiDefine({ context, data }) {
	if (!data.backend.requirements?.restApi?.required) {
		await context.run({
			id: "op:PROJECT::STATE:UPDATE",
			context,
			data: {
				operation: {
					id: "backend:specifications:openapi",
				},
				type: `end`,
				content: {
					key: "backend.specifications.openapi",
					data: {},
				},
			},
		});
		return {
			backend: {
				specifications: {
					openapi: {},
				},
			},
		};
	}

	const { pm, db, backend } = data;
	const { prd, frd, drd, brd } = pm;
	const messages = [
		{
			role: "system",
			content: `- you are a genius Product Manager & Software Archtect & API designer
- your role is to make the openAPI specs for the user-facing API for the provided task

- your API should be comprehensive, and include schema object for each case,
which will be used as references to build the frontend app connected to the API

- cover all cases ; data-related tasks only (ie. you are making a mock api for user-facing data operations)

- do a thorough analysis of the provided task

- think from perspectives of multiple personas, put yourself in situation, to make sure your openAPI definition is fully comprehensive and ready to be used in production exactly as is

- ask yourself:
  * what are the key personas using the user-facing, frontend API ?
  * what are all the routes & schemas required by features expected to be seen by users in the frontend ?
	* am i assigning an "operationId" for every path&route ?

- ask yourself:
  * what are all the routes & schemas required by features expected to be seen by users in the app ?
- your answer will be pushed to production and will be responsible for an app used by thousands of users, instantly
- your aim is to cover all use cases, as the expert product manager & architect you are

---

give a final, super comprehensive answer in strict, parseable openAPI 3.0.0 YAML format
which will be perfectly ready to plug into the backend in development,
and pushed to staging directly and work flawlessly

it should be comprehensive for the needs required by all the features
answer in strict parseable openAPI 3.0.0 in YAML format,
with all schemas, for all scenarios ; - and specifying cases when a given schema field is required

the root dev url for the API is "http://localhost:1337" ; you can specify that in openapi

super important :
> methods, routes, operationIds, and components (parameters and components) only
> no input/output examples objects !

> include a "summary" key for each route

---

> note : if auth functionalities are present, use an architecture that will be compatible with a simple JWT auth system !
	ie.
		> \`Authorization: Bearer <token>\` in headers on authenticated requests
		>	jwt type methods that return the authorization token on login, and that is used in header by subsequent authenticated requests 
  important : if auth methods in api, token should be returned on both signup and login !

---

important :
use snake_case for any naming you do

---

your reply will be directly transferred as the final OPENAPI structure, so do not put anything else in your reply besides the openAPI structure
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
			content: `implement the openAPI structure
it is expected to be very comprehensive and detailed ; in a VALID PARSEABLE YAML format

you're a genius`,
		},
	];

	const openapiStructure = (
		await context.run({
			id: "op:LLM::GEN",
			context: {
				...context, // {streams , project}
				operation: {
					key: "backend.specifications.openapi",
					meta: {
						name: "openAPI",
						desc: "openAPI specifications",
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
				id: "backend:specifications:openapi",
			},
			type: `end`,
			content: {
				key: "backend.specifications.openapi",
				data: openapiStructure,
			},
		},
	});

	return {
		backend: {
			...data.backend,
			specifications: {
				openapi: openapiStructure,
			},
		},
	};
}

export default {
	"BACKEND:OPENAPI::DEFINE": backendOpenapiDefine,
};
