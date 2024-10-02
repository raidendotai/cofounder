import utils from "@/utils/index.js";
import yaml from "yaml";

async function pmBrdAnalysis({ context, data }) {
	const { pm, db } = data;
	const { details, prd, frd, drd } = pm;

	/*
		should be 2 (3?) steps :
			determine if needs { rest api , realtime socket io api }
			make structure
	*/
	const backendPrompt = [
		{
			role: "system",
			content: `you are an expert product manager and software architect and API designer ;
your role is to determine, based on the provided analysis documents for the app project in development, the specfications of the app backend

your task is very straightforward :
- based strictly on provided docs and outlined features, determine whether, yes or no, for the core features of the app MVP to be implemented, the backend :
		> requires a RESTful API ?
		> requires realtime (ie. websockets) ?

you will answer exactly in this format, delimited by \`\`\`yaml :

\`\`\`yaml
backend:
  requirements:
	  restApi:
		  justifyYourAnswer: "write your reasoning for your answer in case it is true"
			required: boolean # whether the backend requires or no a REST API
		realtimeWebsockets:
		  justifyYourAnswer: "write your reasoning for your answer in case it is true"
			required: boolean # whether the backend requires or no a REST API
\`\`\`

answer in strict parseable Yaml format, exactly in the provided format structure
your answer should start with : \`\`\`yaml

you will be tipped $9999
`,
		},
		{
			role: "user",
			content: `\`\`\`app-project:description
${details.text}
\`\`\``,
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
			content: `determine the backend specifications in terms of whether the backend needs a REST API , and whether it needs realtime Websockets.
your answer should start with : \`\`\`yaml

you are a genius
`,
		},
	];
	const backendStructureRequirements = (
		await context.run({
			id: "op:LLM::GEN",
			context: {
				...context, // {streams , project}
				operation: {
					key: "_pm.brd.requirements",
					meta: {
						name: "BRD Prepass",
						desc: "backend structure requirements check",
					},
				},
			},
			data: {
				model: `gpt-4o-mini`, //`gpt-4o`,
				messages: backendPrompt,
				preparser: `backticks`,
				parser: `yaml`,
			},
		})
	).generated;

	const messages = [
		{
			role: "system",
			content: `you are an expert product manager and software architect and backend and server and API designer

your job is to consult the provided web app details & analysis documents
in order to create a comprehensive and full Backend Requirements Document (BRD) for it

the emphasis are user-facing features,
based on the expected features and different journeys of different users in the web app

- your role is to conduct the analysis required to design the user-facing server of the provided task
- do a thorough analysis of the provided task

---

- think from all possibles perspectives, put yourself in situation, to make sure your server analysis is fully comprehensive and ready to be developed
- ask yourself:
  * what are the features involved in the user-facing server and that is called by the frontend ?
  * if a server API is required, what are all the routes required by features expected to be seen by users in the frontend ? what should go in their schemas ? (not technical, rather analytical description from a feature perspective)
	* if realtime features are required, what are all the events required by features expected to be seen by users in the frontend ? what should go in their schemas ? (not technical, rather analytical description from a feature perspective)

- your analysis will be used to make a prod-ready backend and will be responsible for an app used by thousands of users, instantly
- your aim is to cover all use cases, as the expert product manager & architect you are

> analyze the task thoroughly, then reply with your analysis in markdown format, in a well-formatted document to give to backend devs

---

> your role here is not the implementation itself, you are the product architect consultant
> your role is to analyze the requirements for all scenarios required by all features
  ask yourself :
    * am i covering all needed server features?
    * am i covering all features that the user expects ?
		* if a feature necessitates the use of an external API (ie. checking a stock price , generating an ai image, advanced features that need the use of an external API, etc ...)
			important : the backend already has DB and storage capabilities , so DO NOT MENTION DB OR STORAGE AS EXTERNAL APIS ! THOSE ARE ALREADY IMPLEMENTED INTERNALLY IN THE BACKEND !
			am i describing the details of what is needed ?
		* am i properly aligning my server design details with other design detail aspects of the project such as DB structure ?
  in order to ensure your analysis as a product architect consultant has covered every feature requirement

> your job is to make thorough, critical analysis work which will be provided as documentation for devteams to implement
  not a technical implementation, rather a thorough analysis, in plain language, of all expected features and their details

> try to outdo yourself by thinking of what might be omitted in advance
- the goal server should be comprehensive will be used as reference to build the app's MVP backend
- cover all cases ; but : data-related tasks only (ie. you are making a mock server with api and/or realtime for user-facing data operations)

---

> very important : for the current purpose of the BRD, the environment will be a mock prototype environment
do not bother with security details etc, have the requirements for the mock prototype
do not hang on very technical details (unless specifically emphasized), as the target is a mock dev prototype env : features functionality is the aim, not advanced technical coverage !

> SHOULD COVER DATA RELATED TASKS ONLY !
> THE MOCK SERVER YOU ARE MAKING IS FOR USER-FACING DATA OPERATIONS, NOT FRONTEND / SERVING STATIC STUFF !
> DATA RELATED TASKS ONLY !

---

your analysis is concerned with these two aspects aspects :
> if the app backend needs a server API , conduct the analysis regarding all the API needs
> if the app backend needs realtime Websockets , conduct the analysis regarding all the realtime events needed

you can only write about these aspects (either one of them or both , depending on whats provided in task documents )
important : DO NOT ANALYZE ANYTHING IN THE BACKEND BESIDES THESE 2 ASPECTS AND THEIR RELATIONS TO USER-FACING FEATURES !!

---

again,
> SHOULD COVER DATA RELATED TASKS ONLY !
> THE MOCK SERVER YOU ARE MAKING IS FOR USER-FACING DATA OPERATIONS, NOT FRONTEND / SERVING STATIC STUFF !
> DATA RELATED TASKS ONLY !

---

important :
use snake_case for any naming you do

---

your reply will be directly transferred as the final BRD document, so do not put anything else in your reply besides the BRD document
no extra comments or surrounding anything, only the markdown-formatted COMPREHENSIVE 100% COVERAGE AMAZING BEAUTIFUL GENIUS SUPER DETAILED 10/10 ARD DOCUMENT
your reply should start with : "\`\`\`markdown" and end with "\`\`\`"

you will be tipped $99999 + major company shares for nailing it perfectly off the bat`,
		},
		{
			role: "user",
			content: `\`\`\`app-project:description
${details.text}
\`\`\``,
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
			content: `\`\`\`DRD:database-requirements-document
${drd}
\`\`\``,
		},
		{
			role: "user",
			content: `\`\`\`DB:specs
${yaml.stringify(db)}
\`\`\``,
		},
		{
			role: "user",
			content: `\`\`\`BACKEND:specs-requirements
${yaml.stringify(backendStructureRequirements)}
\`\`\``,
		},
		{
			role: "user",
			content: `Conduct a comprehensive analysis for the Backend Requirements Document that considers all personas and features required, in markdown format (justify your reasoning whenever possible)

---

Refer to this general document structure to guide you

\`\`\`BRD:general-structure
I. General, Personas, Features
  [...]
II. REST API
  II.A. Justification & Reasoning
    If app needs REST API, provide your reasoning
  II.B. API Endpoints (if applies)
    3.B.1. [Endpoint]
      Method & Path
      Extended Description
        Analyze and describe what the function does
      Analysis
        Interaction with <> DB
          Analyze how does function interact with database based on provided DB details and schemas 
          ask yourself questions such as :
            What fields does it need to insert / get / update / delete / ... for each operation ?
            Based on provided DB details, does it need to create data on the fly such as ids / dates / ... ?
            Does it need to insert data in multiple tables to not make DB conflicts ?
					Be very specific & detailed into exactly how the relationships to <> DB tables work in this function
						justify any answer by including snippets from the provided DB postgres code and elaborating
						remember : the backend is tasked with creating any primitive required by db (ie. ids , ...),
						as you can tell from the postgres code
						make things 100% perfectly congruent in your analysis
					Include any additional important analysis notes
        Interaction with <> External APIs
          Analyze if function needs to interact with external APIs for needed capabilities, and if so describe
            Remember : App already has DB and storage , so external APIs would be external capabilities outside of these 2
        Add any important general analysis notes
      Data Details
        Auth
          Does function requires the user to provided an auth token ?
        Request
          Body content type (json , form , ... ?)
          Schema
        Response
          Content type
          Schema
			Additionals details / notes (if applies)
    [...]
II. Realtime Websockets (if applies)
  III.A. Justification & Reasoning
    If app needs realtime events, provide your reasoning
  III.B. Events (if applies)
    3.B.1. [Event]
      Event name
      Extended Description
        Analyze and describe what the function does
      Analysis
        Interaction with <> DB
          Analyze how does function interact with database based on provided DB details and schemas
          ask yourself questions such as :
            What fields does it need to insert / get / update / delete / ... for each operation ?
            Based on provided DB details, does it need to create data on the fly such as ids / dates / ... ?
            Does it need to insert data in multiple tables to not make DB conflicts ?
					Be very specific & detailed into exactly how the relationships to <> DB tables work in this function
						justify any answer by including snippets from the provided DB postgres code and elaborating
						remember : the backend is tasked with creating any primitive required by db (ie. ids , ...),
						as you can tell from the postgres code
						make things 100% perfectly congruent in your analysis
					Include any additional important analysis notes
        Interaction with <> External APIs
          Analyze if function needs to interact with external APIs for needed capabilities, and if so describe
            Remember : App already has DB and storage , so external APIs would be external capabilities outside of these 2
        Add any important general analysis notes
      Data Details
        Auth
          Does function requires the user to provided an auth token ?
        Request payload
          Schema
        Response payload
          Schema
      Additional details / notes (if applies)
    [...]
IV. Additional Notes
  Any additional notes worth mentionning regarding the backend requirements
\`\`\`

---
you're a genius`,
		},
	];

	const brd = (
		await context.run({
			id: "op:LLM::GEN",
			context: {
				...context, // {streams , project}
				operation: {
					key: "pm.brd",
					meta: {
						name: "BRD",
						desc: "backend requirements document",
					},
				},
			},
			data: {
				model: `chatgpt-4o-latest`, //`gpt-4o`,
				messages,
				preparser: `backticks`,
				parser: false,
			},
		})
	).generated;

	await context.run({
		id: "op:PROJECT::STATE:UPDATE",
		context,
		data: {
			operation: {
				id: "pm:brd",
			},
			type: `end`,
			content: {
				key: "pm.brd",
				data: brd,
			},
		},
	});

	const backendRequirements = backendStructureRequirements.backend.requirements;

	await context.run({
		id: "op:PROJECT::STATE:UPDATE",
		context,
		data: {
			operation: {
				id: "backend:requirements",
			},
			type: `end`,
			content: {
				key: "backend.requirements",
				data: backendRequirements,
			},
		},
	});

	return { pm: { brd }, backend: { requirements: backendRequirements } };
}

export default {
	"PM:BRD::ANALYSIS": pmBrdAnalysis,
};
