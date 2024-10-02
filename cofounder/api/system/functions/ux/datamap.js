import utils from "@/utils/index.js";
import yaml from "yaml";
import { merge, fromPairs } from "lodash-es";

function _chunkify(input_list, chunk_size) {
	const chunks = [];
	for (let i = 0; i < input_list.length; i += chunk_size) {
		chunks.push(input_list.slice(i, i + chunk_size));
	}
	return chunks;
}

async function uxDatamapStructure({ context, data }) {
	/* ;; UX:DATAMAP::ROOT:VIEWS
		{...} -> app {routes, slugs, params , views } ; yaml
		;; preconsider layout stuff too, either here or in sitemap

		out : ["uxdatamap"]
	*/

	const { pm, backend } = data;
	const { prd, frd, brd, uxsmd, uxdmd } = pm;
	const messages = [
		{
			role: "system",
			content: `- you are a genius Product Manager & Software Archtect

- your role is to make the frontend app architecture for the provided project , based on the provided task and analysis documents
- your answer should be in the strict provided format that will be defined further

your aim is to determine the:
  * the structure of the app:
  *   global app state structure that is accessed by all views : how the app state should be structured to cover the app features
  *   routes, what views they link to
	*		route restrictions
	* 	slugs if applies (ie. path /something/:example), describe
  *   URL params if applies (ie. /somepath?param_a=example&param_b=example ), describe


- think from perspectives of multiple personas, put yourself in situation, to make sure your app architecture is fully comprehensive and ready to be developed
- ask yourself:
  * what are the journeys involved in the app frontend ?
  * what are all the routes , views , slugs , props , URL parameters , required by features expected to be seen by users in the frontend ?
  * what should go in schemas ?
	* am i covering all needed slugs ?
		am i covering all URL parameters ?

- your structure will be used to make a prod-ready app architecture and will be responsible for an app used by thousands of users
- your aim is to cover all use cases, as the expert product manager & architect you are

> your answer should strictly be in this format :

\`\`\`yaml
app:
  root:
    globalState: # global app state variables if applies ; name conventions should try match with dbschemas/openapi schemas for coherence
      [name]: # global app state variable name
        schema: # variable schema in JS-parseable interace format ; schema should be fully defined including nested fields (you are provided with all the documents and db schemas and openapi etc ... that you need to determine this)
        default: # default value to assign to the variable ; should obviously be aligned with the defined schema
				example: # example value to assign
      ...

  routes: # list of app routes to cover all features and cases
    - description: "..." # concise one sentence description of the route's role
      path: "..." # path, including if any slugs (using the /:slug format )
      view: "" # view id to render on this route ; should match a provided id for a unique view from the ux sitemap (UV_*), based on the provided analysis

			# specify slugs / URL params if applies here
			# note : remember there is a strong difference - slugs are (/examplepath/:slug_id) and urlParams are (/somepath?q=example&someparam=somevalue) do not confuse them !

      slugs?: # if slugs in path, describe
        - name: "..." # slug id as specified in path
          intent: "..." # consise one sentence description of its role
        ...
      urlParams?: # does the view expect url params, if so describe each single URLparam individually in detail
        - name: "..." # if the view will expect URL params, specify the URL param name
          intent: "..." # consise description
          example: "exampleValue" # an example of a value it would take - you are required to provide an example here
          required?: boolean # if specifying the urlParam is required or optional for the view to function properly
        ...
\`\`\`

---

it should be comprehensive for the needs required by all the views

> important : if some home or landing view, path should obviously be "/" !

your reply will be directly transferred as the final structure, so do not put anything else in your reply besides the final structure
your reply should start with : "\`\`\`yaml" and end with "\`\`\`"

you will be tipped $99999 + major company shares for nailing it perfectly off the bat`,
		},
		{
			role: "user",
			content: `\`\`\`PRD:app-product-requirements-document
${prd}
\`\`\``,
		},
		{
			role: "user",
			content: `\`\`\`FRD:app-features-requirements-document
${yaml.stringify(frd)}
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
			content: `\`\`\`UXDMD:ux-sitemap-data-states-crossanalysis-document
${uxdmd}
\`\`\``,
		},
	];
	const uxdatamapStructure = (
		await context.run({
			id: "op:LLM::GEN",
			context: {
				...context, // {streams , project}
				operation: {
					key: "uxdatamap.structure",
					meta: {
						name: "UX Datamap Structure",
						desc: "define the app's data architecture",
					},
				},
			},
			data: {
				model: `chatgpt-4o-latest`, //`chatgpt-4o-latest`, // `chatgpt-4o-latest`,//`gpt-4o`,
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
				id: "architecture:uxdatamap:structure",
			},
			type: `end`,
			content: {
				key: `uxdatamap.structure`,
				data: uxdatamapStructure.app,
			},
		},
	});

	return {
		uxdatamap: {
			structure: uxdatamapStructure.app, // -> {root{},routes{}}
		},
	};
}

async function uxDatamapViews({ context, data }) {
	/* ;; UX:DATAMAP::VIEWS:SECTIONS
		{ ... } -> sections details with props & schemas ; yaml
		;; preconsider layout stuff too, either here or in sitemap

		out : ["uxdatamap"]
	*/

	/*
		- not sure if needs uxsitemap structure etc or just the uxdatamap structure (and other analysis docs)
		- should also consider shared views and their distribution etc, unless that is done in uxsitemap
			that and cross links ... unless that too in uxsitemap
		- focus here is data not other stuff
	*/

	const { uxdatamap, uxsitemap } = data;
	/*
		uxdatamap: { structure : { root{} , routes{} } }
		uxsitemap: { structure : { views{ unique{}, shared{} } , crosslinks[{source,target,intent,action}] } }

		-> needs parallel chunking because high detail on each
		-> parallel chunk uxsitemap views to detail data ops on them and their sections
		-> all shared global views GV_* in same chunk (because diff approach?) , unique views uv_* in multi chunks because numerous
	*/

	let tasks = [];

	const UVs = Object.keys(uxsitemap?.structure?.views?.unique) || {};
	if (UVs.length) {
		_chunkify(UVs, 5).map((uniqueViewsIdsChunk) => {
			let filteredUxSitemap = { views: { unique: {} } };
			uniqueViewsIdsChunk.map((uv) => {
				filteredUxSitemap.views.unique[uv] = uxsitemap.structure.views.unique[uv];
			});
			tasks.push({
				uxsitemap: filteredUxSitemap, // filtered ux sitemap with all chunk of unique views
				crosslinks: uxsitemap.structure.crosslinks.filter((crosslink) => {
					return uniqueViewsIdsChunk.includes(crosslink.source);
				}),
				ids: uniqueViewsIdsChunk,
				type: `unique`,
			});
		});
	}

	const GVs = Object.keys(uxsitemap?.structure?.views?.shared) || {};
	if (GVs.length) {
		tasks.push({
			uxsitemap: { views: { shared: uxsitemap.structure.views.shared } }, // filtered ux sitemap with all shared views
			crosslinks: uxsitemap.structure.crosslinks.filter((crosslink) => {
				return GVs.includes(crosslink.source);
			}),
			ids: GVs,
			type: `shared`,
		});
	}

	let views = {};
	await Promise.all(
		tasks.map(async (task) => {
			const response = await context.run({
				id: `UX:DATAMAP::VIEWS:CHUNK`,
				context,
				data: { ...data, task },
			});
			views = merge(views, response.views);
		}),
	);

	// console.dir({ __debug_uxDatamapViews: {views} } , {depth:null})
	await context.run({
		id: "op:PROJECT::STATE:UPDATE",
		context,
		data: {
			operation: {
				id: "architecture:uxdatamap:views",
			},
			type: `end`,
			content: {
				key: `uxdatamap.views`,
				data: views,
			},
		},
	});

	return {
		uxdatamap: {
			...uxdatamap,
			views,
		},
	};
}

async function uxDatamapViewsChunk({ context, data }) {
	/* ;; UX:DATAMAP::VIEWS:CHUNK
		chunk processor for views+sections detailing

		out : ["views"] # make sure later, maybe there's more to it ?
	*/

	/*
		- not sure if needs uxsitemap structure etc or just the uxdatamap structure (and other analysis docs)
		- should also consider shared views and their distribution etc, unless that is done in uxsitemap
			that and cross links ... unless that too in uxsitemap

		- focus here is data not other stuff ! can link through filtering with uxsitemap later
	*/

	const { pm, uxdatamap, backend, task } = data;
	const { prd, frd, brd, uxsmd, uxdmd } = pm;
	/*
		--> task : {
						uxsitemap{
							views{
								unique{ __chunk of views__ },
								shared{ __chunk of views__ },
							},
						}
						crosslinks[],
						ids[ ids of views__ ],
						type: unique || shared
				}
	// returns {views{ unique{[id]:...} , shared{[id]:...} }}
	*/

	const messages = [
		{
			role: "system",
			content: `- you are a genius Product Manager & App Architect

- your role is to detail the frontend app architecture structure for the provided project,
for the specific views with ids : ${task.ids.join(",")},
based on the provided task and analysis documents
- your answer should be in the strict provided format that will be defined further


your aim is to determine the:
  * the structure of the specified frontend views (views ${task.ids.join(",")} ) ,
		for each view :
  *   state variables , schemas , dynamic data
	*		what it receives from the route (slugs)
	*		what it receives in URL params
  *   action / functions in this view and how they come into play to cover all intended features of the view
- for each view , ask yourself:
  * what are the features involved in this view ; and how they come into play in app's features / journeys ?
  * what data does this view receive as route slugs and url params ?
  * what are all the state variables / actions / functions / ... required by features expected to be seen by users in the frontend ?

- your detailed view structure for each view will be used to make a prod-ready app architecture and will be responsible for an app used by thousands of users
- your aim is to cover all use cases, as the expert product manager & architect you are

> your answer is required to be in this strict defined format, in this strict order, in a strictly parseable YAML :

\`\`\`yaml
# use view ids directly under the views object ; will either be UV_* (unique views) or GV_* (shared global views) ;
# for all provided views ids in task, conduct the structure detailing
views:
  [view id]: # the view id that is detailed ; should be a value from  : ${task.ids.join(" , ")}
    slugs?: # if view takes dynamic slug variable (defined in route in app structure), describe
      - name: "..." # slug id as defined in route
        intent: "..." # consise one sentence description of the slug role
        required: boolean # if required, set to true
        default: "..." # default init value for the slug
      ...
    urlParams?: # if view takes URL params (defined in app structure), describe
      - name: "..." # URL param key as defined in app structure
        intent: "..." # consise one sentence description of the slug role
        required: boolean # if required, set to true
      ...
    stateVariables?: # if view is stateful and needs view-level state variables, describe ;
      - name: "..." # variable name
				role: "..." # describe
        schema: # variable schema in JS-parseable interface schema format ; schema should be fully defined including nested fields
        default: # default init value for the view's state variables
        mappingIfFromSource?: # if this state variable is set based on : received route slugs , or URL params , or app global state , specify
          - source: # is either "slugs" || "urlParams" || "globalAppState"
            name: # variable name as defined in slugs / urlParams / globalAppState to link it
          ...
      ...
    actions?: # if view has dynamic actions/functions, describe
      - name: "..." # action/function name
        intent: "..." # describe
        triggers: # list of ways the action/function is triggered; can be multiple ; ie. on page load, when some button is clicked inside view, when some state variable value changes, etc ...
				interactionWithBackend?: # if action interacts with backend, describe
					description: "if applies , describe the interaction with backend ; also mention if calls backend api or realtime, and describe how ; be detailed"
					
      ...
    globalStateVariablesAccessed?: # if view needs to access global state variables (as defined in provided app structure under root.globalState), specify those in this object ; object should also contain description of relationship (ie. 'to get auth token to use in api calls authorization header' , 'to get current user profile to prefill [...] ' , etc ... )

	[...]
\`\`\`

---
note :
-	for any field that requires making example, you can draw from provided data examples in provided task docs
	for any field such as image, media ... make sure you use urls rather than local references ;
	if some entry requires an image url or media, use a valid "https://picsum.photos/..." url for it !

---

for yaml to be 100% valid, use quotes around string as much as possible
your reply should start with : "\`\`\`yaml" and end with "\`\`\`"

you will be tipped $99999 + major company shares`,
		},
		{
			role: "user",
			content: `\`\`\`PRD:app-product-requirements-document
${prd}
\`\`\``,
		},
		{
			role: "user",
			content: `\`\`\`FRD:app-features-requirements-document
${frd}
\`\`\``,
		},
		{
			role: "user",
			content: `\`\`\`UXSMD:ux-sitemap-document
${uxsmd}
\`\`\``,
		},
		{
			role: "user",
			content: `\`\`\`UXDMD:ux-sitemap-data-crossanalysis-document
${uxdmd}
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

`),
		},
		{
			role: "user",
			content: `\`\`\`UX:ux-datamap
${yaml.stringify(uxdatamap.structure)}
\`\`\``,
		},
		{
			role: "user",
			content: `\`\`\`UX:ux-sitemap-distilled
${yaml.stringify(task.uxsitemap)}
\`\`\``,
		},
		{
			role: "user",
			content: `make the detailed architecture for views ids : ${task.ids.join(",")}  and their components.
only make the detailed architecture for views ids : ${task.ids.join(",")}  ; not any other views,
using the provided instructions and format

make a coherent, cohesive, perfect, detailed structure
answer in parseable YAML format, strictly in the provided instructions format ; strictly parseable YAML ;
you're a genius`,
		},
	];
	const views = (
		await context.run({
			id: "op:LLM::GEN",
			context: {
				...context, // {streams , project}
				operation: {
					key: "uxdatamap.views",
					meta: {
						name: "UX Datamap Views",
						desc: "define views <> data architecture",
					},
				},
			},
			data: {
				model: `chatgpt-4o-latest`, //`chatgpt-4o-latest`, // `chatgpt-4o-latest`,//`gpt-4o`,
				messages,
				preparser: `backticks`,
				parser: `yaml`,
			},
		})
	).generated.views;

	return {
		views: {
			[task.type]: views,
		},
	}; // -> views : { unique{[ids...]} , shared{ids[...]} }
}

export default {
	"UX:DATAMAP::STRUCTURE": uxDatamapStructure,
	"UX:DATAMAP::VIEWS": uxDatamapViews,
	"UX:DATAMAP::VIEWS:CHUNK": uxDatamapViewsChunk,
};
