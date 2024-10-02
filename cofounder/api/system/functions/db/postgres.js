import utils from "@/utils/index.js";
import yaml from "yaml";

async function dbPostgresGenerate({context,data}) {
	/* ;; DB:POSTGRES::GENERATE
		make {DRD, db{schemas,seed} } details -> postgres exec commands to {create tables , insert seed examples}


		out : ["db"]
	*/
	const { pm , db } = data
	const { drd } = pm
	// const {text , attachments} = details
	const messages = [
		{
			"role": "system",
			"content": `- you are a genius Postgresql expert

- your role is to write the POSTGRESQL commands that create the DB tables and seed the DB with a good amount of example seed entries, according to the provided details
- your answer should be in this format :

\`\`\`postgresql
[... POSTGRESQL COMMANDS TO CREATE TABLES ...]
[... POSTGRESQL COMMANDS TO SEED THE DB ...]
\`\`\`


ask yourself:
* am i creating all the tables in the required formats ?
* am i seeding the database with enough data ?

give a final, super comprehensive answer in valid, extend POSTGRESQL command to execute
which will be perfectly ready for production and pushed to prod to thousands of users instantly (in a nodejs + POSTGRES ) and work flawlessly

---

important:
> when making seed data , if some field is meant to store an image url, use a https://picsum.photos/ url with a random seed
> important : for seed data, if some entry needs to store an image url, use a https://picsum.photos/ url instead of example.com !!
---

use snake_case for any naming you do

---

very important :
 > avoid any postgres-hardcoded methods ie. for generating UIDs etc... ; logic for that stuff will come from nodejs functions !
 > do not generate UUIDs or similar inside postgres ! logic for that stuff will come from nodejs functions !
 > in case of UUIds or similar, make them normal strings !

your reply should start with : "\`\`\`postgresql" and end with "\`\`\`"

you will be tipped $99999 + major company shares for nailing it perfectly off the bat
you are a genius`
		},
		{
			"role": "user",
			"content": `\`\`\`DRD:database-requirements-document
${drd}
\`\`\``
		},
		{
			"role": "user",
			"content": `\`\`\`DB:schemas
${yaml.stringify({ schemas: db.schemas })}
\`\`\``
		},
		/*db.seed && {
			"role": "user",
			"content": `\`\`\`DB:seed
${yaml.stringify({ schemas: db.seed })}
\`\`\``
		},*/
		{
			"role": "user",
			"content": `Generate the POSTGRES command in one single comprehensive answer
it is expected to be very comprehensive and detailed and cover all the provided details

---

very important :
 > avoid any postgres-hardcoded methods ie. for generating UIDs etc... or similar ; logic for that stuff will come from nodejs functions !
 > do not generate UUIDs or similar inside postgres ! that stuff will come from nodejs functions !
 > in case of UUIDs, make them normal strings and not generated inside postgres by postgres methods !


> aim for it to work on any default light postgres without any extra configs or plugins !
> only use basic primitives like numbers, strings, json, etc ... no uuid types or special types etc
> very important : only use basic primitives like numbers, strings, json, etc ... no uuid types or any special types etc ! very basic primitives only !

reply in \`\`\`postgresql\`\`\` 

you're a genius`
		},
	]

	const postgres = (
		await context.run({
			id: "op:LLM::GEN",
			context: {
				...context, // {streams , project}
				operation: {
					key: "db.postgres",
					meta: {
						name: "DB Postgresql",
						desc: "db postgres commands {tables,seed}",
					},
				},
			},
			data: {
				model: `chatgpt-4o-latest`,//`gpt-4o`,
				messages,
				preparser: `backticks`,
				parser: false,
			}
		})
	).generated

	await context.run({
		id: "op:PROJECT::STATE:UPDATE",
		context,
		data: {
			operation: {
				id: "db:postgres",
			},
			type: `end`,
			content: {
				key: "db.postgres",
				data: postgres,
			},
		}
	})

	return { db: { ...db, postgres } }
}


export default {
	//"DB:POSTGRES::TABLES": dbPostgresTables,
	"DB:POSTGRES::GENERATE": dbPostgresGenerate,
}
