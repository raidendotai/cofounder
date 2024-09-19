import utils from "@/utils/index.js";
import dotenv from "dotenv";
dotenv.config();

async function opLlmGen({ context, data }) {
	/* ;; op:LLM::GEN
		{model,messages,preparser,parser,...} -> { response , tokens (consumption) }

		in : ["model","messages","preparser","parser","query","stream"]
		out : ["generated","usage"]
	*/
	/*
		formats ;;
			preparser : async ({text}) -> generated
			parser : async ({generated,query})
	*/

	let { model, messages, preparser, parser, validate, query, stream } = data;

	if (!stream) stream = process.stdout;
	if (!preparser) {
		preparser = async ({ text }) => {
			return { text };
		};
	} else if (preparser === `backticks`) {
		preparser = utils.parsers.extract.backticks; // most likely to be used
	}

	if (!parser) {
		parser = async ({ generated, query }) => {
			return generated.text;
		};
	} else if (parser === `yaml`) {
		parser = utils.parsers.parse.yaml;
	}

	const llm_fn = !process.env.LLM_PROVIDER
		? utils.openai.inference
		: process.env.LLM_PROVIDER.toLowerCase() === "openai"
			? utils.openai.inference
			: utils.anthropic.inference;

	const { text, usage } = await llm_fn({
		model: model,
		messages,
		stream,
	});

	const generated_pre = await preparser({ text }); // -> typically { text : "... extracted text ..." }
	const generated_post = await parser({
		generated: generated_pre,
		query,
	});

	if (validate) {
		try {
			await validate({ generated: generated_post });
		} catch (e) {
			console.dir({ "op:LLM::GEN error": e });
			throw new Error(e);
		}
	}

	return {
		generated: generated_post,
		usage,
	};
}

function chunkify(array, chunkSize) {
	const chunks = [];
	for (let i = 0; i < array.length; i += chunkSize) {
		chunks.push(array.slice(i, i + chunkSize));
	}
	return chunks;
}

async function opLlmVectorizeChunk({ context, data }) {
	/* ;; op:LLM::VECTORIZE:CHUNK
		{texts} -> {vectors,usage}
		chunk processor (batches of 20)
		queue concurrency/lims defined for this one
	*/
	const { texts } = data;
	return await utils.openai.vectorize({
		texts,
	});
}
async function opLlmVectorize({ context, data }) {
	/* ;; op:LLM::VECTORIZE
		{texts} -> {vectors,usage}

		chunkify, process, flatten, return
	*/
	const { texts } = data;
	const chunks = chunkify(texts, 20);
	let usageAll = { prompt_tokens: 0, total_tokens: 0 };
	const vectorsAll = (
		await Promise.all(
			chunks.map(async (chunk) => {
				const { vectors, usage } = await context.run({
					id: `op:LLM::VECTORIZE:CHUNK`,
					context,
					data: { texts: chunk },
				});
				usageAll.prompt_tokens += usage.prompt_tokens;
				usageAll.total_tokens += usage.total_tokens;
				return vectors;
			}),
		)
	).flat();
	return {
		vectors: vectorsAll,
		usage: usageAll,
	};
}

export default {
	"op:LLM::GEN": opLlmGen,
	"op:LLM::VECTORIZE": opLlmVectorize,
	"op:LLM::VECTORIZE:CHUNK": opLlmVectorizeChunk,
};
