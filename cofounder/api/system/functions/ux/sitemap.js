import utils from "@/utils/index.js";
import yaml from "yaml";

async function uxSitemapStructure({ context, data }) {
	/* generate uxsitemap in strict format */

	const { pm } = data;
	const { prd, frd, uxsmd } = pm;
	const messages = [
		{
			role: "system",
			content: `You are an extremely experienced UX expert and software product manager.
Your role is to create a comprehensive UX sitemap from the provided information.

- Think very slowly and thoroughly. Take a deep breath.
- Provide a comprehensive, well-thought-out reply that covers all aspects of the analyzed problem.
- You are an expert at what you do.
- You are known to never forget a single angle.
- You will be tipped $999 for each perfect reply.

Answer in a strict parseable YAML format, in this format:

\`\`\`yaml
  
# ux sitemap structure in great details
uxsitemap:

  views:
    uniqueViews: # unique views with ids UV_* , as specified in provided docs
      [unique view id UV_*]:
        title: ""
        extendedDescription: "describe the view in great extended detail that covers every single thing that should go in it without any omittance" # essential to detail specifics ! dont assume someone knows what you mean, detail it in details !
        notes: "important notes regarding this view component or its state(s) that were mentionned in provided docs & analysis and that should be mentionned"
				role: "describe in detail role of this view in the app ; namely the features it aims to satisfy within the app features and UX"
    globalSharedViews: # global shared views with ids GV_* such as nav etc, as specified in provided docs
      [global shared view id GV_*]:
        title: ""
        extendedDescription: "describe the shared view in great extended detail that covers every single thing that should go in it without any omittance" # essential to detail specifics ! dont assume someone knows what you mean, detail it in details !
        notes: "important notes regarding view component or its state(s) that were mentionned in provided docs & analysis and that should be mentionned"
				role: "describe in detail role of this view in the app ; namely the features it aims to satisfy within the app features and UX"
        sharedByViews: [] # list of ids of all unique views UV_* that have this shared view displayed alongside with them
        relativePosition: "" # describe the relative positioning of this GV_* shared view in relation to the app layout and unique views it is shared with;
			[...]

  # cross inter-app links relationships between views
  crossLinks:
  - sourceViewId: "" # UV_* or GV_*
    targetViewId: "" # UV_*
    intent: ""
    actionDescription: ""
  [...]

\`\`\`

---

- every view id you refer to must exist in provided docs !

- As the expert, you should make a complete and comprehensive UX sitemap,
  including all parts that might be unemphasized by a less experienced UX worker, if required by the app of course, such as auth flows, terms, etc.

your reply should start with : "\`\`\`yaml" and end with "\`\`\`"
for yaml to be 100% valid, use quotes around string as much as possible

A comprehensive UX sitemap in the provided yaml format
You are a genius at this task.`,
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
			content: `\`\`\`UXSMD:ux-sitemap-analysis-document
${uxsmd}
\`\`\``,
		},
		{
			role: "user",
			content: `Make a full, comprehensive UX sitemap for it
You're a genius do a great job`,
		},
	];

	const uxsitemapStructure = (
		await context.run({
			id: "op:LLM::GEN",
			context: {
				...context, // {streams , project}
				operation: {
					key: "uxsitemap.structure",
					meta: {
						name: "UX Sitemap Structure",
						desc: "define sitemap <> views architecture",
					},
				},
			},
			data: {
				model: `chatgpt-4o-latest`, // `chatgpt-4o-latest`,//`gpt-4o`,
				messages,
				preparser: `backticks`,
				parser: `yaml`,
			},
		})
	).generated.uxsitemap;

	// <----- do post processing to format the response
	const uxsitemap = {
		structure: {
			views: {
				unique: uxsitemapStructure.views.uniqueViews,
				shared: uxsitemapStructure.views.globalSharedViews,
			},
			crosslinks: uxsitemapStructure.crossLinks.map((link) => {
				return {
					source: link.sourceViewId,
					target: link.targetViewId,
					intent: link.intent,
					action: link.actionDescription,
				};
			}),
		},
	};

	await context.run({
		id: "op:PROJECT::STATE:UPDATE",
		context,
		data: {
			operation: {
				id: "architecture:uxsitemap:structure",
			},
			type: `end`,
			content: {
				key: "uxsitemap.structure",
				data: uxsitemap.structure,
			},
		},
	});

	return {
		uxsitemap,
	};
}

// ____________________________________________________________________________________________________

async function uxSitemapViews({ context, data }) {
	/* ;; UX:SITEMAP::VIEWS
		{pm docs , db , openapi?, UXSMD, uxsitemap{structure} } -> uxsitemap{...,views}

		out : ["uxsitemap"]
	*/

	// distribute processing of views to submodules , might typically replace ie. in case of specialized and whatnot
	// but serves as a refiner , not as a detailer
	// so can just pass for now
	await Promise.all();

	// postprocess to return single coherent object

	return {};
}

// ____________________________________________________________________________________________________

async function uxSitemapViewsNormal({ context, data }) {
	/* ;; UX:SITEMAP::VIEWS:NORMAL
	chunk processing from UX:SITEMAP::VIEWS ; for normal views

		out : ["views"]
	*/

	const messages = [
		{
			role: "system",
			content: "[system+format]",
		},
	];
	await context.run({
		id: `op:LLM::GEN`,
		context,
		data: { messages, preparser: false, parser: false },
	});

	return {};
}
async function uxSitemapViewsSpecial({ context, data }) {
	/* ;; UX:SITEMAP::VIEWS:SPECIAL
		chunk processing from UX:SITEMAP::VIEWS; specialized processors for special sections ; ie. landing would be based on some highconversion process etc;
		might override provided sections descriptions

		out : ["views"]
	*/

	const messages = [
		{
			role: "system",
			content: "[system+format]",
		},
	];
	await context.run({
		id: `op:LLM::GEN`,
		context,
		data: { messages, preparser: false, parser: false },
	});

	return {};
}
async function uxSitemapViewsShared({ context, data }) {
	/* ;; UX:SITEMAP::VIEWS:SHARED
		chunk processing from UX:SITEMAP::VIEWS ; for shared views implementations


		out : ["views"]
	*/

	const messages = [
		{
			role: "system",
			content: "[system+format]",
		},
	];
	await context.run({
		id: `op:LLM::GEN`,
		context,
		data: { messages, preparser: false, parser: false },
	});

	return {};
}

export default {
	"UX:SITEMAP::STRUCTURE": uxSitemapStructure,
	"UX:SITEMAP::VIEWS": uxSitemapViews,

	"UX:SITEMAP::VIEWS:NORMAL": uxSitemapViewsNormal,
	"UX:SITEMAP::VIEWS:SPECIAL": uxSitemapViewsSpecial,
	"UX:SITEMAP::VIEWS:SHARED": uxSitemapViewsShared,
};
