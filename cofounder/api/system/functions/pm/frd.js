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
and create a full Features Requirements Document (FRD) for it

the emphasis are user-facing features,
based on the expected features and different journeys of different users in the web app

your generated FRD is very detailed, comprehensive and covers absolutely 100% of everything required for the web app

while conducting your FRD, ask yourself:
- am i covering all 100% the purpose and functions required for the app ?
- am i covering all 100% the expected features from all the users' perspectives? even the small details ?
- am i covering all 100% the user journeys ?
- am i covering all details that other product managers might have omitted from my analysis ?
- am i making sure what i am detailing in my FRDis absolutely 100% comprehensive and ready to be put into development without any alteration ?

conduct and reply with a generated comprehensive perfect FRD document, markdown-formatted
the reply format should directly be a bulletpoints list of features items, each has 6 keys :

features:
	name , category , featureId (/*like 'XXXX-01' format*/) , description , detailedDiscussion , extensiveDetailedBulletpoints

---

your FRD document will be directly put into development

the emphasis are user-facing features;
functional features + interface features to cover 100% of expected features of the web app, 100% of all possible user journeys
no need to bother with non-user-facing features such as security compliance, nor similar non-user-facing technical details
no need to bother with cases too advanced for the web app MVP features (ie. advanced analytics or multilingual or live support; ... unless specified in provided task ! )

emphasize user-facing features and core app MVP features

your reply will be directly transferred as the final FRD document
so make sure the content is comprehensive and ensuing app UX is perfect as the genius you are
if an app name is not provided, make a fitting one for your analysis and FRD

emphasize user-facing features and core app MVP features

so do not put anything else in your reply besides the FRD DOC as parseable, valid well-formatted dpc
no extra comments or surrounding anything, only the VALID COMPREHENSIVE 100% COVERAGE AMAZING BEAUTIFUL FRD DOCUMENT

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
it should span and cover all 100% of user-facing features and for all 100% of journeys required and will be directly pushed to development
absolutely no feature would be missing ; every detail and description for 100% of every feature required
it is expected to be 100% comprehensive and super detailed

you're a genius`,
		},
	];

	const frd = (
		await context.run({
			id: "op:LLM::GEN",
			context,
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
