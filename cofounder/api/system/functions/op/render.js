import utils from "@/utils/index.js";

async function opRenderLayout({ context, data }) {
	/* ;; op:RENDER::LAYOUT
		render either { view , section , block } using utils.render and svg stuff
		in : -> { svg{string``} , mode`view||...` , ...(designSystem,saveFilepath...) }
		out : ["svg","image"]
	*/
	// const { svg , mode } = data // { svg{string``} , mode`view||...` }
	return await utils.render.svg({
		...data,
		// saveFilepath: `./dump/renders/_opRenderLayoutDebug_${data.mode}_${Date.now()}.png`,
	});
}

export default {
	"op:RENDER::LAYOUT": opRenderLayout,
};
