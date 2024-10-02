import fs from "fs";
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
	let cutoff_reached = false;
	let chunks_buffer = "";
	let chunks_iterator = 0;
	const chunks_every = 5;
	for await (const chunk of streaming) {
		const content = chunk.choices[0]?.delta?.content || "";
		if (content) {
			text += content;
			chunks_buffer += content;
			chunks_iterator++;
			if (stream?.cutoff) {
				if (!cutoff_reached && text.includes(stream.cutoff)) {
					cutoff_reached = true;
				}
			}
			if (!(chunks_iterator % chunks_every)) {
				stream.write(!cutoff_reached ? chunks_buffer : " ...");
				chunks_buffer = "";
			}
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

async function transcribe({ path }) {
	console.dir({ "debug:utils:openai:transcribe:received": { path } });
	const response = await openai.audio.transcriptions.create({
		file: fs.createReadStream(path),
		model: "whisper-1",
	});
	console.dir({ "debug:utils:openai:transcribe": { path, response } });
	return {
		transcript: response.text,
	};
}

export default {
	inference,
	vectorize,
	transcribe,
};
