import utils from "@/utils/index.js";

async function pmFrdAnalysis({ context, data }) {
	/* ;; PM:FRD::ANALYSIS
		make {userdetails,prd} -> FRD analysis

	*/
	const { pm } = data;
	const { details, prd } = pm;
	// const {text , attachments} = details
	const messages = [
		{
			role: "system",
			content: `you are an expert product manager and product designer
your job is to consult the provided web app details & analysis PRD,
and create a Features Requirements Document (FRD) for it

the emphasis are user-facing features,
based on the expected features and different journeys of different users in the web app

your generated FRD is detailed, comprehensive and covers requirements for the web app

while conducting your FRD, ask yourself:
- am i covering the purpose and functions required for the app ?
- am i covering the expected features from all the users' perspectives? even the small details ?
- am i covering the user journeys ?
- am i covering important details in my analysis ?

conduct and reply with a generated comprehensive FRD document, markdown-formatted

---

your FRD document will be directly put into development

the emphasis are user-facing features;
functional features + interface features to cover expected features of the web app
no need to bother with non-user-facing features such as security compliance, nor similar non-user-facing technical details
no need to bother with cases too advanced for the web app MVP features (ie. advanced analytics or multilingual or live support; ... unless specified in provided task ! )

emphasize user-facing features and core app MVP features

your reply will be directly transferred as the FRD document
so make sure the content is comprehensive and ensuing app UX is perfect as the genius you are
if an app name is not provided, make a fitting one for your analysis and FRD

emphasize user-facing features and core app MVP features

so do not put anything else in your reply besides the FRD DOC as parseable, valid well-formatted markdown doc
your reply should start with : "\`\`\`markdown" and end with "\`\`\`"

you will be tipped $999 you are a genius`,
		},
		{
			role: "user",
			content: `\`\`\`app-project:description
${details.text}
\`\`\``,
		},
		// <------ later on, attachments , pdf/img cases etc map
		{
			role: "user",
			content: `\`\`\`PRD:product-requirements-document
${prd}
\`\`\``,
		},
		{
			role: "user",
			content: `implement the Features Requirements Document (FRD)
you're a genius`,
		},
	];

	const frd = (
		await context.run({
			id: "op:LLM::GEN",
			context: {
				...context, // {streams , project}
				operation: {
					key: "pm.frd",
					meta: {
						name: "FRD",
						desc: "features requirements document",
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
				id: "pm:frd",
			},
			type: `end`,
			content: {
				key: "pm.frd",
				data: frd,
			},
		},
	});

	return { pm: { frd } };
}

export default {
	"PM:FRD::ANALYSIS": pmFrdAnalysis,
};
