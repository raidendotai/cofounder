import utils from "@/utils/index.js";
import yaml from "yaml";
import { merge } from "lodash-es";
import xml2js from "xml2js";
import sharp from "sharp";

async function promptGenerateAnalysis({ context, data }) {
	/*
		task : { ... , rag[] }
	*/
	const { view, rag, guidance } = data.task;
	const _view = { ...view };
	delete _view.type;
	return [
		{
			role: "system",
			content: `your job is to make an extremely detailed analysis for a layout design for a desktop app UI based on provided specifications

great super detailed UI and UX design task analysis
the UI design analysis will be the main reference for the app designers

- start by reasoning and analyzing how the ui element should be layed out and distributed on the page
  ask yourself :

* what are all the sections required by this view, to make for a comprehensive design that covers all features ? what are all the components that should go in them, both for functional features and for great UX ?
  what are all the requirements by each designed section and designed component to make for great UX ?
* what are the best ways to distribute blocks in this UI view ?
* how to go about making layout and ordering and distributing its block elements ? and which block elements ?
* does it make the best choice for the app user in terms of UI/UX ?
* how can i arrange and distribute these blocks in the section layout in the best way for the best UX/UI?
* analysis criticism : how to make the design perfect ?

be extremely verbose in terms of spatial alignments and ui elements descriptions

---

> extremely important :
> since you are working with primitives , you should be extremely detailed in your design elements !
> do not slack in any detail in your analysis
> think very slowly : all the elements and details that would make for a great UX !

---

> conduct the analysis first, reply with the analysis inside of \`\`\`markdown\`\`\`

you are a genius + you get $9999`,
		},
		rag.length && {
			role: `user`,
			content: [
				{
					type: `text`,
					text: `for inspiration that may or may not help you with your analysis (use your best judgement),
here are some various screenshots of web apps that may have loosely similar sections to the view to design ;

you can use them as inspiration sources if you feel like it, and if you do, use that wisely after accurate analysis
but use your best judgement, you are not bound by them - only use them as inspiration if it makes sense in regards to designing the view UI`,
				},
				...rag,
			],
		},
		guidance &&
			guidance.ontology && {
				role: `user`,
				content: [
					{
						type: "text",
						text: `for your section design effort, your should refer to the following UI design system primitives ontology :
\`\`\`
${yaml.stringify(guidance.ontology)}
\`\`\`
`,
					},
					guidance.image &&
						(guidance.image?.url?.length ||
							guidance.image?.base64?.length ||
							guidance.image?.local?.length) && {
							type: `image_url`,
							image_url: {
								url: guidance.image.url
									? guidance.image.url
									: guidance.image.base64
										? guidance.image.base64
										: guidance.image.local
											? `data:image/png;base64,${Buffer.from(fs.readFileSync(guidance.image.local)).toString("base64")}`
											: "",
								// detail: `high`,
							},
						},
				].filter((e) => e),
			},
		{
			role: "user",
			content: `designing the layout for the view id "${view.id}", specified in the following :

\`\`\`view:specifications
${yaml.stringify(_view)}
\`\`\`

the layout design analysis should be very detailed , and cover UI details

although , extremely important :

> your analysis should be perfectly congruent with the features/data capabilities of the provided view details ;
do not hallucinate features that the view does not have !
ie. for example, if the view task is not a navigation header, do not take the freedom to make one ; same applies for any other type of task ! things would break ! respect the task and strictly the task !
`,
		},
		{
			role: "user",
			content: `conduct the detailed analysis as the genius you are

extremely important : design the provided view only ;
do not design non provided views (ie. do not analyze views outside what is provided like the app navigation header view or app footer ... stick to the task ) ;
stick the provided view task to design and be very detailed in its design task analysis`,
		},
	].filter((item) => item);
}

async function promptGenerateSvg({ context, data }) {
	/*
		task : { ... , rag[] , analysis, guidance{} }
	*/
	const { view, rag, analysis, guidance } = data.task;
	const _view = { ...view };
	delete _view.type;
	return [
		{
			role: "system",
			content: `your job is to make a layout design for a desktop app UI based on provided description
great UI and UX

the layout design mockup will be the main reference for the app designers

the layout format will be colored rectangles to identify how different components should be placed in a layout for the app view design

it would be in this format:

\`\`\`svg
<svg viewId="viewIdExample" width="CANVAS_WIDTH" height="CANVAS_HEIGHT" xmlns="http://www.w3.org/2000/svg" >
  <rect primitiveId="example_primitive_id" description="..." x="X_VALUE" y="Y_VALUE" width="W_VALUE" height="H_VALUE" fill="#HEX"></rect>
  <rect primitiveId="some_other_primitive_id" description="..." x="X_VALUE" y="Y_VALUE" width="W_VALUE" height="H_VALUE" fill="#HEX"></rect>
  ...
</svg>
\`\`\`

---

> pick different rectangle color fills as you wish, which will be temporarily used to differentiate between different blocks

> you are not constrained by the order in which the blocks design system elements are provided (which is randomly ordered) ; you should use them in a way that makes the best sense in terms of UX for designers to implement later

> you are ONLY TO MAKE:

- THE RECTANGLES <rect> FOR PRIMITIVE BLOCKS and the {primitiveId} text alongside the {description}
- no additional anything else whatsoever

> the primitiveId should be coherent with the provided UI block primitives ontology
> if a required block is not in the provided UI block primitives, set its primitiveId to "nonprimitive" !

---

- start by reasoning and analyzing how the element should be layed out and distributed on the page
  ask yourself :

* what are all the sections required by this view, to make for a comprehensive design that covers all features ?
  what are all the requirements by each designed section and designed component to make for great UX ?
* what are the best ways to distribute blocks in this UI view ?
* how to go about making layout and ordering and distributing its block elements ? and which block elements ?
* does it make the best choice for the app user in terms of UI/UX ?
* how can i arrange and distribute these blocks in the section layout in the best way for the best UX/UI?
* analysis criticism : how to make the design perfect ?

---

extremely important :
> your mockup design should show the elements that are initially visible on the page !!
> do not model transition states or triggered overlays, as such things would overshadow the elements underneath and fuck up the mockup layout render !!

---

> root <svg> node should have width , height values
	all <rect> elements should have x , y , width , height values
	all width , height values for all elements (root <svg> and <rect> nodes) should have positive nonzero integer values

> extremely important : <svg> should only have <rect> nodes inside it, NO OTHER TYPE OF NODES ALLOWED, NO NESTING !!!
> every <rect> node should have primitiveId property , which would be one of the provided primitiveId s
> again, extremely important : <svg> should only have <rect> nodes inside it, NO OTHER TYPE OF NODES ALLOWED, NO NESTING !!!

> extremely important : only use the provided primitiveIds !!! no hallucinated primitiveIds !

---

> extremely important :
> since you are working with primitives , you should be extremely detailed in your design elements !
> do not slack in any detail in your analysis or design svg implementation
> think very slowly : all the elements that would make for a great UX !

---

> conduct the analysis first, reply with the analysis inside of \`\`\`markdown\`\`\`
> then, answer in a strict SVG reply in \`\`\`svg\`\`\` based on your analysis

you are a genius + you get $9999`,
		},
		rag.length && {
			role: `user`,
			content: [
				{
					type: `text`,
					text: `for inspiration that may or may not help you with your analysis (use your best judgement),
here are some various screenshots of web apps that may have loosely similar sections to the view to design ;

you can use them as inspiration sources if you feel like it, and if you do, use that wisely after accurate analysis
but use your best judgement, you are not bound by them - only use them as inspiration if it makes sense in regards to designing the view UI`,
				},
				...rag,
			],
		},
		guidance &&
			guidance.ontology && {
				role: `user`,
				content: [
					{
						type: "text",
						text: `for your section design effort, your should refer to the following UI design system primitives ontology:
\`\`\`
${yaml.stringify(guidance.ontology)}
\`\`\`
`,
					},
					guidance.image &&
						(guidance.image?.url?.length ||
							guidance.image?.base64?.length ||
							guidance.image?.local?.length) && {
							type: `image_url`,
							image_url: {
								url: guidance.image.url
									? guidance.image.url
									: guidance.image.base64
										? guidance.image.base64
										: guidance.image.local
											? `data:image/png;base64,${Buffer.from(fs.readFileSync(guidance.image.local)).toString("base64")}`
											: "",
								// detail: `high`,
							},
						},
				].filter((e) => e),
			},
		{
			role: "user",
			content: `designing the layout for the view id "${view.id}", specified in the following :

\`\`\`view:specifications
${yaml.stringify(_view)}
\`\`\`
`,
		},
		{
			role: "user",
			content: `\`\`\`view:design-task:detailed-analysis
${analysis}
\`\`\`

important :

> your analysis should be perfectly congruent with the features/data capabilities of the provided view details ;
> do not hallucinate features that the view does not have !
ie. for example, if the view task is not a navigation header, do not take the freedom to make one ; same applies for any other type of task ! things would break ! respect the task and strictly the task !

`,
		},
		{
			role: "user",
			content: `make the analysis and spatial UI layout in SVG format as the genius UI designer you are

> remember, you are designing for a desktop app !
> you are designing the layout for the viewId : "${view.id}" !

> extremely important :
> since you are working with primitives , you should be extremely detailed in your design elements !
> do not slack in any detail in your analysis
> think very slowly : all the elements that would make for a great UX !

---

> you are only allowed to use the primitiveId s provided in the ontology ! you cannot make a primitiveId up outside of what is provided !
> do not use a primitiveId that is not provided - and exactly as is, not a single character added or changed from the provided primitiveId s
> the "description" fields are important to provide guidance for designers, write extended descriptions in them !

---

extremely important :
> your mockup design should show the elements that are initially visible on the page !!
> do not model transition states or overlays, as such things would overshadow the elements underneath and fuck up the mockup layout render !!

again, extremely important :
> your mockup design should show the elements that are initially visible on the page !!
> do not model transition states or overlays, as such things would overshadow the elements underneath and fuck up the mockup layout render !!

---

important :

> your work is perfectly congruent with the features/data capabilities of the provided view details ;
> do not hallucinate features that the view does not have !

---

> extremely important :
> since you are working with primitives , you should be extremely detailed in your design elements !
> do not slack in any detail in your analysis or design svg implementation
> think very slowly : all the elements that would make for a great UX !

---

> conduct the analysis first, reply with the analysis inside of \`\`\`markdown\`\`\`
> then, answer in a strict SVG reply in \`\`\`svg\`\`\` based on your analysis

you are a genius + you get $9999
`,
		},
	].filter((item) => item);
}

async function designerLayoutv1ViewGenerate({ context, data }) {
	/*
		data : {
			...data,
			task : {
				type: "view",
        view: {
					type : "unique || shared",
					id
					details{}, // uxsitemap desc stuff
					datamap:{}, // data stuff
				},
			},
			webapp: {

			},
		}
	*/
	const { task, timestamp } = data;
	const { view } = task;

	// rag , if available
	const ragText = `Title : ${view.details.title}\nDescription: ${view.details.extendedDescription}\nRole: ${view.details.role}`;

	let rag = (
		await context.run({
			id: `op:INDEXDB::QUERY`,
			context,
			data: {
				index: "layouts",
				text: ragText,
				amount: 5,
			},
		})
	).results
		.filter((result) => result?.url?.length || result?.base64?.length)
		.map((result) => {
			return {
				type: `image_url`,
				image_url: {
					url: result?.url?.length
						? result.url
						: result?.base64?.length
							? result.base64
							: "",
				},
			};
		});

	// verify,validate rag images sizes
	rag = (
		await Promise.all(
			rag.map(async (item) => {
				const { url } = item.image_url;
				try {
					let buffer;
					if (url.startsWith("data:image/")) {
						// Handle base64 image
						const base64Data = url.split("base64,")[1];
						buffer = Buffer.from(base64Data, "base64");
					} else if (url.startsWith("https://")) {
						// Handle URL image
						const response = await fetch(url);
						if (!response.ok) {
							console.error(`designer:layoutv1:rag : failed to fetch image`);
							return null;
						}
						const arrayBuffer = await response.arrayBuffer();
						buffer = Buffer.from(arrayBuffer);
					} else {
						// Invalid URL format, return null to filter out later
						return null;
					}

					// Check image size using byteLength method
					if (Buffer.byteLength(buffer) > 4.5 * 1024 * 1024) {
						// 4.5 MB in bytes
						console.error(`> skipping : image size exceeds 4.5 MB`);
						return null;
					}

					const metadata = await sharp(buffer).metadata();

					// Check image dimensions
					if (
						metadata.width >= 8000 ||
						metadata.height >= 8000 ||
						metadata.width <= 0 ||
						metadata.height <= 0
					) {
						return null; // Return null if dimensions are invalid
					}
					return item;
				} catch (error) {
					console.error(`> skipping : error processing RAG image : `, error);
					return null; // Return null if there's an error
				}
			}),
		)
	)
		.filter((item) => item)
		.slice(0, 3); // fetched more than needed in case size filtered ; typically indexed landing pages dims can be too big

	data.task.rag = rag;

	// design system guidance , if available
	let guidance;
	try {
		guidance = await utils.render.guidance.grid.primitives({
			// determined from process.env in utils/render ... designSystem: designSystem ? designSystem : `presets/protoboy-v1`,
			cache: true,
		}); // -> { ontology , image{base64,url?} }
	} catch (e) {
		console.error(e);
	}
	data.task.guidance = guidance;

	const analysisPassMessages = await promptGenerateAnalysis({
		context,
		data,
	});

	// console.dir({ "debug:designer:layoutv1": { analysisPassMessages }},{depth:null})

	const analysisPass = (
		await context.run({
			id: "op:LLM::GEN",
			context: {
				...context, // {streams , project}
				operation: {
					key: `designer.layoutv1.analysis.${view.id}`,
					meta: {
						name: `Designer Analysis { ${view.id} }`,
						desc: "designer/layoutv1 task analysis",
					},
				},
			},
			data: {
				model: `chatgpt-4o-latest`, //`gpt-4o`,
				messages: analysisPassMessages,
				preparser: `backticks`,
				parser: false,
			},
		})
	).generated;

	data.task.analysis = analysisPass;

	const svgPassMessages = await promptGenerateSvg({ context, data });
	const svgPass = (
		await context.run({
			id: "op:LLM::GEN",
			context: {
				...context, // {streams , project}
				operation: {
					key: `designer.layoutv1.mockup.${view.id}`,
					meta: {
						name: `Designer Mockup { ${view.id} }`,
						desc: "designer/layoutv1 mockup generation",
					},
					cutoff: "```svg",
				},
			},
			data: {
				model: `chatgpt-4o-latest`, //`gpt-4o`,
				messages: svgPassMessages,
				preparser: false,
				parser: false,
			},
		})
	).generated;

	// raw svg string in response
	let response = await utils.parsers.extract.backticksMultiple({
		text: svgPass,
		delimiters: [`markdown`, `svg`],
	});

	if (!response.svg.length)
		throw new Error("designer:layoutv1:generate error - generated svg is empty");
	response.svg = response.svg.replaceAll("&", " "); // <---- & char crashes svg

	// validate svg?
	let svg = {};
	try {
		svg = await xml2js.parseStringPromise(response.svg, {
			explicitArray: true,
		});
		// console.dir({ "debug:designer:layoutv1:svg": svg }, { depth: null });
		if (!svg.svg.rect.filter((item) => item.$?.primitiveId).length) {
			console.error(`layout error : generated != task ; skipping`);
		}
	} catch (e) {
		console.error(e);
	}

	let render = {};
	try {
		render = await context.run({
			id: "op:RENDER::LAYOUT",
			context,
			data: {
				svg: { string: response.svg },
				mode: task.type,
			},
		}); // -> { svg , image{base64,url?,local?,buffer?} }
	} catch (e) {
		console.error(e);
	}

	// rely on local storage as loading strategy further down, else might dump base64strings to yaml ...
	if (render.image?.base64) delete render.image.base64;
	if (render.image?.buffer) delete render.image.buffer;

	const generatedLayout = {
		analysis: analysisPass,
		render,
	};

	await Promise.all(
		[`${timestamp}`, `latest`].map(async (version) => {
			await context.run({
				id: "op:PROJECT::STATE:UPDATE",
				context,
				data: {
					operation: {
						id: `webapp:layout:views`,
						refs: {
							id: view.id,
							version,
						},
					},
					type: `end`,
					content: {
						key: `webapp.layout.views.${view.id}.${version}`,
						data: generatedLayout,
					},
				},
			});
		}),
	);

	/*
		should return the RAG object and guidance too, will be used in code ? (not sure)
	*/
	return {
		designer: {
			rag,
			guidance,
		},
		webapp: {
			layout: {
				views: {
					[view.id]: {
						[timestamp]: generatedLayout,
						latest: generatedLayout,
					},
				},
			},
		},
	};
}

async function promptIterateSvg({ context, data }) {
	/*
		one pass with both analysis + svg
	*/
	/*
		task : { ... , rag[] , analysis, guidance{} }
	*/
	const { view, iteration, rag, analysis, guidance } = data.task;
	const { notes, screenshot } = iteration;
	const _view = { ...view };
	delete _view.type;
	delete _view.tsx;

	return [
		{
			role: "system",
			content: `your job is to make a new layout design for a desktop app UI view based on provided instructions
great UI and UX

the layout design mockup will be the main reference for the app designers to redesign the provided component

the layout format will be colored rectangles to identify how different components should be placed in a layout for the app view design

it would be in this format:

\`\`\`svg
<svg viewId="viewIdExample" width="CANVAS_WIDTH" height="CANVAS_HEIGHT" xmlns="http://www.w3.org/2000/svg" >
  <rect primitiveId="example_primitive_id" description="..." x="X_VALUE" y="Y_VALUE" width="W_VALUE" height="H_VALUE" fill="#HEX"></rect>
  <rect primitiveId="some_other_primitive_id" description="..." x="X_VALUE" y="Y_VALUE" width="W_VALUE" height="H_VALUE" fill="#HEX"></rect>
  ...
</svg>
\`\`\`

---

> pick different rectangle color fills as you wish, which will be temporarily used to differentiate between different blocks

> you are not constrained by the order in which the blocks design system elements are provided (which is randomly ordered) ; you should use them in a way that makes the best sense in terms of UX for designers to implement later

> you are ONLY TO MAKE:

- THE RECTANGLES <rect> FOR PRIMITIVE BLOCKS and the {primitiveId} text alongside the {description}
- no additional anything else whatsoever

> the primitiveId should be coherent with the provided UI block primitives ontology
> if a required block is not in the provided UI block primitives, set its primitiveId to "nonprimitive" !

---

- start by reasoning and analyzing how the element should be layed out and distributed on the page
  ask yourself :

* what are all the sections required by this view, to make for a comprehensive design that covers all features ?
  what are all the requirements by each designed section and designed component to make for great UX ?
* what are the best ways to distribute blocks in this UI view ?
* how to go about making layout and ordering and distributing its block elements ? and which block elements ?
* does it make the best choice for the app user in terms of UI/UX ?
* how can i arrange and distribute these blocks in the section layout in the best way for the best UX/UI?
* analysis criticism : how to make the design perfect ?

---

extremely important :
> your mockup design should show the elements that are initially visible on the page !!
> do not model transition states or triggered overlays, as such things would overshadow the elements underneath and fuck up the mockup layout render !!

---

> root <svg> node should have width , height values
	all <rect> elements should have x , y , width , height values
	all width , height values for all elements (root <svg> and <rect> nodes) should have positive nonzero integer values

> extremely important : <svg> should only have <rect> nodes inside it, NO OTHER TYPE OF NODES ALLOWED, NO NESTING !!!
> every <rect> node should have primitiveId property , which would be one of the provided primitiveId s
> again, extremely important : <svg> should only have <rect> nodes inside it, NO OTHER TYPE OF NODES ALLOWED, NO NESTING !!!

> extremely important : only use the provided primitiveIds !!! no hallucinated primitiveIds !

---

> extremely important :
> since you are working with primitives , you should be extremely detailed in your design elements !
> do not slack in any detail in your analysis or design svg implementation
> think very slowly : all the elements that would make for a great UX !

---

> conduct the analysis first, reply with the analysis inside of \`\`\`markdown\`\`\`
> then, answer in a strict SVG reply in \`\`\`svg\`\`\` based on your analysis

you are a genius + you get $9999`,
		},
		screenshot &&
			(screenshot?.url?.length ||
				screenshot?.base64?.length ||
				screenshot?.local?.length) && {
				role: `user`,
				content: [
					{
						type: "text",
						text: `a screenshot of the current view render that you are tasked to redesign based on provided instructions :	`,
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
		rag.length && {
			role: `user`,
			content: [
				{
					type: `text`,
					text: `for inspiration that may or may not help you with your analysis to redesign the view UI (use your best judgement),
here are some various screenshots of web apps that may have loosely similar sections to the view you are tasked to redesign ;

you can use them as inspiration sources in various ways if you feel like it, and if you do, use that wisely after accurate analysis
but use your best judgement, you are not bound by them - only use them as inspiration if it makes sense in regards to making a new design for the view UI`,
				},
				...rag,
			],
		},
		guidance &&
			guidance.ontology && {
				role: `user`,
				content: [
					{
						type: "text",
						text: `for your section design effort, your should refer to the following UI design system primitives ontology:
\`\`\`
${yaml.stringify(guidance.ontology)}
\`\`\`
`,
					},
					guidance.image &&
						(guidance.image?.url?.length ||
							guidance.image?.base64?.length ||
							guidance.image?.local?.length) && {
							type: `image_url`,
							image_url: {
								url: guidance.image.url
									? guidance.image.url
									: guidance.image.base64
										? guidance.image.base64
										: guidance.image.local
											? `data:image/png;base64,${Buffer.from(fs.readFileSync(guidance.image.local)).toString("base64")}`
											: "",
								// detail: `high`,
							},
						},
				].filter((e) => e),
			},
		{
			role: "user",
			content: `you are redesigning the layout for the view id "${view.id}", specified in the following :

\`\`\`view:specifications
${yaml.stringify(_view)}
\`\`\`
`,
		},
		{
			role: "user",
			content: `the main redesign task instructions - the most important part of your task - are specified in the following :

\`\`\`view:redesign-task:instructions
${notes.text}
\`\`\`

important :

> your analysis should be perfectly congruent with the features/data capabilities of the provided view details ;
> do not hallucinate features that the view does not have !
ie. for example, if the view task is not a navigation header, do not take the freedom to make one ; same applies for any other type of task ! things would break ! respect the task and strictly the task !

`,
		},
		{
			role: "user",
			content: `make the analysis and spatial UI layout in SVG format as the genius UI designer you are

> remember, you are designing for a desktop app !
> you are making a new design layout for the viewId : "${view.id}" !

> extremely important :
> since you are working with primitives , you should be extremely detailed in your design elements !
> do not slack in any detail in your analysis
> think very slowly : all the elements that would make for a great UX !

---

> you are only allowed to use the primitiveId s provided in the ontology ! you cannot make a primitiveId up outside of what is provided !
> do not use a primitiveId that is not provided - and exactly as is, not a single character added or changed from the provided primitiveId s
> the "description" fields are important to provide guidance for designers, write extended descriptions in them !

---

extremely important :
> your mockup design should show the elements that are initially visible on the page !!
> do not model transition states or overlays, as such things would overshadow the elements underneath and fuck up the mockup layout render !!

again, extremely important :
> your mockup design should show the elements that are initially visible on the page !!
> do not model transition states or overlays, as such things would overshadow the elements underneath and fuck up the mockup layout render !!

---

important :

> your work is perfectly congruent with the features/data capabilities of the provided view details ;
> do not hallucinate features that the view does not have !

---

> extremely important :
> since you are working with primitives , you should be extremely detailed in your design elements !
> do not slack in any detail in your analysis or design svg implementation
> think very slowly : all the elements that would make for a great UX !

---

> conduct the analysis first, reply with the analysis inside of \`\`\`markdown\`\`\`
> then, answer in a strict SVG reply in \`\`\`svg\`\`\` based on your analysis

you are a genius + you get $9999
`,
		},
	].filter((item) => item);
}
async function designerLayoutv1ViewIterate({ context, data }) {
	const { task, timestamp } = data;
	const { view, iteration } = task;
	const { notes } = iteration;

	// rag , if available
	const ragText =
		`Title : ${view.details.title}\nDescription: ${view.details.extendedDescription}\nRole: ${view.details.role}` +
		`\nDesign: ${notes.text}`;

	let rag = (
		await context.run({
			id: `op:INDEXDB::QUERY`,
			context,
			data: {
				index: "layouts",
				text: ragText,
				amount: 5,
			},
		})
	).results
		.filter((result) => result?.url?.length || result?.base64?.length)
		.map((result) => {
			return {
				type: `image_url`,
				image_url: {
					url: result?.url?.length
						? result.url
						: result?.base64?.length
							? result.base64
							: "",
				},
			};
		});

	// verify,validate rag images sizes
	rag = (
		await Promise.all(
			rag.map(async (item) => {
				const { url } = item.image_url;
				try {
					let buffer;
					if (url.startsWith("data:image/")) {
						// Handle base64 image
						const base64Data = url.split("base64,")[1];
						buffer = Buffer.from(base64Data, "base64");
					} else if (url.startsWith("https://")) {
						// Handle URL image
						const response = await fetch(url);
						if (!response.ok) {
							console.error(`designer:layoutv1:rag : failed to fetch image`);
							return null;
						}
						const arrayBuffer = await response.arrayBuffer();
						buffer = Buffer.from(arrayBuffer);
					} else {
						// Invalid URL format, return null to filter out later
						return null;
					}

					// Check image size
					if (Buffer.byteLength(buffer) > 4.5 * 1024 * 1024) {
						// 4.5 MB in bytes
						console.error(`> skipping : image size exceeds 4.5 MB`);
						return null;
					}

					const metadata = await sharp(buffer).metadata();

					// Check image dimensions
					if (
						metadata.width >= 8000 ||
						metadata.height >= 8000 ||
						metadata.width <= 0 ||
						metadata.height <= 0
					) {
						return null; // Return null if dimensions are invalid
					}
					return item;
				} catch (error) {
					console.error(`> skipping : error processing RAG image`, error);
					return null; // Return null if there's an error
				}
			}),
		)
	)
		.filter((item) => item !== null)
		.slice(0, 3); // fetched more than needed in case size filtered ; typically indexed landing pages dims can be too big

	data.task.rag = rag;

	// design system guidance , if available
	let guidance;
	try {
		guidance = await utils.render.guidance.grid.primitives({
			// determined from process.env in utils/render ... designSystem: designSystem ? designSystem : `presets/protoboy-v1`,
			cache: true,
		}); // -> { ontology , image{base64,url?} }
	} catch (e) {
		console.error(e);
	}
	data.task.guidance = guidance;

	const svgIterateMessages = await promptIterateSvg({ context, data });
	const svgPass = (
		await context.run({
			id: "op:LLM::GEN",
			context: {
				...context, // {streams , project}
				operation: {
					key: `designer.layoutv1.mockup.${view.id}`,
					meta: {
						name: `Designer Mockup { ${view.id} }`,
						desc: "designer/layoutv1 mockup generation",
					},
					cutoff: "```svg",
				},
			},
			data: {
				model: `chatgpt-4o-latest`, //`gpt-4o`,
				messages: svgIterateMessages,
				preparser: false,
				parser: false,
			},
		})
	).generated;

	// raw svg string in response
	let response = await utils.parsers.extract.backticksMultiple({
		text: svgPass,
		delimiters: [`markdown`, `svg`],
	});

	if (!response.svg.length)
		throw new Error("designer:layoutv1:iterate error - generated svg is empty");
	response.svg = response.svg.replaceAll("&", " "); // <---- & char crashes svg

	// validate svg?
	let svg = {};
	try {
		svg = await xml2js.parseStringPromise(response.svg, {
			explicitArray: true,
		});
		// console.dir({ "debug:designer:layoutv1:svg": svg }, { depth: null });
		if (!svg.svg.rect.filter((item) => item.$?.primitiveId).length) {
			console.error(`layout error : generated != task ; skipping`);
		}
	} catch (e) {
		console.error(e);
	}

	let render = {};
	try {
		render = await context.run({
			id: "op:RENDER::LAYOUT",
			context,
			data: {
				svg: { string: response.svg },
				mode: task.type,
			},
		}); // -> { svg , image{base64,url?,local?,buffer?} }
	} catch (e) {
		console.error(e);
	}

	// rely on local storage as loading strategy further down, else might dump base64strings to yaml ...
	if (render.image?.base64) delete render.image.base64;
	if (render.image?.buffer) delete render.image.buffer;

	const generatedLayout = {
		analysis: response.markdown,
		render,
	};

	await Promise.all(
		[`${timestamp}`, `latest`].map(async (version) => {
			await context.run({
				id: "op:PROJECT::STATE:UPDATE",
				context,
				data: {
					operation: {
						id: `webapp:layout:views`,
						refs: {
							id: view.id,
							version,
						},
					},
					type: `end`,
					content: {
						key: `webapp.layout.views.${view.id}.${version}`,
						data: generatedLayout,
					},
				},
			});
		}),
	);

	/*
		should return the RAG object and guidance too, will be used in code ? (not sure)
	*/
	return {
		designer: {
			rag,
			guidance,
		},
		webapp: {
			layout: {
				views: {
					[view.id]: {
						[timestamp]: generatedLayout,
						latest: generatedLayout,
					},
				},
			},
		},
	};
}

export default {
	"DESIGNER:LAYOUTV1::VIEW:GENERATE": designerLayoutv1ViewGenerate,
	"DESIGNER:LAYOUTV1::VIEW:ITERATE": designerLayoutv1ViewIterate,
};
