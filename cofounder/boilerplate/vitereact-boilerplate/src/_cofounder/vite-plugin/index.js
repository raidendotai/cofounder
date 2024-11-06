async function editSectionsAndViews({ path, code }) {
	// console.dir({ "_confounder:vite-plugin:editSectionsAndViews": true });
	const genUi = {
		sections: false,
		views: false,
	};
	let newTsx = code
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
		newTsx = `import GenUiSection from '@/_cofounder/genui/genui-section';\n${newTsx}`;
		for (let sectionId of genUi.sections) {
			newTsx = newTsx.replaceAll(
				`<${sectionId}`,
				`<GenUiSection sectionId="${sectionId}"`,
			);
		}
	}

	if (genUi.views) {
		newTsx = `import GenUiView from '@/_cofounder/genui/genui-view';\n${newTsx}`;
		for (let viewId of genUi.views) {
			newTsx = newTsx.replaceAll(`<${viewId}`, `<GenUiView viewId="${viewId}"`);
		}
	}
	// console.dir({ "_confounder:vite-plugin:editSectionsAndViews": { path, newTsx, genUi }, });
	return newTsx;
}

async function editViews({ path, code }) {
	const genUi = {
		views: false,
	};
	let newTsx = code
		.split(`\n`)
		.filter((line) => {
			if (line.includes(`@/components/views/`)) {
				if (!genUi.views) genUi.views = [];
				const viewId = line.split(` `)[1];
				genUi.views = [...new Set([...genUi.views, viewId])];
				return false;
			}
			return true;
		})
		.join(`\n`);
	if (genUi.views) {
		newTsx = `import GenUiView from '@/_cofounder/genui/genui-view';\n${newTsx}`;
		for (let viewId of genUi.views) {
			newTsx = newTsx.replaceAll(`<${viewId}`, `<GenUiView viewId="${viewId}"`);
		}
	}
	// console.dir({ "_confounder:vite-plugin:editViews": { path, newTsx, genUi } });
	return newTsx;
}

async function editSections({ path, code }) {
	const genUi = {
		sections: false,
	};
	let newTsx = code
		.split(`\n`)
		.filter((line) => {
			if (line.includes(`@/components/sections/`)) {
				if (!genUi.sections) genUi.sections = [];
				const sectionId = line.split(` `)[1];
				genUi.sections = [...new Set([...genUi.sections, sectionId])];
				return false;
			}
			return true;
		})
		.join(`\n`);
	if (genUi.sections) {
		newTsx = `import GenUiSection from '@/_cofounder/genui/genui-section';\n${newTsx}`;
		for (let sectionId of genUi.sections) {
			newTsx = newTsx.replaceAll(
				`<${sectionId}`,
				`<GenUiSection sectionId="${sectionId}"`,
			);
		}
	}
	// console.dir({ "_confounder:vite-plugin:editSections": { path, newTsx, genUi } });
	return newTsx;
}

export default {
	pre: async function ({ code, path }) {
		/*
      change logic here :
      App tsx will change to GenUiView
        > GenUiView will call : @/_cofounder/generated/views/
        > @/_cofounder/generated/views/* will call GenUiSection
        > GenUiSection will call @/_cofounder/generated/sections/
    */
		code = code.replaceAll(
			`{COFOUNDER_LOCAL_API_BASE_URL}`,
			`http://localhost:4200/api`,
		);
		if (path.includes(`src/App.tsx`)) {
			return await editSectionsAndViews({ path, code });
		}
		if (
			path.includes(`_cofounder/generated/views`) ||
			path.includes(`_cofounder/generated/sections`)
		) {
			return await editSectionsAndViews({ path, code });
		}
		/*
    if (
      path.includes(`src/App.tsx`)
      || path.includes(`src/components/views/`)
      || path.includes(`src/components/sections/`)
      || path.includes(`@/_cofounder/generated/views/`)
      || path.includes(`@/_cofounder/generated/sections/`)
    ) {
      return await editSectionsAndViews({ path , code });
    }
    */
		return code;
	},
};
