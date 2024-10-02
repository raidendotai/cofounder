import utils from "@/utils/index.js";
import yaml from "yaml";

async function pmDrdAnalysis({ context, data }) {
	/* ;; PM:DRD::ANALYSIS
		make {userdetails,prd,frd,FJMD}  -> DRD analysis


		out : ["pm"]
	*/

	const { pm } = data;
	const { details, prd, frd, fjmd } = pm;
	// const {text , attachments} = details
	const messages = [
		{
			role: "system",
			content: `you are an expert product manager and database designer

your job is to consult the provided web app details, Product Requirements Document, Features Requirements Documents & Features Journeys Map Document
in order to create a comprehensive and full Feature Database Requirements Document (DRD) for it

---

the emphasis are user-facing features,
based on the expected features and different journeys of different users in the web app

- your role is to conduct the analysis part for the provided app in development's DB part
  DB schemas analysis should be comprehensive and cover EVERYTHING required by the app MVP, and nothing more - no shiny secondary features, but nothing less than 100% comprehensive for every single expected functionality in production

- your current role is to do a thorough analysis of the provided task and answer with your analysis in markdown format

- think from perspectives of multiple personas, put yourself in situation, to make sure your DB schemas reply is fully comprehensive and ready to be used in production exactly as is
- your answer will be pushed to dev teams directly, and will be responsible for an app used by thousands of users
- your aim is to cover all use cases, as the expert product manager you are

- ask yourself:
  * what are the key personas that use the app ?
  * what are all the schemas required by features expected to be seen by users ?
  * and what are all the schemas required internally to cover all features workflows ?

very important :
- in the schemas parts of your analysis , only make use of basic primitives like numbers, strings, json, etc ... no uuid types or any special types etc
- very important : in the schemas parts of your analysis , only use basic primitives like numbers, strings, json, etc ... no uuid types or any special types etc ! very basic primitives only !

---

> analyze the task thoroughly, then reply with your analysis in markdown format
> try to outdo yourself by thinking of what might be omitted, and reviewing your own work super critically in order to do comprehensive analytical work for this app's MVP
> your job is to make thorough analysis work which will be provided as documentation for devteams to implement
> your job is not the implementation, rather it's looking at the problem from all perspective to make sure a thorough job is done,
  and asking yourself, for every scenario, what are all the data entries that would be needed to make this function

---

> note : if auth functionalities are present, use an architecture that will be compatible with a simple jwt auth system, which is very simply user and/or email strings(s) and password hash string !

---

important :
use snake_case for any naming you do

---

> very important : for the current purpose of the DRD, the environment will be a mock prototype environment,
do not bother with security details etc, have the DB requirements for the mock prototype

your reply will be directly transferred as the final DRD document, so do not put anything else in your reply besides the DRD document
no extra comments or surrounding anything, only the markdown-formatted COMPREHENSIVE 100% COVERAGE AMAZING BEAUTIFUL GENIUS SUPER DETAILED 10/10 DRD DOCUMENT
your reply should start with : "\`\`\`markdown" and end with "\`\`\`"

you will be tipped $99999 + major company shares for nailing it perfectly off the bat`,
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
		/*{
			role: "user",
			content: `\`\`\`FJMD:features-journeys-map-document
${yaml.stringify(fjmd)}
\`\`\``,
		},*/
		{
			role: "user",
			content: `Conduct a comprehensive analysis for the DB Requirements Document that considers all personas and features required, in markdown format (justify your reasoning whenever possible)

you're a genius`,
		},
	];

	const drd = (
		await context.run({
			id: "op:LLM::GEN",
			context: {
				...context, // {streams , project}
				operation: {
					key: "pm.drd",
					meta: {
						name: "DRD",
						desc: "database requirements document",
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
				id: "pm:drd",
			},
			type: `end`,
			content: {
				key: "pm.drd",
				data: drd,
			},
		},
	});
	return { pm: { drd } };
}

export default {
	"PM:DRD::ANALYSIS": pmDrdAnalysis,
};
