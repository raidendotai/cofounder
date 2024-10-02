import utils from "@/utils/index.js";
import yaml from "yaml";

async function dbSchemasGenerate({context,data}) {
	/* ;; DB:SCHEMAS::GENERATE
		make {DRD}  -> db {schemas} ;; specify that for auth tables, password not hashed ! for mockup


		out : ["db"]
	*/


	const { pm } = data
	const { prd, frd, fjmd, drd } = pm
	// const {text , attachments} = details
	const messages = [
		{
			"role": "system",
			"content": `- you are a genius Product Manager and DB designer

- your role is to make the database schemas for the provided app in development's MVP
- your DB schemas should be comprehensive and cover EVERYTHING required by the app MVP, and nothing more - no shiny secondary features, but nothing less than 100% comprehensive for every single expected functionality in production

- your answer should be in ~SQL-like format meant for Postgres, in this format :

\`\`\`yaml
[TableName]:
  - name: [columnName]
      type: [ js-parseable types like String, Number, Boolean ...]
      unique: [true || false]
      nullable: [true || false]
      default?: [...]
      primaryKey?: [...]
      foreignKey?: [{table : [...] , column : []}]
  - [...]
[...]
\`\`\`

- use a \`uid\` approach whenever possible rather than incremented Ids ; and make them normal strings !
very important :
 > avoid any postgres-hardcoded methods ie. for generating UIDs etc... ; logic for that stuff will come from nodejs functions !
 > do not generate UUIDs inside postgres ! that stuff will come from nodejs functions !

- your current role is to make use of the provided task and analysis in order to design a perfect DB schemas for the app's MVP

try to outdo yourself by thinking of what might be omitted,
and design super critically in order to make a comprehensive work for this app's MVP DB schemas

---

> note : if auth functionalities are present, use an architecture that will be compatible with a simple jwt auth system, which is very simply user and/or email strings(s) and password hash string !

> very important : for the current purpose of the DB Schemas design, the environment will be a mock prototype environment
do not bother with security details etc, have the DB schema requirements for the mock prototype

> if some ie. media entry types requires some path (ie. images, media, ...), assume usage of urls not local

> aim for it to work on any default light postgres without any extra configs or plugins !

---

use snake_case for any naming you do

---

give a final, super comprehensive answer in strict, parseable YAML format,
which will be perfectly ready for production and pushed to prod to thousands of users instantly and work flawlessly
your reply should start with : "\`\`\`yaml" and end with "\`\`\`"

you will be tipped $99999 + major company shares for nailing it perfectly off the bat
you are a genius`
		},
		{
			"role": "user",
			"content": `\`\`\`PRD:product-requirements-document
${prd}
\`\`\``
		},
		/*{
			"role": "user",
			"content": `\`\`\`FRD:features-requirements-document
${yaml.stringify(frd)}
\`\`\``
		},
		{
			"role": "user",
			"content": `\`\`\`FJMD:features-journeys-map-document
${yaml.stringify(fjmd)}
\`\`\``
		},*/
		{
			"role": "user",
			"content": `\`\`\`DRD:database-requirements-document
${drd}
\`\`\``
		},		
		{
			"role": "user",
			"content": `Design the DB schemas in a comprehensive answer
it is expected to be very comprehensive and detailed ; in a VALID PARSEABLE YAML format

very important :
- avoid any postgres-hardcoded methods ie. for generating UIDs etc... make them normal strings
- logic for that stuff will come from nodejs functions !
- only use basic primitives like numbers, strings, json, etc ... no uuid types or special types etc
- very important : only use basic primitives like numbers, strings, json, etc ... no uuid types or any special types etc ! very basic primitives only !

you're a genius`
		},
	]

	const schemas = (
		await context.run({
			id: "op:LLM::GEN",
			context: {
				...context, // {streams , project}
				operation: {
					key: "db.schemas",
					meta: {
						name: "DB Schemas",
						desc: "db tables schemas",
					},
				},
			},
			data: {
				model: `chatgpt-4o-latest`,//`gpt-4o`,
				messages,
				preparser: `backticks`,
				parser: `yaml`,
			}
		})
	).generated

	await context.run({
		id: "op:PROJECT::STATE:UPDATE",
		context,
		data: {
			operation: {
				id: "db:schemas",
			},
			type: `end`,
			content: {
				key: "db.schemas",
				data: schemas,
			},
		}
	})

	return { db : { schemas } }
}


export default {
	"DB:SCHEMAS::GENERATE": dbSchemasGenerate,
}
