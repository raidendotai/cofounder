import fs from "fs";
import OpenAI from "openai";
import dotenv from "dotenv";
import fetch from 'node-fetch';


dotenv.config();

const loggingFetch = async (url, options) => {
	console.log("请求的 URL:", url);
	console.log("请求选项:", options);
	const bodyContent = JSON.parse(options.body);
	console.log("请求体内容:", bodyContent);
	return fetch(url, options);
  };
  
let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
	fetch: loggingFetch,

  });
} catch (e) {
  console.error("utils:openai : " + e);
}

console.log(process.env.OPENAI_API_KEY)
console.log(process.env.BASE_URL)
console.log(process.env.INFERENCE_MODEL)
async function inference({
//   model = process.env.INFERENCE_MODEL || "gpt-4o-mini",
model = "gpt-3.5-turbo",
  messages,
  stream = process.stdout,
}) {

  const streaming = await openai.chat.completions.create({
    model,
    messages,
    stream: true,
    stream_options: { include_usage: true },
  });

  console.log(streaming)

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
  model = process.env.EMBEDDING_MODEL || "text-embedding-3-small",
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

async function transcribe({
  path,
  model = process.env.TRANSCRIPTION_MODEL || "whisper-1",
}) {
  console.dir({ "debug:utils:openai:transcribe:received": { path } });
  const response = await openai.audio.transcriptions.create({
    file: fs.createReadStream(path),
    model,
  });
  console.dir({
    "debug:utils:openai:transcribe": { path, response },
  });
  return {
    transcript: response.text,
  };
}

export default {
  inference,
  vectorize,
  transcribe,
};