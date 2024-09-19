import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

let openai;
try {
	openai = new OpenAI({
		apiKey: process.env.OPENAI_API_KEY,
	});
} catch (e) {
	console.error("utils:openai : " + e);
}

async function inference({
	model = `gpt-4o-mini`,
	messages,
	stream = process.stdout,
}) {
	const streaming = await openai.chat.completions.create({
		model,
		messages,
		stream: true,
		stream_options: { include_usage: true },
	});
	let text = "";
	let usage = {};
	for await (const chunk of streaming) {
		const content = chunk.choices[0]?.delta?.content || "";
		if (content) {
			stream.write(content);
			text += content;
		}
		if (chunk.usage) usage = { ...chunk.usage };
	}
	stream.write(`\n`);
	return {
		text,
		usage: { model, ...usage },
	};
}
async function vectorize({
	texts,
	model = process.env.EMBEDDING_MODEL || `text-embedding-3-small`,
}) {
	const response = await openai.embeddings.create({
		model,
		input: texts,
		encoding_format: "float",
	});
	return {
		vectors: response.data
			.sort((a, b) => a.index - b.index)
			.map((e) => e.embedding),
		usage: { model, ...response.usage },
	};
}

export default {
	inference,
	vectorize,
};
