import utils from "@/utils/index.js";
import yaml from "yaml";

async function pmFjmdAnalysis({ context, data }) {
	/* ;; PM:FJMD::ANALYSIS
		make {userdetails,prd,frd} -> FJMD analysis
	*/

	const { pm } = data;
	const { details, prd, frd } = pm;
	// const {text , attachments} = details
	const messages = [
		{
			role: "system",
			content: `you are an expert product manager and product designer
your job is to consult the provided web app details, analysis, PRD & FRD
in order to create a comprehensive and full Feature Journeys Maps Document (FJMD) for it

the emphasis are user-facing features,
based on the expected features and different journeys of different users in the web app

your generated FJMD is very detailed, comprehensive and covers absolutely 100% of everything required for the web app

you are not limited by provided example journeys
your analysis here should cover ALL journey cases (of the app MVP)

while conducting your FJMD, ask yourself:
- am i covering all 100% the purpose and functions required for the app ?
- am i covering all 100% the expected features from all the users' perspectives? even the small details ?
- am i covering all 100% the user journeys ?
- am i covering all details that other product managers might have omitted from my analysis ?
- am i making sure what i am detailing in my FJMD is absolutely 100% comprehensive and ready to be put into development without any alteration ?

conduct and reply with a generated comprehensive perfect FJMD document, yaml-formatted
the reply format should directly be a list of journeys items in valid yaml format, with this structure :


journeys:
	- 	name : "..."
		category : "..."
		journeyId: "/*like JOUR-01 format*/"
		description: "..."
		participants: "..."
		preconditions: "describe pre-existing conditions or assumptions..."
		postconditions: "describe state expected outcomes after completing the journey"
		steps : #list of journey steps, correlated with provided FRD (& PRD)
			-	intent : "..."
				userInteraction : "describe how users will interact with the interface"
				featuresIds : ["","",...] # list of featureIds involved in this step (featureIds should be exactly as they are mentionned in the FRD features-requirements-documents as 'featureId' ; important else it would break !)
				expectedResponse : "detail the expected response from the app"
			-	[...]
		edgeCases: "describe variations of the journey ; ie. what could go wrong, etc ..."
	- 	[...]

---

your FJMD document will be directly put into development

the emphasis are user-facing features;
functional features +interface features to cover 100% of expected features of the web app, 100% of all possible user journeys
no need to bother with non-user-facing features such as security compliance, nor similar non-user-facing technical details
no need to bother with cases too advanced for the web app MVP features (ie. advanced analytics or multilingual or live support; ... unless specified in provided task ! )

> Stay User-Centric: keep the user's perspective front and center throughout the document
emphasize user-facing features and core app MVP features

you are not limited by provided example journeys in other docs
your analysis here should be comprehensive and cover ALL journey cases
think of many different core journeys from different perspectives in different scenarios
be comprehensive and cover it all

your reply will be directly transferred as the final FJMD document
so make sure the content and YAML formatting are both exquisitely perfect as the genius you are
if an app name is not provided, make a fitting one for your analysis and JMD

emphasize user-facing features and core app MVP features

so do not put anything else in your reply besides the Feature Journeys Maps Document as parseable, valid well-formatted YAML format
no extra comments or surrounding anything, only the YAML-formatted PARSEABLE VALID COMPREHENSIVE 100% COVERAGE AMAZING BEAUTIFUL FEATURES JOURNEY MAPS DOCUMENT
your reply should start with : "\`\`\`yaml" and end with "\`\`\`"

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
			content: `\`\`\`FRD:features-requirements-document
${frd}
\`\`\``,
		},
		{
			role: "user",
			content: `implement the Features Journey Maps Documents (FRJD) for all the core journeys for different scenarios
it is expected to be very comprehensive and detailed ; in a VALID PARSEABLE YAML format

you're a genius`,
		},
	];

	/*
	const fjmd = (
		await context.run({
			id: "op:LLM::GEN",
			context,
			data: {
				model: `chatgpt-4o-latest`, //`gpt-4o`,
				messages,
				preparser: `backticks`,
				parser: `yaml`,
			},
		})
	).generated;
	*/

	console.error(`skipping features journey map doc`);
	const fjmd = ``;
	await context.run({
		id: "op:PROJECT::STATE:UPDATE",
		context,
		data: {
			operation: {
				id: "pm:fjmd",
			},
			type: `end`,
			content: {
				key: "pm.fjmd",
				data: fjmd,
			},
		},
	});

	return { pm: { fjmd } };
}

export default {
	"PM:FJMD::ANALYSIS": pmFjmdAnalysis,
};
