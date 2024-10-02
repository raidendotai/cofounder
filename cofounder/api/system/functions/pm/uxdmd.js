import utils from "@/utils/index.js";
import yaml from "yaml";

async function pmUxdmdAnalysis({ context, data }) {
	/* ;; PM:UXDMD::ANALYSIS
		{pm docs , db , openapi? , uxsitemap {analysis,struct,...}?} -> (<> crossanalysis) to make UX Datamap Doc

	*/

	const { pm, db, backend } = data;
	const { details, prd, frd, drd, uxsmd, brd } = pm;

	const messages = [
		{
			role: "system",
			content: `- you are a genius Product Manager & Software Archtect

- your role is to conduct the analysis required to design the frontend app architecture for the provided project in its details

- think from perspectives of multiple personas, put yourself in situation, to make sure your app architecture analysis is fully comprehensive and ready to be developed
- ask yourself:
  * what are the journeys involved in the app frontend ?
  * what are all the routes , views , slugs , props , URL parameters , auth restrictions, required by features expected to be seen by users in the frontend ?
  * what should go in their schemas ? (not technical, rather analytical description from a feature perspective)
- your analysis will be used to make a prod-ready app and will be responsible for an app used by thousands of users
- your aim is to cover all use cases, as the expert product manager & architect you are

> analyze the task thoroughly, then reply with your analysis in markdown format, in a well-formatted document to give to app designers & devs

> your role here is not the implementation itself, you are the product architect consultant
> your role is to analyze the requirements for all scenarios required by all features
  ask yourself :
    * am i covering all needed app features?
    * am i covering all features that the user expects ?
  in order to ensure your analysis as a product architect consultant has covered every feature requirement
> your job is to make thorough, critical analysis work which will be provided as documentation for designers & devteams to implement
  not a technical implementation, rather a thorough analysis, of all expected architecture features and their details

---

your aim is to determine, in extreme detail:

  I. the structure of the app:
  	*	routes
		*	what views they link to
		*	slugs (ie. path /something/:example) if applies
		*	if route is restricted or not
  	* URL params (ie. /somepath?param_a=example&param_b=example ) if applies

		>	important : only refer to views ids specified in provided ux sitemap ! (UV_* and GV_* views)

	II. the relationships between views of the app (based on the provided UX sitemap ; (unique views UV_* and shared ui views GV_*) ) & app data (based on provided DB & backend docs & schemas ):

	conduct a cross analysis between UX sitemap views <> app data states in order to :

		1.  determine stateful variables , actions/dynamic functions , params :
				1A.     if the view has state for dynamic data, describe
				1B.     if the view should access slug passed into url (ie. /something/:example ), describe
				1C.     if the view should access URL params and use them for a feature (ie. /somepath?param_a=X&param_b=Y), describe
				1D.     if the view has actions/dynamic functions like API calls or realtime events, describe in detail
				1E.			revise and provide your reasoning to make sure you covered all the state/data details required to make all required features work properly

			>	important : only refer to view ids specified in provided ux sitemap ! (UV_* and GV_* views) , dont hallucinate UI views/components !

		2. global app state structure, that is accessed by all views :
				*	how the app state should be structured to cover the app features, in terms of :
						variables & schemas
						actions
					make sure you only analyze the global app state (which ie. typically holds stuff like auth / notifications /  ... )
					and not view-specific props and state (as the latter were already detailed in the previous section and should not be mentionned here)

				make sure you determine the schemas for the global app state variables
				provide examples values for them (based on provided app schemas & DB seed examples), in each case

---

> try to outdo yourself by thinking of what might be omitted, and reviewing your own work super critically in order to do comprehensive analytical work for this app's MVP
- the goal app should be comprehensive, will be used as the reference to build the app
- cover all cases in terms of app architecture ; with high emphasis on details regarding data and states

---

important :
> use snake_case for any naming you do

extremely important :
> ensure full perfect coherence with DB fields names and provided specs names ;

---

your reply will be directly transferred as the final analysis, so do not put anything else in your reply besides the analysis document
no extra comments or surrounding anything, only the markdown-formatted COMPREHENSIVE 100% COVERAGE AMAZING BEAUTIFUL GENIUS SUPER DETAILED 10/10 ANALYSIS DOCUMENT
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
\`\`\`

---

\`\`\`DB:schemas
${yaml.stringify(db)}
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

---

note :
> any reference to the backend server should be the local dev URL referred to in docs ; typically : \`http://localhost:1337\`
> if case app needs a global state, global app state should be in the context of one single app redux store \`store.tsx\` that wraps the entire app and includes all that is needed for all global state stuff:
	ie. auth for api and/or auth for websockets
	ie. if backend has realtime events, realtime events subscriptions
	etc ... in one single global state store

`),
		},
		{
			role: "user",
			content: `\`\`\`UXSMD:ux-sitemap-document
${uxsmd}
\`\`\``,
		},
		{
			role: "user",
			content: `Conduct the analysis for the frontend app architecture and its details in a frotnend app architecture analysis document style - starting with a table of contents, elaborating on everything the task specifies, in extreme detail specifying all that needs specification

extremely important :
> you are absolutely forbidden from instructing in the document about having to create new components or how to structure the project
> you should 100% stick strictly to the provided task !

you're a genius`,
		},
	];

	const uxdmd = (
		await context.run({
			id: "op:LLM::GEN",
			context: {
				...context, // {streams , project}
				operation: {
					key: "pm.uxdmd",
					meta: {
						name: "UXDMD",
						desc: "ux datamap document",
					},
				},
			},
			data: {
				model: `chatgpt-4o-latest`, // `chatgpt-4o-latest`,//`gpt-4o`,
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
				id: "pm:uxdmd",
			},
			type: `end`,
			content: {
				key: "pm.uxdmd",
				data: uxdmd,
			},
		},
	});

	return {
		pm: { uxdmd },
	};
}

export default {
	"PM:UXDMD::ANALYSIS": pmUxdmdAnalysis,
};
