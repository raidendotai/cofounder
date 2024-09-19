import yaml from "yaml";

async function extractBackticks({ text }) {
	try {
		const lines = text.split("\n");
		const firstLineWithBackticksIndex = lines.findIndex((line) =>
			line.includes("```"),
		);
		const lastBackticksIndex =
			lines.length -
			1 -
			lines
				.slice()
				.reverse()
				.findIndex((line) => line.includes("```"));
		if (
			firstLineWithBackticksIndex === -1 ||
			lastBackticksIndex === -1 ||
			lastBackticksIndex <= firstLineWithBackticksIndex
		) {
			throw new Error("> invalid : no backticks found");
		}
		const extractedContent = lines
			.slice(firstLineWithBackticksIndex + 1, lastBackticksIndex)
			.join("\n")
			.trim();
		return { text: extractedContent };
	} catch (error) {
		console.error("utils/parsers:extractAndParse:error", error);
		return null;
	}
}
async function extractBackticksMultiple({ text, delimiters }) {
	try {
		let found = {};
		let cursor = 0;
		const lines = text.split("\n");
		for (let delim of delimiters) {
			const firstLine = lines
				.slice(cursor)
				.findIndex((line) => line.includes(`\`\`\`${delim}`));
			const textFromFirstLine = lines.slice(cursor).slice(firstLine);
			const lastLine = textFromFirstLine
				.slice(1)
				.findIndex((line) => line.includes("```"));
			// console.dir({ __debug__utils_parsers_backticksmultiple: `\`\`\`${delim}`, textFromFirstLine, lastLine })
			found[delim] = textFromFirstLine.slice(1, lastLine + 1).join(`\n`);
			cursor = lastLine - 1;
		}
		return found;
	} catch (error) {
		console.error("utils/parsers:extractAndParse:error", error);
		return null;
	}
}

async function parseYaml({ generated, query }) {
	const { text } = generated;
	return yaml.parse(text);
}

async function editGenUi({ tsx }) {
	// replace with p0 frontend editing blocks
	// (handles iterating on components in live view , and functionalities like screenshot passed into api etc ...)
	const genUi = {
		sections: false,
		views: false,
	};
	let newTsx = tsx
		.split(`\n`)
		.filter((line) => {
			if (line.includes(`@/components/sections/`)) {
				if (!genUi.sections) genUi.sections = [];
				const sectionId = line.split(` `)[1];
				genUi.sections = [...new Set([...genUi.sections, sectionId])];
				return false;
			}
			if (line.includes(`@/components/views/`)) {
				if (!genUi.views) genUi.views = [];
				const viewId = line.split(` `)[1];
				genUi.views = [...new Set([...genUi.views, viewId])];
				return false;
			}
			return true;
		})
		.join(`\n`);
	if (genUi.sections) {
		newTsx = `import GenUiSection from '@/p0/genui/GenUiSection';\n${newTsx}`;
		for (let sectionId of genUi.sections) {
			newTsx = newTsx.replaceAll(
				`<${sectionId}`,
				`<GenUiSection id="${sectionId}"`,
			);
		}
	}
	if (genUi.views) {
		newTsx = `import GenUiView from '@/p0/genui/GenUiView';\n${newTsx}`;
		for (let viewId of genUi.views) {
			newTsx = newTsx.replaceAll(`<${viewId}`, `<GenUiView id="${viewId}"`);
		}
	}
	return { tsx, ids: genUi };
}

async function extractCodeDecorators({ code }) {
	// swarm decorators from generated code to trigger swarm functions
	const { pre, post } = { pre: 5, post: 15 };
	const decorators = [];
	const lines = code.split("\n");

	lines.forEach((line, index) => {
		const decoratorMatch = line.match(/@need:([^:]+):(.+)/);
		if (decoratorMatch) {
			const type = decoratorMatch[1].trim();
			const description = decoratorMatch[2].trim();

			// Extract snippet with padding
			const startLine = Math.max(0, index - pre);
			const endLine = Math.min(lines.length, index + post + 1);
			const snippet =
				"{/*...*/}\n" + lines.slice(startLine, endLine).join("\n") + "\n{/*...*/}";

			decorators.push({
				type,
				description,
				snippet,
			});
		}
	});

	return decorators;
}
export default {
	extract: {
		backticks: extractBackticks,
		backticksMultiple: extractBackticksMultiple,
		decorators: extractCodeDecorators,
	},
	parse: {
		yaml: parseYaml,
	},
	edit: {
		genUi: editGenUi,
	},
};
