import utils from "@/utils/index.js";
import yaml from "yaml";
import fs from "fs";
import { merge, sample } from "lodash-es";

async function webappViewGenerateMulti({ context, data }) {
	/* get all view from uxsitemap , start gen */
	const { views } = data.uxsitemap.structure;

	// console.error("______DEBUG_____ : webapp:view:generate:multi : skipping functional pass, testing redesign only ! ! ! ! !",);
	const passes = {
		functional: true,
		redesign: process.env.DESIGNER_ENABLE
			? JSON.parse(process.env.DESIGNER_ENABLE.toLowerCase())
			: false,
	};

	const tasks = [
		...(Object.keys(views?.unique) || {}).map((viewId) => {
			return {
				task: {
					type: "view",
					view: {
						type: "unique",
						id: viewId,
					},
					passes,
				},
			};
		}),
		...(Object.keys(views?.shared) || {}).map((viewId) => {
			return {
				task: {
					type: "view",
					view: {
						type: "shared",
						id: viewId,
					},
					passes,
				},
			};
		}),
	];
	let response = {};

	// console.error("__DEBUG________ : webapp:view:generate:multi : TASKS SLICED ! ! ! ! ! ! ! ! ! ! ! ! !");
	await Promise.all(
		//[sample(tasks)]
		// tasks.filter(e=>e.task.view.id.toLowerCase().includes('land'))
		tasks.map(async (task) => {
			response = merge(
				response,
				await context.run({
					id: `WEBAPP:VIEW::GENERATE`,
					context,
					data: { ...data, ...task },
				}),
			);
		}),
	);
	return response;
}

async function promptViewFunctional({ context, data }) {
	const { pm, backend, uxsitemap, uxdatamap, webapp, task } = data;
	const { prd, frd, uxdmd } = pm;
	const { view } = task;
	/*
    should return tsx , packages (if needed)
  */
	return [
		{
			role: `system`,
			content: `your role as an expert react and tailwind senior dev and product manager is to write the code for the react view component based on the provided task; for view ${view.id}

---

- analysis , in between \`\`\`markdown\`\`\`\` section
- full view component tsx code , in between \`\`\`tsx\`\`\`\` section
- dependencies, in between \`\`\`yaml\`\`\`\` section ; where any needed npm packages required code and need to be installed will be mentionned ; the yaml should have object : {dependencies : {"package":"version"} } ; (you can also just put "*" for version)
use doublequotes for every string inside the yaml to make sure formatting is good

---

in your analysis , if functions makes use of global app state or makes calls to backend, include a snippet of how the app state store or backend code handles the functions (check the provided codes) before you get to implementing the function - this will help you reason better through it and provide good justification on how to structure your functions ;

---

- in case you need temporary images or media, use a https://picsum.photos/ url with a random seed
no placeholder no hallucinated import of some local asset or image or component ... - do not make any assumptions about what is in the project other than strictly what it provided ! no hallucinations , no assumptions !

- in case you need to Link to other paths in the app (as described in the provided uxsitemaps), use <Link> (from : \`import { Link } from "react-router-dom"\` )
- super important :
  > if you link to other paths in the app, use \`import { Link } from "react-router-dom"\` !!

---

- super important :
> render all the html nodes with one single big (<>...</>) that is returned by the default React.FC() view component
> do not split html nodes renders as functions ; use one very big (<>...</>) returned by the default component
	use conditionals inside it when you need to, but no splitting render sections by functions - one big render block

---

> any backend server calls should be to the dev url specified in the provided docs (typically http://localhost:1337/* unless specified otherwise)

---

super important :
> use snake_case for any new naming you do

extremely important :
> ensure full perfect coherence with: backend server and global app store : methods / events / names / schemas ...
> field names and schemas epecially
> everything should be perfectly coherent and functional

---

> you are required to write the code for the full view, and for it to be fully functional
> no placeholders, no hallucinated imports, no assumptions that anything else has been implement , no missing imports !
  perfect working functional view component code with 100% of everything needed

> very important : as long as every single requirements is in your generated code ! no hallucinated or assumed imports ! write and implement every single thing needed for this view !

you are a genius + you get $9999`,
		},
		{
			role: "user",
			content: `\`\`\`PRD:product-requirements-document
${prd}
\`\`\`

---

\`\`\`FRD:features-requirements-document
${frd}
\`\`\`
`,
		},
		{
			role: "user",
			content: `\`\`\`UX:analysis-document
${uxdmd}
\`\`\``,
		},
		{
			role: `user`,
			content: `writing code for the app view ${view.id} , defined in the following:
\`\`\`
${yaml.stringify(view)}
\`\`\``,
		},
		{
			role: "user",
			content:
				`` +
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

\`\`\`BRD:server:main.js
${yaml.stringify(backend.server.main)}
\`\`\`

`),
		},
		{
			role: `user`,
			content: `the data states architecture for the ${view.id} alongside its relationships with the app architecture :
\`\`\`webapp:architecture
${yaml.stringify({
	architecture: {
		...uxdatamap.structure,
		crosslinks: uxsitemap.structure.crosslinks,
	},
	viewToImplement: view,
})}
\`\`\``,
		},
		{
			role: "user",
			content: `for additional reference (if needed):
the root app component that wraps this view:

\`\`\`@/App.tsx
${webapp.react.root.app.latest.tsx}
\`\`\`
---

the global state store component that wraps the app (including this view you're working on) is defined in the following ;
you can import the store exports if needed by using : \`import {...} from '@/store/main'\`

\`\`\`@/store/main.tsx
${webapp.react.store.redux.latest.tsx}
\`\`\`
`,
		},
		{
			role: `user`,
			content: `make the analysis and implement the tsx component;
> implement the react+tailwind component, fully and working from the get go;
> you are implementing the tsx code for view component : ${view.id}
> should be React.FC ! important !

- important : in case you need to link to other paths in the app (as described in the provided uxsitemaps), use <Link> (from : \`import { Link } from "react-router-dom"\` )

---

- super important :
> render all the html nodes with one single big (<>...</>) that is returned by the default React.FC() view component
> do not split html nodes renders as functions ; use one very big (<>...</>) returned by the default component
	use conditionals inside it when you need to, but no splitting render sections by functions - one big render block

---

> do not hallucinate methods or component imports that do not exist !
	all that exists has been provided to you

	any required additional actions should be implemented by you ; you are provided with all needed details to implement anything !
	> the global store and its methods is defined in @/store/main.tsx
	> that's all !!
	
  DO NOT ASSUME OTHER STUFF IS IMPLEMENTED !

	IF YOU NEED TO CALL THE BACKEND SERVER (whether for API / realtime websockets / ... ) OR SOMETHING SIMILAR, WRITE YOUR OWN COMPLETE FUNCTIONS INSIDE THIS VIEW !!

  do not write placeholders or imports from any "components to make" - all there is is the script you write so make it have 100% of everything needed
	IMPLEMENT EVERYTHING NEEDED IN THIS SCRIPT, DO NOT ASSUME ANYTHING ELSE IS IMPLEMENTED OR WILL BE IMPLEMENTED BESIDES YOUR CODE !
  
  do not hallucinate any imports - no hallucinated imports of local assets or images or components ...
  no hallucinated imports ! no placeholders ! no assumptions that something exists !

---

- analysis , in between \`\`\`markdown\`\`\`\` section
- full view component tsx code , in between \`\`\`tsx\`\`\`\` section
- dependencies, for npm packages, with {dependencies:{package:version,...}}, in between \`\`\`yaml\`\`\`\` section

you are a genius + you get $9999`,
		},
	].filter((e) => e);
}

async function promptViewRedesign({ context, data }) {
	/*
    data : {
      task : {
        type , 
        view : { type , id , details, datamap , tsx },
        rag,
        guidance { docs : { [usedPrimitiveId(s)] : "...mdx docs content..." } } || false,
        layout : {analysis,render{svg,image{base64?,url?,local?}}},
      },
    }
  */
	const { view, rag, guidance, layout } = data.task;
	const { details } = data.pm;
	const { tsx } = view;
	const { render } = layout;
	/*
    DONT FORGET THE AESTHETICS OBJECT ! (see old code.js again)
  */
	return [
		{
			role: "system",
			content: `your role as an expert react design engineer is to redesign and write the code for the react + tailwind view component based on the provided design task ; for view ${view.id}

---

- analysis , in between \`\`\`markdown\`\`\`\` section
- full view component tsx code of redesigned view , in between \`\`\`tsx\`\`\`\` section
- dependencies, in between \`\`\`yaml\`\`\`\` section ; where any needed npm packages required code and need to be installed will be mentionned ; the yaml should have object : {dependencies : {"package":"version"} } ; (you can also just put "*" for version)
use doublequotes for every string inside the yaml to make sure formatting is good

---

- in case you need temporary images or media, use a https://picsum.photos/ url with a random seed
no placeholder no hallucinated import of some local asset or image or component ... - do not make any assumptions about what is in the project other than strictly what it provided ! no hallucinations , no assumptions !

- in case you need to use icons, you can use icons from \`lucide-react\` ; but make sure they are icons you know 100% exist there ! no hallucinated icon names ! no assumptions !

- in case you need to Link to other paths in the app, use <Link> (from : \`import { Link } from "react-router-dom"\` )
- super important :
  > if you link to other paths in the app, use \`import { Link } from "react-router-dom"\` !!

---


- super important :
> render all the html nodes with one single big (<>...</>) that is returned by the default React.FC() view component
> do not split html nodes renders as functions ; use one very big (<>...</>) returned by the default component
	use conditionals inside it when you need to, but no splitting render sections by functions - one big render block

---

super important :
- your redesigned component should keep 100% of its functionalities from the previous view code version ;
- your role here is to redesign the component based on provided instructions
- keep in mind responsiveness

---


> you are required to write the code for the full view, and for it to be fully functional
> no placeholders, no hallucinated imports, no assumptions that anything else has been implement , no missing imports !
  perfect working functional view component code with 100% of everything needed

> very important :
  every single functionality is kept is in your redesigned view code !
  no hallucinated or assumed imports !
  write and implement every single thing needed for this view !

you are a genius
redesign the provided view component
you get $9999`,
		},
		guidance?.docs && {
			role: `user`,
			content: `to help you in your task, you can refer to components code docs provided below :

\`\`\`
${yaml.stringify({ docs: guidance.docs })}
\`\`\`

-------

super important

you can use it docs reference when you judge it is good to do so ;
but use it as a reference when it makes sense to do so ! use your best judgement in all cases !

`,
		},
		render?.image &&
			(render?.image?.url?.length ||
				render?.image?.base64?.length ||
				render?.image?.local?.length) && {
				role: `user`,
				content: [
					{
						type: "text",
						text: `the (desktop) design mockup of the view ${view.id} is as follows :

you can use it as a reference when you judge it is good to do so ;
(you should also ensure mobile responsive while making it)

important : use it as a reference when it makes sense to do so ! use your best judgement !

\`\`\`layout:design:mockup:figma-layers-export
${yaml.stringify({
	layers: render.svg.structure.svg.rect.map((item) => {
		return {
			primitiveType: item.$.primitiveId,
			description: item.$.description,
			_mockupCoords: {
				x: item.$.x,
				y: item.$.y,
				w: item.$.width,
				h: item.$.height,
			},
		};
	}),
})}
\`\`\`					
`,
					},
					render?.image &&
						(render?.image?.url?.length ||
							render?.image?.base64?.length ||
							render?.image?.local?.length) && {
							type: `image_url`,
							image_url: {
								url: render.image.url
									? render.image.url
									: render.image.base64
										? render.image.base64
										: render.image.local
											? `data:image/png;base64,${Buffer.from(fs.readFileSync(render.image.local)).toString("base64")}`
											: "",
								// detail: `high`,
							},
						},
				].filter((e) => e),
			},
		{
			role: "user",
			content: `the code of the view ${view.id} that you are tasked to redesign is as follows :
\`\`\`${view.id}.tsx
${tsx}
\`\`\`


super important :
> your redesig should be perfectly congruent with the original view's features ;
> do not hallucinate features that the original view does not have ! do not take the freedom to add shit that isn't there ; things would break ! respect the task and strictly the task !

`,
		},
		details?.design?.aesthetics?.text?.length && {
			role: `user`,
			content: `additionally - if it is any help, the design aesthetics instructions for the app are :

${details.design.aesthetics.text}`,
		},
		{
			role: "user",
			content: `make the analysis and implement the redesigned tsx component;
> redesign the react+tailwind component, fully and working from the get go;
> you are redesigning the tsx code for view component : ${view.id}
> should be React.FC ! important !

---


- super important :
> render all the html nodes with one single big (<>...</>) that is returned by the default React.FC() view component
> do not split html nodes renders as functions ; use one very big (<>...</>) returned by the default component
	use conditionals inside it when you need to, but no splitting render sections by functions - one big render block

---

> do not hallucinate methods or component imports that do not exist !
	all that exists has been provided to you
  DO NOT ASSUME OTHER STUFF IS IMPLEMENTED UNLESS IT WAS CLEARLY AND PRECISELY PROVIDED IN EXAMPLES OR DOCUMENTATION !
  NO ASSUMPTIONS !

  do not write placeholders or imports from any "components to make"
  all there is is the script you write so make it have 100% of everything needed
	IMPLEMENT EVERYTHING NEEDED IN THIS SCRIPT, DO NOT ASSUME ANYTHING ELSE IS IMPLEMENTED OR WILL BE IMPLEMENTED BESIDES YOUR CODE AND EXACTLY WHAT WAS PROVIDED IN DOCS !
  
  do not hallucinate any imports - no hallucinated imports of local assets or images or components ...
  no hallucinated imports ! no placeholders ! no assumptions that something exists !

---

- analysis , in between \`\`\`markdown\`\`\`\` section
- full redesigned view component tsx code , in between \`\`\`tsx\`\`\`\` section
- dependencies, for npm packages, with {dependencies:{package:version,...}}, in between \`\`\`yaml\`\`\`\` section

you are a genius
redesign the provided view and implement its full code
you get $9999`,
		},
	].filter((e) => e);
}

async function webappViewGenerate({ context, data }) {
	/*
    data : {
      ...data ,
      task : {
        type: "view",
        view: { type : "unique || shared" , id },
        passes: {
          functional : true,
          redesign : true,
        }
      }
    }
  */
	const timestamp = `${Date.now()}`;

	const { task } = data;
	const { view, passes } = task;

	/*
    passes : { functional:bool , redesign:bool }
      if functional only, clear
      if redesign only, svgPrompt -> recodePrompt
      if both , parallel { functional , svg } -> recodePrompt
  */

	data.task.view = {
		...data.task.view,
		details: data.uxsitemap.structure.views[task.view.type][task.view.id],
		datamap: data.uxdatamap.views[task.view.type][task.view.id],
	};

	/*
    should merge with data.webapp at every pass !
  */

	if (passes.functional) {
		const messagesFunctional = await promptViewFunctional({
			context,
			data,
		});

		const { generated } = await context.run({
			id: "op:LLM::GEN",
			context: {
				...context, // {streams , project}
				operation: {
					key: `webapp.react.views.${view.id}.latest`,
					meta: {
						name: `Webapp View Implement { ${view.id} }`,
						desc: "react view, functional pass",
					},
				},
			},
			data: {
				model: `chatgpt-4o-latest`, //`gpt-4o`,
				messages: messagesFunctional,
				preparser: false,
				parser: false,
			},
		});

		const extraction = await utils.parsers.extract.backticksMultiple({
			text: generated,
			delimiters: [`markdown`, `tsx`, `yaml`],
		});

		const { markdown, tsx } = extraction;
		if (!tsx.length) {
			throw new Error("webapp:view:generate error - generated tsx is empty");
		}

		const parsedYaml = extraction.yaml ? yaml.parse(extraction.yaml) : {};
		const generatedView = {
			analysis: markdown,
			tsx,
			dependencies: parsedYaml.dependencies
				? Object.fromEntries(
						Object.keys(parsedYaml.dependencies).map((key) => [key, "*"]),
					)
				: [],
			timestamp,
		};

		await Promise.all(
			[`${timestamp}`, `latest`].map(async (version) => {
				await context.run({
					id: "op:PROJECT::STATE:UPDATE",
					context,
					data: {
						operation: {
							id: `webapp:react:views`,
							refs: {
								id: view.id,
								version,
							},
						},
						type: `end`,
						content: {
							key: `webapp.react.views.${view.id}.${version}`,
							data: generatedView,
						},
					},
				});
			}),
		);

		if (Object.keys(generatedView.dependencies).length) {
			await context.run({
				id: "op:PROJECT::STATE:UPDATE",
				context,
				data: {
					operation: {
						id: "settings:config:package",
					},
					type: `end`,
					content: {
						key: "settings.config.package",
						data: {
							webapp: {
								dependencies: generatedView.dependencies,
							},
						},
					},
				},
			});
		}

		data.webapp = merge(data.webapp, {
			react: {
				views: {
					// ie. "views" , "sections" , "store" , "root"
					[view.id]: {
						// ie. {UV_* , SEC_* , redux} , "app" (in case of root)
						[timestamp]: generatedView,
						latest: generatedView,
					},
				},
			},
		});
	}

	if (passes.redesign) {
		/*
      svg pass (handled in DESIGNER:LAYOUTV1::VIEW:GENERATE)
    */

		const redesignTimestamp = `${Date.now()}`;

		const designerResponse = await context.run({
			id: "DESIGNER:LAYOUTV1::VIEW:GENERATE",
			context,
			data: {
				...data,
				timestamp: redesignTimestamp, // to keep versions congruent
			},
		}); // -> { designer {rag,guidance} , webapp { layout { views { [id] { [version] : { analysis , render{ svg,image } } } } } } }

		/*
    merge (op:state:update already handled in designer:layoutv1)
    */
		data.webapp = merge(data.webapp, designerResponse.webapp);
		// console.dir({ designerResponse } , {depth:null }) ; process.exit();
		const { rag, guidance } = designerResponse.designer;
		let primitivesIds = [];
		try {
			primitivesIds = [
				...new Set(
					designerResponse.webapp.layout.views[
						task.view.id
					].latest.render.svg.structure.svg.rect
						.filter((item) => item.$?.primitiveId)
						.map((item) => item.$.primitiveId),
				),
			];
		} catch (e) {
			console.error(`webapp:view:generate:pass:redesign : ${e}`);
		}

		data.task.view.tsx = data.webapp.react.views[task.view.id].latest.tsx;
		const redesignTask = {
			...data.task, // type , view{type,id,details,datamap,tsx}
			rag,
			guidance:
				guidance && guidance.docs?.primitives
					? {
							docs: Object.fromEntries(
								Object.entries(
									Object.entries(guidance.docs.primitives)
										.filter(([key]) => primitivesIds.includes(key))
										.reduce((acc, [key, value]) => {
											if (!acc[value]) {
												acc[value] = key;
											} else {
												acc[value] += ` , ${key}`;
											}
											return acc;
										}, {}),
								).map(([value, keys]) => [keys, value]),
							),
						} // filters out duplicates docs (ie. button , button_icon_only , button_secondary , ... share same docs)
					: false,
			layout: designerResponse.webapp.layout.views[task.view.id].latest, //{analysis,render{svg,image{base64?,url?,local?}}}
		};

		/*
      recode pass (handled here with promptViewRedesign )
      make use of guidance (and rag?) ; since guidance will have design system docs that filter out whats needed !
          guidance { ontology{primitives{[ids]}} , image{base64,url} , docs{ primitives{ [id] : "... mdx content ..." }  }  } 
    */
		/*
        in dependencies , filter out weird dependencies if exist like "@/components/..."
    */

		/*
      use : redesignTimestamp !!
      merge with data.webapp , {...react}:
      op:state::update react
    */

		const messagesRedesign = await promptViewRedesign({
			context,
			data: {
				...data,
				task: redesignTask,
			},
		});

		const { generated } = await context.run({
			id: "op:LLM::GEN",
			context: {
				...context, // {streams , project}
				operation: {
					key: `webapp.react.views.${view.id}.latest`,
					meta: {
						name: `Webapp View Redesign { ${view.id} }`,
						desc: "react view, redesign pass",
					},
				},
			},
			data: {
				model: `chatgpt-4o-latest`, //`gpt-4o`,
				messages: messagesRedesign,
				preparser: false,
				parser: false,
			},
		});

		const extraction = await utils.parsers.extract.backticksMultiple({
			text: generated,
			delimiters: [`markdown`, `tsx`, `yaml`],
		});

		const { markdown, tsx } = extraction;
		if (!tsx.length) {
			throw new Error("webapp:view:generate error - generated tsx is empty");
		}

		const parsedYaml = extraction.yaml ? yaml.parse(extraction.yaml) : {};
		const generatedView = {
			analysis: markdown,
			tsx,
			dependencies: parsedYaml.dependencies
				? Object.fromEntries(
						Object.keys(parsedYaml.dependencies).map((key) => [key, "*"]),
					)
				: [],
			timestamp: redesignTimestamp,
		};

		await Promise.all(
			[`${redesignTimestamp}`, `latest`].map(async (version) => {
				await context.run({
					id: "op:PROJECT::STATE:UPDATE",
					context,
					data: {
						operation: {
							id: `webapp:react:views`,
							refs: {
								id: view.id,
								version,
							},
						},
						type: `end`,
						content: {
							key: `webapp.react.views.${view.id}.${version}`,
							data: generatedView,
						},
					},
				});
			}),
		);

		if (Object.keys(generatedView.dependencies).length) {
			await context.run({
				id: "op:PROJECT::STATE:UPDATE",
				context,
				data: {
					operation: {
						id: "settings:config:package",
					},
					type: `end`,
					content: {
						key: "settings.config.package",
						data: {
							webapp: {
								dependencies: generatedView.dependencies,
							},
						},
					},
				},
			});
		}

		data.webapp = merge(data.webapp, {
			react: {
				views: {
					// ie. "views" , "sections" , "store" , "root"
					[view.id]: {
						// ie. {UV_* , SEC_* , redux} , "app" (in case of root)
						[redesignTimestamp]: generatedView,
						latest: generatedView,
					},
				},
			},
		});
	}

	return { webapp: data.webapp };
}

async function promptIterateNoDesigner({ context, data }) {
	/*
		prompt with :
			current screenshot?.base64?
			tsx
			user notes text
	*/
	const { task } = data;
	const { view, iteration } = task;
	const { notes, screenshot } = iteration;
	const { tsx } = view;
	const { details } = data.pm;

	return [
		{
			role: "system",
			content: `your role as an expert react design engineer is to redesign and write the code for the react + tailwind view component based on the provided design task ; for view ${view.id}

---

- analysis , in between \`\`\`markdown\`\`\`\` section
- full view component tsx code of redesigned view , in between \`\`\`tsx\`\`\`\` section
- dependencies, in between \`\`\`yaml\`\`\`\` section ; where any needed npm packages required code and need to be installed will be mentionned ; the yaml should have object : {dependencies : {"package":"version"} } ; (you can also just put "*" for version)
use doublequotes for every string inside the yaml to make sure formatting is good

---

- in case you need temporary images or media, use a https://picsum.photos/ url with a random seed
no placeholder no hallucinated import of some local asset or image or component ... - do not make any assumptions about what is in the project other than strictly what it provided ! no hallucinations , no assumptions !

- in case you need to use icons, you can use icons from \`lucide-react\` ; but make sure they are icons you know 100% exist there ! no hallucinated icon names ! no assumptions !

- in case you need to Link to other paths in the app, use <Link> (from : \`import { Link } from "react-router-dom"\` )
- super important :
  > if you link to other paths in the app, use \`import { Link } from "react-router-dom"\` !!

---


- super important :
> render all the html nodes with one single big (<>...</>) that is returned by the default React.FC() view component
> do not split html nodes renders as functions ; use one very big (<>...</>) returned by the default component
	use conditionals inside it when you need to, but no splitting render sections by functions - one big render block

---

super important :
- your redesigned component should keep 100% of its functionalities from the previous view code version ;
- your role here is to redesign the component based on provided instructions
- keep in mind responsiveness

---


> you are required to write the code for the full view, and for it to be fully functional
> no placeholders, no hallucinated imports, no assumptions that anything else has been implement , no missing imports !
  perfect working functional view component code with 100% of everything needed

> very important :
  every single functionality is kept is in your redesigned view code !
  no hallucinated or assumed imports !
  write and implement every single thing needed for this view !

you are a genius
redesign the provided view component
you get $9999`,
		},
		screenshot &&
			(screenshot?.url?.length ||
				screenshot?.base64?.length ||
				screenshot?.local?.length) && {
				role: `user`,
				content: [
					{
						type: "text",
						text: `a screenshot of the current view render :	`,
					},
					screenshot &&
						(screenshot?.url?.length ||
							screenshot?.base64?.length ||
							screenshot?.local?.length) && {
							type: `image_url`,
							image_url: {
								url: screenshot.url
									? screenshot.url
									: screenshot.base64
										? screenshot.base64
										: screenshot.local
											? `data:image/png;base64,${Buffer.from(fs.readFileSync(render.image.local)).toString("base64")}`
											: "",
								// detail: `high`,
							},
						},
				].filter((e) => e),
			},
		{
			role: "user",
			content: `the code of the view ${view.id} that you are tasked to redesign is as follows :
\`\`\`${view.id}.tsx
${tsx}
\`\`\`

---

super important :
> your redesign should be perfectly congruent with the original view's features ;
> do not hallucinate features that the original view does not have ! do not take the freedom to add stuff that isn't there ; things would break ! respect the task and strictly the task !

`,
		},
		details?.design?.aesthetics?.text?.length && {
			role: `user`,
			content: `additionally - if it is any help - the original design aesthetics instructions for the app were :

\`\`\`
${details.design.aesthetics.text}
\`\`\`
`,
		},
		notes?.text?.length && {
			role: `user`,
			content: `the new redesign instructions - the most important part of your task - are the following :

\`\`\`view:redesign:instructions
${notes.text}
\`\`\`

`,
		},
		{
			role: "user",
			content: `make the analysis and implement the redesigned tsx component;
> redesign the react+tailwind component, fully and working from the get go;
> you are redesigning the tsx code for view component : ${view.id}
> should be React.FC ! important !

---


- super important :
> render all the html nodes with one single big (<>...</>) that is returned by the default React.FC() view component
> do not split html nodes renders as functions ; use one very big (<>...</>) returned by the default component
	use conditionals inside it when you need to, but no splitting render sections by functions - one big render block

---

> do not hallucinate methods or component imports that do not exist !
	all that exists has been provided to you
  DO NOT ASSUME OTHER STUFF IS IMPLEMENTED UNLESS IT WAS CLEARLY AND PRECISELY PROVIDED IN EXAMPLES OR DOCUMENTATION !
  NO ASSUMPTIONS !

  do not write placeholders or imports from any "components to make"
  all there is is the script you write so make it have 100% of everything needed
	IMPLEMENT EVERYTHING NEEDED IN THIS SCRIPT, DO NOT ASSUME ANYTHING ELSE IS IMPLEMENTED OR WILL BE IMPLEMENTED BESIDES YOUR CODE AND EXACTLY WHAT WAS PROVIDED IN DOCS !
  
  do not hallucinate any imports - no hallucinated imports of local assets or images or components ...
  no hallucinated imports ! no placeholders ! no assumptions that something exists !

---

- analysis , in between \`\`\`markdown\`\`\`\` section
- full redesigned view component tsx code , in between \`\`\`tsx\`\`\`\` section
- dependencies, for npm packages, with {dependencies:{package:version,...}}, in between \`\`\`yaml\`\`\`\` section

you are a genius
redesign the provided view and implement its full code
you get $9999`,
		},
	].filter((e) => e);
}

async function promptIterateWithDesigner({ context, data }) {
	/*
		prompt with :
			current screenshot?.base64?
			tsx
			suggested designer layout render
			user notes text
	*/
	const { task } = data;
	const { view, iteration, rag, guidance, layout } = task;
	const { render } = layout;
	const { notes, screenshot } = iteration;
	const { tsx } = view;
	const { details } = data.pm;

	return [
		{
			role: "system",
			content: `your role as an expert react design engineer is to redesign and write the code for the react + tailwind view component based on the provided design task ; for view ${view.id}

---

- analysis , in between \`\`\`markdown\`\`\`\` section
- full view component tsx code of redesigned view , in between \`\`\`tsx\`\`\`\` section
- dependencies, in between \`\`\`yaml\`\`\`\` section ; where any needed packages imported into the component code and need to be installed will be mentionned ; the yaml should have object : {dependencies : {"package":"version"} } ; (you can also just put "*" for version)
use doublequotes for every string inside the yaml to make sure formatting is good

---

- in case you need temporary images or media, use a https://picsum.photos/ url with a random seed
no placeholder no hallucinated import of some local asset or image or component ... - do not make any assumptions about what is in the project other than strictly what it provided ! no hallucinations , no assumptions !

- in case you need to use icons, you can use icons from \`lucide-react\` ; but make sure they are icons you know 100% exist there ! no hallucinated icon names ! no assumptions !

- in case you need to Link to other paths in the app, use <Link> (from : \`import { Link } from "react-router-dom"\` )
- super important :
  > if you link to other paths in the app, use \`import { Link } from "react-router-dom"\` !!

---


- super important :
> render all the html nodes with one single big (<>...</>) that is returned by the default React.FC() view component
> do not split html nodes renders as functions ; use one very big (<>...</>) returned by the default component
	use conditionals inside it when you need to, but no splitting render sections by functions - one big render block

---

super important :
- your redesigned component should keep 100% of its functionalities from the previous view code version ;
- your role here is to redesign the component based on provided instructions
- keep in mind responsiveness

---


> you are required to write the code for the full view, and for it to be fully functional
> no placeholders, no hallucinated imports, no assumptions that anything else has been implement , no missing imports !
  perfect working functional view component code with 100% of everything needed

> very important :
  every single functionality is kept is in your redesigned view code !
  no hallucinated or assumed imports !
  write and implement every single thing needed for this view !

you are a genius
redesign the provided view component
you get $9999`,
		},
		screenshot &&
			(screenshot?.url?.length ||
				screenshot?.base64?.length ||
				screenshot?.local?.length) && {
				role: `user`,
				content: [
					{
						type: "text",
						text: `a screenshot of the current view render to redesign :	`,
					},
					screenshot &&
						(screenshot?.url?.length ||
							screenshot?.base64?.length ||
							screenshot?.local?.length) && {
							type: `image_url`,
							image_url: {
								url: screenshot.url
									? screenshot.url
									: screenshot.base64
										? screenshot.base64
										: screenshot.local
											? `data:image/png;base64,${Buffer.from(fs.readFileSync(render.image.local)).toString("base64")}`
											: "",
								// detail: `high`,
							},
						},
				].filter((e) => e),
			},
		guidance?.docs && {
			role: `user`,
			content: `to help you in your redesign task, you can refer to components code docs provided below :

\`\`\`
${yaml.stringify({ docs: guidance.docs })}
\`\`\`

-------

super important

you can use it docs reference when you judge it is good to do so ;
but use it as a reference when it makes sense to do so ! use your best judgement in all cases !

`,
		},
		render?.image &&
			(render?.image?.url?.length ||
				render?.image?.base64?.length ||
				render?.image?.local?.length) && {
				role: `user`,
				content: [
					{
						type: "text",
						text: `the new suggested redesign mockup of the view ${view.id} is as follows :

you can use it as a reference when you judge it is good to do so ;
(you should also ensure mobile responsive while making it)

important : use it as a reference when it makes sense to do so ! use your best judgement !

\`\`\`layout:design:mockup:figma-layers-export
${yaml.stringify({
	layers: render.svg.structure.svg.rect.map((item) => {
		return {
			primitiveType: item.$.primitiveId,
			description: item.$.description,
			_mockupCoords: {
				x: item.$.x,
				y: item.$.y,
				w: item.$.width,
				h: item.$.height,
			},
		};
	}),
})}
\`\`\`					
`,
					},
					render?.image &&
						(render?.image?.url?.length ||
							render?.image?.base64?.length ||
							render?.image?.local?.length) && {
							type: `image_url`,
							image_url: {
								url: render.image.url
									? render.image.url
									: render.image.base64
										? render.image.base64
										: render.image.local
											? `data:image/png;base64,${Buffer.from(fs.readFileSync(render.image.local)).toString("base64")}`
											: "",
								// detail: `high`,
							},
						},
				].filter((e) => e),
			},

		{
			role: "user",
			content: `the code of the view ${view.id} that you are tasked to redesign is as follows :
\`\`\`${view.id}.tsx
${tsx}
\`\`\`

---

super important :
> your redesign should be perfectly congruent with the original view's features ;
> do not hallucinate features that the original view does not have ! do not take the freedom to add stuff that isn't there ; things would break ! respect the task and strictly the task !

`,
		},
		details?.design?.aesthetics?.text?.length && {
			role: `user`,
			content: `additionally - if it is any help - the original design aesthetics instructions for the app were :

\`\`\`
${details.design.aesthetics.text}
\`\`\`
`,
		},
		notes?.text?.length && {
			role: `user`,
			content: `the new redesign instructions ( on which the new redesign mockup are based ) are the following :

\`\`\`view:redesign:instructions
${notes.text}
\`\`\`

`,
		},
		{
			role: "user",
			content: `make the analysis and implement the redesigned tsx component;
> redesign the react+tailwind component, fully and working from the get go;
> you are redesigning the tsx code for view component : ${view.id}
> should be React.FC ! important !

---


- super important :
> render all the html nodes with one single big (<>...</>) that is returned by the default React.FC() view component
> do not split html nodes renders as functions ; use one very big (<>...</>) returned by the default component
	use conditionals inside it when you need to, but no splitting render sections by functions - one big render block

---

> do not hallucinate methods or component imports that do not exist !
	all that exists has been provided to you
  DO NOT ASSUME OTHER STUFF IS IMPLEMENTED UNLESS IT WAS CLEARLY AND PRECISELY PROVIDED IN EXAMPLES OR DOCUMENTATION !
  NO ASSUMPTIONS !

  do not write placeholders or imports from any "components to make"
  all there is is the script you write so make it have 100% of everything needed
	IMPLEMENT EVERYTHING NEEDED IN THIS SCRIPT, DO NOT ASSUME ANYTHING ELSE IS IMPLEMENTED OR WILL BE IMPLEMENTED BESIDES YOUR CODE AND EXACTLY WHAT WAS PROVIDED IN DOCS !
  
  do not hallucinate any imports - no hallucinated imports of local assets or images or components ...
  no hallucinated imports ! no placeholders ! no assumptions that something exists !

---

- analysis , in between \`\`\`markdown\`\`\`\` section
- full redesigned view component tsx code , in between \`\`\`tsx\`\`\`\` section
- dependencies, with {dependencies:{package:version,...}}, in between \`\`\`yaml\`\`\`\` section

you are a genius
redesign the provided view and implement its full code
you get $9999`,
		},
	].filter((e) => e);
}

//async function webappViewRedesign({ context, data }) {}
async function webappViewIterate({ context, data }) {
	const timestamp = `${Date.now()}`;

	const { task } = data;
	const { view, iteration } = task;
	const { id, version } = view;
	const { designer } = iteration;

	const tsx = data.webapp.react.views[task.view.id][version].tsx;

	// if designer , call designer/layoutv1/iterate
	/*
		if no designer, just have a prompt : promptIterateNoDesigner
		if designer :
			call designer/layoutv1/iterate , where it will do analysis+svg in one single pass
				have ragText + user notes -> rag
				have screenshot there too for ref
			call promptIterateWithDesigner
	*/

	// console.dir({"debug:webapp:view:iterate" : {task}},{depth:null})

	data.task.view = {
		...data.task.view,
		tsx,
		details: data.uxsitemap.structure.views[task.view.type][task.view.id],
		datamap: data.uxdatamap.views[task.view.type][task.view.id],
	};

	if (!designer) {
		const promptMessagesNoDesigner = await promptIterateNoDesigner({
			context,
			data,
		});

		const { generated } = await context.run({
			id: "op:LLM::GEN",
			context: {
				...context, // {streams , project}
				operation: {
					key: `webapp.react.views.${view.id}.latest`,
					meta: {
						name: `Webapp View Iterate { ${view.id} }`,
						desc: "react view iteration , code only",
					},
				},
			},
			data: {
				model: `chatgpt-4o-latest`, //`gpt-4o`,
				messages: promptMessagesNoDesigner,
				preparser: false,
				parser: false,
			},
		});

		const extraction = await utils.parsers.extract.backticksMultiple({
			text: generated,
			delimiters: [`markdown`, `tsx`, `yaml`],
		});

		const { markdown, tsx } = extraction;
		if (!tsx.length) {
			throw new Error("webapp:view:generate error - generated tsx is empty");
		}

		const parsedYaml = extraction.yaml ? yaml.parse(extraction.yaml) : {};
		const generatedView = {
			analysis: markdown,
			tsx,
			dependencies: parsedYaml.dependencies
				? Object.fromEntries(
						Object.keys(parsedYaml.dependencies).map((key) => [key, "*"]),
					)
				: [],
			timestamp,
		};

		await Promise.all(
			[`${timestamp}`, `latest`].map(async (version) => {
				await context.run({
					id: "op:PROJECT::STATE:UPDATE",
					context,
					data: {
						operation: {
							id: `webapp:react:views`,
							refs: {
								id: view.id,
								version,
							},
						},
						type: `end`,
						content: {
							key: `webapp.react.views.${view.id}.${version}`,
							data: generatedView,
						},
					},
				});
			}),
		);

		if (Object.keys(generatedView.dependencies).length) {
			await context.run({
				id: "op:PROJECT::STATE:UPDATE",
				context,
				data: {
					operation: {
						id: "settings:config:package",
					},
					type: `end`,
					content: {
						key: "settings.config.package",
						data: {
							webapp: {
								dependencies: generatedView.dependencies,
							},
						},
					},
				},
			});
		}

		data.webapp = merge(data.webapp, {
			react: {
				views: {
					// ie. "views" , "sections" , "store" , "root"
					[view.id]: {
						// ie. {UV_* , SEC_* , redux} , "app" (in case of root)
						[timestamp]: generatedView,
						latest: generatedView,
					},
				},
			},
		});
	} else {
		const redesignTimestamp = `${timestamp}`;

		const designerResponse = await context.run({
			id: "DESIGNER:LAYOUTV1::VIEW:ITERATE",
			context,
			data: {
				...data,
				timestamp: redesignTimestamp, // to keep versions congruent
			},
		}); // -> { designer {rag,guidance} , webapp { layout { views { [id] { [version] : { analysis , render{ svg,image } } } } } } }

		/*
		merge (op:state:update already handled in designer:layoutv1)
		*/
		data.webapp = merge(data.webapp, designerResponse.webapp);
		// console.dir({ designerResponse } , {depth:null }) ; process.exit();
		const { rag, guidance } = designerResponse.designer;
		let primitivesIds = [];
		try {
			primitivesIds = [
				...new Set(
					designerResponse.webapp.layout.views[
						task.view.id
					].latest.render.svg.structure.svg.rect
						.filter((item) => item.$?.primitiveId)
						.map((item) => item.$.primitiveId),
				),
			];
		} catch (e) {
			console.error(`webapp:view:generate:pass:redesign : ${e}`);
		}

		const redesignTask = {
			...data.task, // type , view{type,id,details,datamap,tsx} , iteration{notes,screenshot}
			rag,
			guidance:
				guidance && guidance.docs?.primitives
					? {
							docs: Object.fromEntries(
								Object.entries(
									Object.entries(guidance.docs.primitives)
										.filter(([key]) => primitivesIds.includes(key))
										.reduce((acc, [key, value]) => {
											if (!acc[value]) {
												acc[value] = key;
											} else {
												acc[value] += ` , ${key}`;
											}
											return acc;
										}, {}),
								).map(([value, keys]) => [keys, value]),
							),
						} // filters out duplicates docs (ie. button , button_icon_only , button_secondary , ... share same docs)
					: false,
			layout: designerResponse.webapp.layout.views[task.view.id].latest, //{analysis,render{svg,image{base64?,url?,local?}}}
		};

		const mesagesIterateWithDesigner = await promptIterateWithDesigner({
			context,
			data: {
				...data,
				task: redesignTask,
			},
		});

		const { generated } = await context.run({
			id: "op:LLM::GEN",
			context: {
				...context, // {streams , project}
				operation: {
					key: `webapp.react.views.${view.id}.latest`,
					meta: {
						name: `Webapp View Iterate { ${view.id} }`,
						desc: "react view iteration , with designer",
					},
				},
			},
			data: {
				model: `chatgpt-4o-latest`, //`gpt-4o`,
				messages: mesagesIterateWithDesigner,
				preparser: false,
				parser: false,
			},
		});

		const extraction = await utils.parsers.extract.backticksMultiple({
			text: generated,
			delimiters: [`markdown`, `tsx`, `yaml`],
		});

		const { markdown, tsx } = extraction;
		if (!tsx.length) {
			throw new Error("webapp:view:generate error - generated tsx is empty");
		}

		const parsedYaml = extraction.yaml ? yaml.parse(extraction.yaml) : {};
		const generatedView = {
			analysis: markdown,
			tsx,
			dependencies: parsedYaml.dependencies
				? Object.fromEntries(
						Object.keys(parsedYaml.dependencies).map((key) => [key, "*"]),
					)
				: [],
			timestamp: redesignTimestamp,
		};

		await Promise.all(
			[`${redesignTimestamp}`, `latest`].map(async (version) => {
				await context.run({
					id: "op:PROJECT::STATE:UPDATE",
					context,
					data: {
						operation: {
							id: `webapp:react:views`,
							refs: {
								id: view.id,
								version,
							},
						},
						type: `end`,
						content: {
							key: `webapp.react.views.${view.id}.${version}`,
							data: generatedView,
						},
					},
				});
			}),
		);

		if (Object.keys(generatedView.dependencies).length) {
			await context.run({
				id: "op:PROJECT::STATE:UPDATE",
				context,
				data: {
					operation: {
						id: "settings:config:package",
					},
					type: `end`,
					content: {
						key: "settings.config.package",
						data: {
							webapp: {
								dependencies: generatedView.dependencies,
							},
						},
					},
				},
			});
		}

		data.webapp = merge(data.webapp, {
			react: {
				views: {
					// ie. "views" , "sections" , "store" , "root"
					[view.id]: {
						// ie. {UV_* , SEC_* , redux} , "app" (in case of root)
						[redesignTimestamp]: generatedView,
						latest: generatedView,
					},
				},
			},
		});
	}

	return { webapp: data.webapp };
}

export default {
	"WEBAPP:VIEW::GENERATE:MULTI": webappViewGenerateMulti,
	"WEBAPP:VIEW::GENERATE": webappViewGenerate,
	//"WEBAPP:VIEW::REDESIGN": webappViewRedesign,
	"WEBAPP:VIEW::ITERATE": webappViewIterate,
};
