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
	const { project, operation, streams } = context;

	if (operation?.key && streams) {
		await streams.start({
			project,
			key: operation.key,
			meta: operation.meta,
		});
		stream = {
			write: async (data) => {
				streams.write({
					project,
					key: operation.key,
					data,
				});
			},
			cutoff: operation?.cutoff ? operation.cutoff : false,
		};
	}
	if (!stream) stream = process.stdout;

	if (process.env.COFOUNDER_NICKNAME?.length) {
		messages[0].content = `you are : ${process.env.COFOUNDER_NICKNAME}\n${messages[0].content}`;
	}

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

	if (operation && streams) {
		await streams.end({
			project,
			key: operation.key,
		});
	}

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

async function opLlmDebugSimulate({ context, data }) {
	/*
		debug : simulate a stream
	*/
	const { project, operation } = context;

	console.dir(
		{
			opLlmDebugSimulate: { context, data },
		},
		{ depth: null },
	);

	const text_demo = `
# Deleuze & Guattari

Gilles Deleuze (1925-1995) was a French philosopher known for his influential works in metaphysics, aesthetics, and political theory. His ideas have significantly impacted various fields, including literature, film, and art.

## Key Concepts

### Rhizome
Deleuze, along with Félix Guattari, introduced the concept of the **rhizome** in their work *A Thousand Plateaus*. Unlike traditional tree-like structures of knowledge, a rhizome represents a non-hierarchical and interconnected model of thought. It emphasizes multiplicity and the idea that any point can connect to any other point.

### Difference and Repetition
In his book *Difference and Repetition*, Deleuze challenges the notion of identity and sameness. He argues that difference is fundamental to understanding reality, and repetition is not merely a return of the same but a process that produces new meanings.

### Becoming
Deleuze's notion of **becoming** refers to the process of transformation and change. It suggests that identity is not fixed but is always in a state of flux, influenced by various factors and experiences.

## Conclusion
Deleuze's philosophy encourages us to think beyond binary oppositions and embrace complexity. His work continues to inspire contemporary thought and artistic practices, making him a pivotal figure in modern philosophy.
	`;

	await context.streams.start({
		project,
		key: operation.key,
		meta: operation.meta,
	});
	const chunkSize = 20; // Define the size of each chunk
	let currentIndex = 0;

	while (currentIndex < text_demo.length) {
		const data = text_demo.slice(currentIndex, currentIndex + chunkSize); // send chunk by chunk
		context.streams.write({
			project,
			key: operation.key,
			data,
		});
		currentIndex += chunkSize; // Move to the next chunk
		await new Promise((resolve) => setTimeout(resolve, 100)); // Delay chunk by chunk
	}

	await context.streams.end({
		project,
		key: operation.key,
	});

	return {
		generated: text_demo,
		usage: {},
	};
}
export default {
	"op:LLM::GEN": opLlmGen,
	"op:LLM::VECTORIZE": opLlmVectorize,
	"op:LLM::VECTORIZE:CHUNK": opLlmVectorizeChunk,

	"op:LLM::DEBUG:SIMULATE": opLlmDebugSimulate,
};
