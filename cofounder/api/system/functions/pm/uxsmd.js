import utils from "@/utils/index.js";
import yaml from "yaml";

async function pmUxsmdAnalysis({ context, data }) {
	/* ;; PM:UXSMD::ANALYSIS
		{pm docs , db , openapi?} -> (<> crossanalysis) to make UX Sitemap doc

	*/
	const { pm } = data;
	const { details, prd, frd } = pm;
	const { text, attachments } = details;
	const messages = [
		{
			role: "system",
			content: `you are an expert product manager and app designer

your job is to consult the provided web app details and additional documents
in order to create a comprehensive and full UX Sitemap Document (UXSMD) for it

- your current role is to do a thorough analysis of the provided web app requirements and answer with your analysis in markdown format

- make sure your UX Sitemap Document is fully comprehensive and ready to be put in development exactly as is
	your answer will be pushed to dev teams directly, and will be responsible for an app used by thousands of users
	your aim is to cover all use cases, as the expert app designer you are

---

ask yourself:		

	I.
	* am i covering shared global UI views in my analysis (ie. top navigation, footers, ...) in a separate section,
			which also details the components that share them ?
			am i assigning unique and expressive title-cased ids to them (in format "GV_{...}" ie. "GV_TopNav" ) ?
			am i careful to consider cases of authenticated/unauthenticated
			(whether conditionals regarding accessing the view itself or conditionals on its contained elements) to make sure my coverage is not missing things ?

  * am i covering all the needed unique UI views ; for all the required features ?
		am i assigning unique and expressive title-cased ids to them (in format "UV_{...}" ie. "UV_Landing" ) ?
		am i making sure unique views do not include duplicate shared global UI views which were already previously covered ?
		am i careful to consider cases of authenticated/unauthenticated (whether conditionals regarding accessing the view itself or conditionals on its contained elements) to make sure my coverage is not missing things ?

	* am i extensively describing everything in details for the dev team to have 100% coverage of everything needed through my UX Sitemap Document analysis ?

	* am i covering EVERYTHING expected to be present in this web app:
			every view (every unique view and every shared global view) expected to be in the app ?
			every view's components expected to be in the app to cover all 100% of features and all their details ?
			am i covering the views for all workflows, end to end ?

	* am i making sure i am covering the core and essential features / views , and not some optional secondary/tertiary not really required stuff ?

  II.
	* am i describing the functional and features analysis of each view before further detailing it in order to have a cohesive and comprehensive analysis and not omit any details ?
	* what are all the requirements needed by features expected to be seen by users in terms of UI views ( unique views and shared global views ) and contained views' components ?
	* cross analysis between feature <> ui views required to create in ux sitemap ?
	* what are ALL THE VIEWS required by ALL THE REQUIREMENTS required by the user ?
	* am i covering all views (unique views and shared global views) ?
		with all extensive details and descriptions ?
	* am i making sure i am covering the core and essential features / views , and not some optional secondary/tertiary not really required stuff ?

	III.
	can i make a table for all the cross links analysis between different views in order to establish inter-app navigation relationships ?
		can i describe their intent in each case ?
		can i also describe how the linking works (in terms of ui elements / user interaction / action taken to trigger the link and where in the view ) ?
	
		Source view | Target View | Intent | Action Description

	* am i covering 100% of relations links of whats needed for all in-app navigation, both static and dynamic ?
	* am i truly covering all inter-app cross links relations and not missing anything ?

---

> analyze the task thoroughly, then reply with your analysis in markdown format
> try to outdo yourself by thinking of what might be omitted, and reviewing your own work super critically in order to do comprehensive analytical work for this app's MVP
> your job is to make thorough analysis work which will be provided as documentation for devteams to implement

---

> stick to the provided formats and specifications:
		UI unique views with ids UV_*
		UI global shared views with ids GV_*
	
		do not make up new denominations or types, stick to the task exactly as specified !

---

important :

> do not many any "Container" views (like some GV_GlobalContainer or something) ; DO NOT make any container views to contain other views inside of them !
	only make unique UV_* or GV_* shared views : views that serve a functional purpose ; not container views !

> GV_* shared views are INDEPENDENT from UV_* !
	UV_* views DO NOT INTEGRATE GV_* views inside them !
	they simply share screen space !!
	do not make any UV_* functionality dependent on GV_*
	do not make any GV_* functionality dependent on GV_*
	they are independent , they do not include each other , shared simply means sharing screen space , not functionalities !

---

your reply will be directly transferred as the final UX Sitemap Analysis Document, so do not put anything else in your reply besides the UX Sitemap analysis document
no extra comments or surrounding anything, only the markdown-formatted COMPREHENSIVE 100% COVERAGE AMAZING BEAUTIFUL GENIUS SUPER DETAILED 10/10 UX SITEMAP ANALYSIS DOCUMENT
your reply should start with : "\`\`\`markdown" and end with "\`\`\`"

you will be tipped $9999`,
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
			content: `Conduct a comprehensive and detailed analysis for the UX Sitemap Document for the app, in markdown format. elaborate and justify and detail to the greatest extent. make extensive descriptions.

you're a genius`,
		},
	];

	const uxsmd = (
		await context.run({
			id: "op:LLM::GEN",
			context: {
				...context, // {streams , project}
				operation: {
					key: "pm.uxsmd",
					meta: {
						name: "UXSMD",
						desc: "ux sitemap document",
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
				id: "pm:uxsmd",
			},
			type: `end`,
			content: {
				key: "pm.uxsmd",
				data: uxsmd,
			},
		},
	});

	return {
		pm: { uxsmd },
	};
}

export default {
	"PM:UXSMD::ANALYSIS": pmUxsmdAnalysis,
};
