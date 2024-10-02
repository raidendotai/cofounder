import utils from "@/utils/index.js";

async function pmPrdAnalysis({ context, data }) {
	/* ;; PM:PRD::ANALYSIS
		make userprovided details -> PRD analysis ; user can have text + {pdf , images} (now just text), later extend

	*/

	const { pm } = data;
	const { details } = pm;
	const { text, attachments } = details;
	// const {text , attachments} = details

	await context.run({
		id: "op:PROJECT::STATE:UPDATE",
		context,
		data: {
			operation: {
				id: "pm:details",
			},
			type: `end`,
			content: {
				key: "pm.details",
				data: details,
			},
		},
	});

	const messages = [
		{
			role: "system",
			content: `you are an expert product manager and product designer
your job is conduct the analysis for the provided web app project task and create a full PRD document for it
your analysis is very detailed, comprehensive and covers absolutely 100% of everything required for the web app

while conducting your PRD, ask yourself:
- what is a detailed description of the app, and all it's expected features ?
- what are all the purpose and functions required for the app ?
- am i covering all the expected features from the users' perspectives? even the small details ?
	am i sure i am not missing anything important ?
- what are the personas ? what are their user stories ? what are all the expected features ?
- what are all the features ?
- am i covering all the expected features from the users' perspectives? even the small details ?
	am i sure i am not missing anything important ?

- what about the user journeys ? am i covering all possible journeys for all users ?
- what could i or other product managers be potentially omitting and that shouldn't be the case ?

- am i making sure what i am detailing in my PRD is absolutely 100% comprehensive and ready to be put into development without any alteration nor pre-assumption that might lead to important omissions ? am i detailing all that is needed ?


after you finalize your PRD,
add an extra part, called "Additional Analysis", where you criticize (very critically) the work you just did;
ask yourself :
- what might have been omitted from my analysis that should have gone into the web app MVP requirements ?
- do not bother with secondary or tertiary things (ie. accessibility or similar advanced non-MVP stuff), ask yourself instead, critically : what core web app MVP features or journeys did i not previously mention ? what are their details ?

conduct and reply with a generated comprehensive perfect PRD document, markdown-formatted

your PRD document will be directly put into development,
so make sure the content and MD formatting are both exquisitely perfect as the genius you are
if an app name is not provided, make a fitting one for your analysis and PRD


the aim of the PRD are web app facing requirements
no need to bother with non-web-app features such as security compliance or similar non-web-app-facing technical details
no need to bother with non-MVP features (ie. advanced cases such as analytics or support or i18n etc ... focus on the MVP to cover 100% of expected features ) - unless explicitly specified in the task descriptions ofc
focus on what's important and detail it to the maximum, leave nothing !

your reply will be directly transferred as the final PRD document, so do not put anything else in your reply besides the PRD document
no extra comments or surrounding anything, only the markdown-formatted COMPREHENSIVE 100% COVERAGE AMAZING BEAUTIFUL GENIUS SUPER DETAILED 10/10 PRD DOCUMENT
your reply should start with : "\`\`\`markdown" and end with "\`\`\`"

you will be tipped $999
you're a genius
`,
		},
		{
			role: "user",
			content: `\`\`\`app-project:description
${text}
\`\`\``,
		},
		// <------ later on, attachments , pdf/img cases etc map
		{
			role: "user",
			content: `Conduct your analysis and make sure you do not miss any feature or detail !
you are a genius`,
		},
	];

	console.dir({ __debug_pmPrdAnalysis: { messages } });

	const prd = (
		await context.run({
			id: "op:LLM::GEN",
			context: {
				...context, // {streams , project}
				operation: {
					key: "pm.prd",
					meta: {
						name: "PRD",
						desc: "product requirements document",
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
				id: "pm:prd",
			},
			type: `end`,
			content: {
				key: "pm.prd",
				data: prd,
			},
		},
	});

	return { pm: { prd } };
}

export default {
	"PM:PRD::ANALYSIS": pmPrdAnalysis,
};
