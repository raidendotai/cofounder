
![cofounder-og-black](https://github.com/user-attachments/assets/b4e51f02-59e4-4540-ac14-e1f40e20a658)

# Cofounder | Early alpha release

* project - [cofounder.openinterface.ai](https://cofounder.openinterface.ai)
* 👋 [@n_raidenai](https://x.com/n_raidenai)

**cofounder**
- full stack generative web apps ; backend + db + stateful web apps
- gen ui rooted in app architecture, with ai-guided mockup designer & modular design systems



https://github.com/user-attachments/assets/cfd09250-d21e-49fc-a29b-fa0c661abfc0

https://github.com/user-attachments/assets/c055f9c4-6bc0-4b11-ba8f-cc9f149387fa




---

## Important

**Early alpha release ; earlier than expected by 5/6 weeks**

Still not merged with key target features of the project, notably :
- project iteration modules for all dimensions of generated projects
- admin interface for event streams and (deeper) project iterations
- integrate the full genUI plugin :
  * generative design systems
  * deploy finetuned models & serve from api.cofounder
- local, browser-based dev env for the entire project scope
- add { react-native , flutter , other web frameworks }
- validations & swarm code review and autofix
- code optimization
- [...]

be patient :)

---

# Usage

## Install & Init

* Open your terminal and run

```sh
npx @openinterface/cofounder
```

Follow the instructions. The installer 
- will ask you for your keys
- setup dirs & start installs
- will start the local `cofounder/api` builder and server
- will open the web dashboard where you can create new projects (at `http://localhost:667` ) 🎉

```
note :
you will be asked for a cofounder.openinterface.ai key
it is recommended to use one as it enables the designer/layoutv1 and swarm/external-apis features
and can be used without limits during the current early alpha period

the full index will be available for local download on v1 release
```

```sh
# alternatively, you can make a new project without going through the dashboard
# by runing :
npx @openinterface/cofounder -p "YourAppProjectName" -d "describe your app here" -a "(optional) design instructions"
```


## Run Generated Apps

- Your backend & vite+react web app will incrementally generate inside `./apps/{YourApp}`
Open your terminal in `./apps/{YourApp}` and run

```sh
npm i && npm run dev
```

It will start both the backend and vite+react, concurrently, after installing their dependencies
Go to `http://localhost:5173/` to open the web app 🎉


- From within the generated apps , you can use ⌘+K / Ctrl+K to iterate on UI components

[more details later]

## Notes

### Dashboard & Local API

If you resume later and would like to iterate on your generated apps,
the local `./cofounder/api` server needs to be running to receive queries

You can (re)start the `local cofounder API` running the following command from `./cofounder/api`

```sh
npm run start
```

The dashboard will open in `http://localhost:667`


- note: You can also generate new apps from the same env, without the the dashboard, by running, from `./cofounder/api`, one of these commands
    
    ```sh
    npm run start -- -p "ProjectName" -f "some app description" -a "minimalist and spacious , light theme"
    npm run start -- -p "ProjectName" -f "./example_description.txt" -a "minimalist and spacious , light theme"
    ```

### Concurrency

**[the architecture will be further detailed and documented later]**

Every "node" in the `cofounder` architecture has a defined configuration under `./cofounder/api/system/structure/nodes/{category}/{name}.yaml` to handle things like concurrency, retries and limits per time interval

For example, if you want multiple LLM generations to run in parallel (when possible - sequences and parallels are defined in DAGS under `./cofounder/api/system/structure/sequences/{definition}.yaml` ),
go to

```yaml
#./cofounder/api/system/structure/nodes/op/llm.yaml
nodes:
 op:LLM::GEN:
  desc: "..."
  in: [model, messages, preparser, parser, query, stream]
  out: [generated, usage]
  queue:
   concurrency: 1 # <------------------------------- here 
 op:LLM::VECTORIZE:
  desc: "{texts} -> {vectors}"
  in: [texts]
  out: [vectors, usage]
 mapreduce: true
 op:LLM::VECTORIZE:CHUNK:
  desc: "{texts} -> {vectors}"
  in: [texts]
  out: [vectors, usage]
  queue:
   concurrency: 50
```

and change the `op:LLM::GEN` parameter `concurrency` to a higher value

The default LLM concurrency is set to `2` so you can see what's happening in your console streams step by step - but you can increment it depending on your api keys limits

---

# Docs, Design Systems, ...

**[WIP]**

---

# Architecture

[more details later]

archi/v1 is as follows :

![architecture](https://github.com/user-attachments/assets/b2d8b70e-7a6d-45c9-a706-0cf955d13451)


---

# Credits

- Demo design systems built using Figma renders / UI kits from:
  * blocks.pm by Hexa Plugin (see `cofounder/api/system/presets`)
  * google material
  * figma core
  * shadcn
- Dashboard node-based ui powered by [react flow](https://reactflow.dev/)
