import fetch from "node-fetch";

async function inference({ model, messages, stream = process.stdout }) {
	const response = await fetch("https://api.openrouter.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${process.env.OPENROUTER_TOKEN}`,
		},
		body: JSON.stringify({
			model,
			messages,
			stream: true,
		}),
	});

	if (!response.ok) {
		throw new Error(`OpenRouter API request failed: ${response.statusText}`);
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder("utf-8");
	let text = "";
	let usage = {};
	let cutoff_reached = false;
	let chunks_buffer = "";
	let chunks_iterator = 0;
	const chunks_every = 5;

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		const chunk = decoder.decode(value, { stream: true });
		text += chunk;
		chunks_buffer += chunk;
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

	stream.write(`\n`);

	return {
		text,
		usage: { model, ...usage },
	};
}

export default {
	inference,
};
