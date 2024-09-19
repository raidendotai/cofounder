import utils from "@/utils/index.js";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

async function opIndexdbQuery({ context, data }) {
	/* ;; op:INDEXDB::QUERY
    query from vector db ; currently one local index, later more indices, from url

    in: {text,vector,amount} // either text or vector
    out: {results}
  */
	/*
		add .env RAG_REMOTE_ENABLE = TRUE
		later retest for local, esp when empty
 */
	const { index, text, vector, amount } = data;
	let results = [];
	if (
		process.env.RAG_REMOTE_ENABLE &&
		JSON.parse(process.env.RAG_REMOTE_ENABLE.toLowerCase()) &&
		process.env.COFOUNDER_API_KEY?.length &&
		process.env.COFOUNDER_API_KEY != "REPLACE_WITH_COFOUNDER.OPENINTERFACE.AI_KEY"
	) {
		try {
			const response = await axios.post(
				`https://api.openinterface.ai/cofounder/alpha/dev/rag/${index}`,
				{
					vector: vector
						? vector
						: (
								await context.run({
									id: `op:LLM::VECTORIZE`,
									context,
									data: {
										texts: [text],
									},
								})
							).vectors[0],
					amount,
				},
				{
					headers: {
						Authorization: `Bearer ${process.env.COFOUNDER_API_KEY}`,
					},
					timeout: 30000, // 30 seconds timeout
				},
			);
			return response.data;
		} catch (error) {
			console.error(error);
			return { results: [] };
		}
	}
	try {
		// to avoid vectorizing for nothing
		if (!utils.vectra.indexed) return { results: [] };
		return {
			results: await utils.vectra.query({
				vector: vector
					? vector
					: (
							await context.run({
								id: `op:LLM::VECTORIZE`,
								context,
								data: {
									texts: [text],
								},
							})
						).vectors[0],
				amount,
			}),
		};
	} catch (e) {
		false;
	}
	return { results: [] };
}
export default {
	"op:INDEXDB::QUERY": opIndexdbQuery,
};
