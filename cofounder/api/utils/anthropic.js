import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
dotenv.config();
const anthropic = new Anthropic();

async function _convertFromOpenaiFormat({ messages }) {
	const newMessages = (
		await Promise.all(
			messages.slice(1).map(async (m) => {
				if (typeof m.content === "string") {
					return [{ type: "text", text: m.content }];
				}
				return (
					await Promise.all(
						m.content.map(async (item) => {
							if (item.type === "text") return item;
							const { url } = item.image_url;
							if (url.includes(";base64,")) {
								return {
									type: "image",
									source: {
										type: "base64",
										media_type: url.split(";base64,")[0].split("data:")[1],
										data: url.split(";base64,")[1],
									},
								};
							}
							if (url.includes("http")) {
								const response = await fetch(url);
								const buffer = await response.arrayBuffer();
								const base64String = Buffer.from(buffer).toString("base64");
								const mediaType = response.headers.get("content-type");
								return {
									type: "image",
									source: {
										type: "base64",
										media_type: mediaType,
										data: base64String,
									},
								};
							}
							return false;
							// else fetch url and convert
						}),
					)
				).filter((e) => e);
			}),
		)
	)
		.filter((e) => e)
		.flat();

	return {
		system: messages[0].content,
		messages: [
			{
				role: `user`,
				content: newMessages,
			},
		],
	};
}

async function inference({
	model = "claude-3-5-sonnet-20240620",
	messages,
	stream = process.stdout,
}) {
	// messages are in openai format , need conversion
	const converted = await _convertFromOpenaiFormat({ messages });
	// console.dir({ "debug:utils:anthropic": {messages : converted.messages} } , {depth:null})

	const _model = model.includes("gpt") ? "claude-3-5-sonnet-20240620" : model;
	const streaming = await anthropic.messages.create({
		model: _model,
		stream: true,
		system: converted.system,
		max_tokens: 8192,
		messages: converted.messages,
	});

	let text = "";
	let usage = {};
	let cutoff_reached = false;
	let chunks_buffer = "";
	let chunks_iterator = 0;
	const chunks_every = 5;
	for await (const event of streaming) {
		if (
			event.type === "content_block_delta" &&
			event.delta.type === "text_delta"
		) {
			const content = event.delta.text;
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
		}
	}
	stream.write("\n");

	return {
		text,
		usage: { model: _model, ...usage },
	};
}

export default {
	inference,
};
