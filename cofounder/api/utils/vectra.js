import { LocalIndex } from "vectra";

let index;
let indexed; // amount of indexed items
try {
	index = new LocalIndex(`./db/index`);
	if (!(await index.isIndexCreated())) {
		await index.createIndex();
		console.dir({
			"utils/vectra":
				"found no local index ; created temp placeholder in cofounder/api/db/index",
		});
	} else {
		console.dir({ "utils/vectra": "found local index" });
	}
	indexed = (await index.listItems()).length;
	console.log(
		`\x1b[33mutils/vectra :\tindexed items : ${indexed}\n` +
			`[ for advanced layout designer : recommended to use remote index using cofounder.openinterface.ai API key once available ]\x1b[0m`,
	);
} catch (e) {
	// typically no index to query, update on post alpha release
	console.error(`utils/vectra : ${e}`);
	false;
}

async function query({ vector, amount }) {
	try {
		return (await index.queryItems(vector, amount)).map((entry) => {
			return {
				score: entry.score,
				...entry.item.metadata,
			};
		});
	} catch (e) {
		// typically no index to query, update on post alpha release
		console.error(`utils/vectra:query : ${e}`);
		false;
	}
	return [];
}

export default {
	query,
	indexed,
};
