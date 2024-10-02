import xml2js from "xml2js";
import fs from "fs";
import path from "path";
import { Resvg } from "@resvg/resvg-js";
import colormap from "colormap";
import sharp from "sharp";
import yaml from "yaml";
import storage from "@/utils/storage.js";
import crypto from "crypto";
import { url } from "inspector";
import dotenv from "dotenv";
dotenv.config();

function _p5map(n, start1, stop1, start2, stop2) {
	// map function from processing / p5js
	return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
}
async function _parse({ svg }) {
	// -> { svg { string`` , } }
	svg.string = svg.string.replaceAll("&", " "); // <---- & char crashes svg
	return {
		string: svg.string,
		structure: await xml2js.parseStringPromise(svg.string, {
			explicitArray: true,
		}),
	};
}
function _build({ svg }) {
	// -> { svg { structure{} } }-> { svg { structure{} , string`` }}
	// https://www.npmjs.com/package/xml2js : builder
	// useful for after making colormaps/annotations and building back to string render
	const builder = new xml2js.Builder();
	return {
		structure: svg.structure,
		string: builder.buildObject(svg.structure),
	};
}

async function _render({
	svg,
	background = `rgba(255,255,255,1)`,
	format = `png`,
	fitTo = false,
	cloud = process.env.STATE_CLOUD
		? JSON.parse(process.env.STATE_CLOUD.toLowerCase())
		: false,
	local = process.env.STATE_LOCAL
		? JSON.parse(process.env.STATE_LOCAL.toLowerCase())
		: true,
}) {
	//console.dir({__debug__render: svg })
	let opts = {
		background,
		/*
    fitTo: {
      mode: 'width',
      value: 1200,
    },
    */
		font: {
			fontFiles: [`./utils/Karla.ttf`], // Load custom fonts.
			loadSystemFonts: false, // It will be faster to disable loading system fonts.
			defaultFontFamily: "Karla", // You can omit this.
		},
	};
	if (fitTo) opts.fitTo = fitTo;

	const resvg = new Resvg(Buffer.from(svg.string), opts);
	const pngData = resvg.render();
	const pngBuffer = pngData.asPng();

	/*
	console.info(
		"> utils.render svg size : ",
		`${pngData.width}x${pngData.height}`,
	);
	*/

	const uid = crypto.randomUUID();

	if (local) {
		// console.dir({ __debug__utils_render_svgAnnotated_saveImage: saveFilepath })
		const outputPath = `./db/storage/dev/render/generated/${uid}.png`;
		const dir = path.dirname(outputPath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		fs.writeFileSync(outputPath, pngBuffer);
	}
	const base64 = `data:image/png;base64,${pngBuffer.toString("base64")}`;
	const url = !cloud
		? false
		: await storage.upload({
				path: `userdata/dev/render/generated/${uid}.png`,
				base64,
			});

	return format === `png`
		? {
				base64,
				buffer: pngBuffer,
				url,
				local: !local ? false : `./db/storage/dev/render/generated/${uid}.png`,
			}
		: false; // later
	/*
    else sharp to move into webp
  */
}

/*
async function _svgView({ svg, highlight = false, saveFilepath = false }) {
	// old way, abandoned
	const { structure } = svg;

	const cmap = colormap({
		colormap: `bluered`,
		nshades: 72,
		format: "hex",
		alpha: 1,
	});
	const processedSvgStructure = {
		svg: {
			$: structure.svg.$,
			g: structure.svg.rect
				.filter((rect) => rect.$.sectionId)
				.map((rect, idx) => {
					const xywh = {
						x: rect.$.x,
						y: rect.$.y,
						width: rect.$.width,
						height: rect.$.height,
					};
					const fillHex = "#bbb"; // cmap[parseInt(_p5map(idx, 0, structure.svg.rect.length, 0, 50))];
					return {
						$: {
							...xywh, // {x,y,w,h,}
						},
						rect: {
							$: {
								...xywh,
								fill: fillHex,
								"fill-opacity": "0.4",
								style: `stroke-width:3;stroke:#000`,
								opacity: "0.4",
							},
						},
						text: {
							$: {
								x: `${parseInt(rect.$.x) + parseInt(rect.$.width) / 2}`,
								y: `${parseInt(rect.$.y) + parseInt(rect.$.height) / 2}`,
								width: parseInt(rect.$.width) / 2,
								height: parseInt(rect.$.height) / 2,
								"dominant-baseline": "middle",
								"text-anchor": "middle",
								"font-size": "16",
								fill: `#000`,
								//fill: fillHex,
								//style: `stroke-width:2;stroke:#000`,
							},
							_: rect.$.sectionId,
						},
					};
				}),
		},
	};
	const svgToRender = _build({ svg: { structure: processedSvgStructure } }); // -> {svg {string,structure}}

	return {
		svg: svgToRender,
		image: await _render({ svg: svgToRender, saveFilepath }),
	};
}
*/

async function _svgDesignerLayout({
	svg,
	designSystem = process.env.DESIGNER_DESIGN_SYSTEM || `presets/protoboy-v1`,
	borders = true,
	saveFilepath = false,
	cloud = process.env.STATE_CLOUD
		? JSON.parse(process.env.STATE_CLOUD.toLowerCase())
		: false,
	local = process.env.STATE_LOCAL
		? JSON.parse(process.env.STATE_LOCAL.toLowerCase())
		: true,
}) {
	// console.dir({"_debug:render:_svgSection" : {svg , designSystem}} , {depth:null})
	const PADDING = 50;

	const { width, height } = svg.structure.svg.$;
	const root = { width, height };
	const parts = svg.structure.svg.rect
		.map((item) => item.$)
		.map((item) => {
			const { x, y, width, height, primitiveId, description } = item;
			return { x, y, width, height, primitiveId, description };
		});
	let maxWidth = 0;
	let maxHeight = 0;
	for (const part of parts) {
		const partRightEdge = parseInt(part.x) + parseInt(part.width);
		const partBottomEdge = parseInt(part.y) + parseInt(part.height);
		if (partRightEdge > maxWidth) {
			maxWidth = partRightEdge;
		}
		if (partBottomEdge > maxHeight) {
			maxHeight = partBottomEdge;
		}
	}
	const WIDTH = maxWidth + PADDING;
	const HEIGHT = maxHeight + PADDING;
	// Create a blank white background image
	let render = sharp({
		create: {
			width: WIDTH,
			height: HEIGHT,
			channels: 4,
			background: { r: 255, g: 255, b: 255, alpha: 1 },
		},
	}).png();
	const compositeOperations = [];

	if (designSystem.startsWith(`presets`)) {
		/* load (cached ?) grid */
		const rootDir = `./system/presets/ui/design/systems/${designSystem.split("/")[1].trim()}/primitives`;
		const rendersDir = `${rootDir}/renders`;
		const ontologyFilepath = `${rootDir}/ontology.yaml`;
		let ontology = {};
		yaml
			.parse(fs.readFileSync(ontologyFilepath, `utf-8`).toString())
			.primitives.map((primitive) => {
				ontology[primitive.id] = primitive;
			});
		// Process each part
		for (const part of parts) {
			const { primitiveId, x, y, width, height } = part;
			const imagePath = path.join(rendersDir, `${primitiveId}.png`);
			if (!fs.existsSync(imagePath)) {
				continue;
			}
			// Load the image

			const image = await sharp(imagePath)
				.resize(parseInt(width), parseInt(height), {
					// fit: 'fill',
					fit: ontology[primitiveId].stretch ? `fill` : `contain`,
					position: `left top`,
					background: { r: 0, g: 0, b: 0, alpha: 0 },
				}) // or contain , but should be aligned properly
				.toBuffer();

			// Create a bordered image with a small black outline
			const borderedImage = await sharp(image)
				.extend({
					top: 1,
					bottom: 1,
					left: 1,
					right: 1,
					background: {
						r: 0,
						g: 0,
						b: 0,
						alpha: borders ? 0.1 : 0,
					},
				})
				.toBuffer();

			// Add the composite operation to the array
			compositeOperations.push({
				input: borderedImage,
				left: parseInt(x),
				top: parseInt(y),
			});
		}

		// Apply all composite operations at once
		render = render.composite(compositeOperations);

		const renderBuffer = await render.toBuffer();
		if (saveFilepath) {
			await render.toFile(saveFilepath);
		}
		const uid = crypto.randomUUID();
		if (local) {
			// console.dir({ __debug__utils_render_svgAnnotated_saveImage: saveFilepath })
			const outputPath = `./db/storage/dev/render/generated/${uid}.png`;
			const dir = path.dirname(outputPath);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}
			fs.writeFileSync(outputPath, renderBuffer);
		}
		const base64 = `data:image/png;base64,${renderBuffer.toString("base64")}`;
		const url = !cloud
			? false
			: await storage.upload({
					path: `userdata/dev/render/generated/${uid}.png`,
					base64,
				});

		return {
			svg,
			image: {
				base64: `data:image/png;base64,${renderBuffer.toString("base64")}`,
				url,
				local: !local ? false : `./db/storage/dev/render/generated/${uid}.png`,
			},
		};
	}
}

async function svgProcess(query) {
	const { svg } = query;
	const parsedSvg = await _parse({ svg }); // -> { structure , string }
	return await _svgDesignerLayout({ ...query, svg: parsedSvg });
}

async function guidanceGridPrimitives({
	designSystem = process.env.DESIGNER_DESIGN_SYSTEM || `presets/protoboy-v1`,
	cache = true,
}) {
	if (designSystem.startsWith(`presets`)) {
		/* load (cached ?) grid */
		const root = `./system/presets/ui/design/systems/${designSystem.split("/")[1].trim()}/primitives`;
		const ontologyFilepath = `${root}/ontology.yaml`;
		const gridRenderFilepath = `${root}/grid.png`;
		const rendersDir = `${root}/renders`;
		const docsDir = `${root}/docs`;
		const ontology = yaml.parse(
			fs.readFileSync(ontologyFilepath, `utf-8`).toString(),
		);
		const _ontologyIds = ontology.primitives.map((e) => e.id);
		const docs = { primitives: {} };
		fs
			.readdirSync(docsDir)
			.filter((filename) => /\.(mdx)$/i.test(filename))
			.filter((filename) =>
				_ontologyIds.includes(filename.split(`.`).slice(0, -1).join(`.`)),
			)
			//.filter(filename=>filename)
			.map((filename) => {
				const id = filename.split(`.`).slice(0, -1).join(`.`);
				docs.primitives[id] = fs
					.readFileSync(`${docsDir}/${filename}`, `utf-8`)
					.toString();
			});

		if (
			cache &&
			fs.existsSync(ontologyFilepath) &&
			fs.existsSync(gridRenderFilepath)
		) {
			console.dir({ "utils:render:guidanceGridPrimitives": { cache: true } });
			const buffer = await sharp(gridRenderFilepath).toBuffer();
			const base64 = `data:image/png;base64,${buffer.toString("base64")}`;
			return {
				ontology: ontology,
				docs,
				image: {
					base64,
					url: false,
				},
			};
		}

		const ontologyIdsFilepathsDict = {};
		const ontologyIds = fs
			.readdirSync(rendersDir)
			.filter((filename) => /\.(png|jpe?g|webp)$/i.test(filename))
			.filter((filename) =>
				_ontologyIds.includes(filename.split(`.`).slice(0, -1).join(`.`)),
			)
			//.filter(filename=>filename)
			.map((filename) => {
				const id = filename.split(`.`).slice(0, -1).join(`.`);
				ontologyIdsFilepathsDict[id] = `${rendersDir}/${filename}`;
				return id;
			});
		/*
        much better approach would be to build one single big svg with texts and grid lines using 1:1 rect with stroke 
  <svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000">
    <g x="0" y="0" width="500" height="500">
      <rect x="0" y="0" width="500" height="500" fill="white" style="stroke-width:5;stroke:#000" ></rect>
      <rect x="0" y="0" width="450" height="60" fill="yellow" style="stroke-width:5;stroke:#000"></rect>
      <text  x="10" y="10" width="500" height="500" font-size="22" fill="black" text-anchor="start" dominant-baseline="hanging">button_floatingActionButton</text>
    </g>

    <g x="500" y="0" width="500" height="500" >
      <rect x="500" y="0" width="500" height="500" fill="white"  style="stroke-width:5;stroke:#000" ></rect>
      <rect x="500" y="0" width="450" height="60" fill="yellow" style="stroke-width:5;stroke:#000"></rect>
      <text  x="510" y="10" width="500" height="500" font-size="22" fill="black" text-anchor="start" dominant-baseline="hanging">button_floatingActionButton</text>
    </g>
  </svg>
      */

		const ontologyIdsWithoutNonprimitive = ontologyIds.filter(
			(e) => e != "nonprimitive",
		);
		const GRID_COLUMNS = 6;
		const GRID_ROWS = Math.ceil(
			ontologyIdsWithoutNonprimitive.length / GRID_COLUMNS,
		);
		const CELL_SIZE = 400;

		let cellIdx = -1;
		const gBlocks = [];
		let compositeOperations = [];

		for (let rowIdx of [...Array(GRID_ROWS).keys()]) {
			for (let colIdx of [...Array(GRID_COLUMNS).keys()]) {
				cellIdx++;
				if (cellIdx >= ontologyIdsWithoutNonprimitive.length) break;
				const id = ontologyIdsWithoutNonprimitive[cellIdx];
				const x = colIdx * CELL_SIZE;
				const y = rowIdx * CELL_SIZE;
				gBlocks.push(`<g x="${x}" y="${y}" width="500" height="500">
    <rect x="${x}" y="${y}" width="${CELL_SIZE}" height="${CELL_SIZE}" fill="white" style="stroke-width:5;stroke:#000" ></rect>
    <rect x="${x}" y="${y}" width="${CELL_SIZE - 50}" height="50" fill="yellow" style="stroke-width:5;stroke:#000"></rect>
    <text  x="${x + 10}" y="${y + 10}" width="${CELL_SIZE}" height="${CELL_SIZE}" font-size="23" fill="black" text-anchor="start" dominant-baseline="hanging">${id}</text>
  </g>`);
				// make renders composite operation
				const imagePath = ontologyIdsFilepathsDict[id];
				const image = await sharp(imagePath)
					.resize(parseInt(CELL_SIZE * 0.75), parseInt(CELL_SIZE * 0.75), {
						// fit: 'fill',
						fit: `contain`,
						// position: `left top`,
						background: { r: 0, g: 0, b: 0, alpha: 0 },
					}) // or contain , but should be aligned properly
					.toBuffer();
				// Create a bordered image with a small black outline
				const borderedImage = await sharp(image)
					.extend({
						top: 1,
						bottom: 1,
						left: 1,
						right: 1,
						background: { r: 0, g: 0, b: 0, alpha: 0 }, // alpha: 1 ; for border
					})
					.toBuffer();

				// Add the composite operation to the array
				compositeOperations.push({
					input: borderedImage,
					left: parseInt(x + CELL_SIZE * 0.125),
					top: parseInt(y + CELL_SIZE * 0.175),
				});
			}
		}
		const templateSvgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${CELL_SIZE * GRID_COLUMNS}" height="${CELL_SIZE * GRID_ROWS}">
  ${gBlocks.join(`\n`)}
  </svg>`;
		const { buffer } = await _render({
			svg: { string: templateSvgString },
			background: `rgba(255,255,255,1)`,
			// saveFilepath: `./dump/_svg_textglyphrender.png`,
		});

		const render = await sharp(buffer).composite(compositeOperations);
		const renderBuffer = await render.toBuffer();
		if (!cache || !fs.existsSync(gridRenderFilepath)) {
			await render.toFile(gridRenderFilepath);
		}
		return {
			ontology: {
				primitives: ontology.primitives.filter((item) =>
					ontologyIds.includes(item.id),
				),
			},
			docs,
			image: {
				base64: `data:image/png;base64,${renderBuffer.toString("base64")}`,
				url: false,
			},
		};
	}
}

export default {
	svg: svgProcess,
	guidance: {
		grid: {
			primitives: guidanceGridPrimitives,
		},
	},
};
