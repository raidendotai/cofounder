---
sidebar_position: 4
---

# Run Generated Apps

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

The dashboard will open in `http://localhost:4200`


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
