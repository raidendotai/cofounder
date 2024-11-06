---
sidebar_position: 2
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
- will open the web dashboard where you can create new projects (at `http://localhost:4200` ) 🎉

```
note :
you will be asked for a cofounder.openinterface.ai key
it is recommended to use one as it enables the designer/layoutv1 and swarm/external-apis features
and can be used without limits during the current early alpha period

the full index will be available for local download on v1 release
```

- currently using `node v22` for the whole project. 



```sh
# alternatively, you can make a new project without going through the dashboard
# by runing :
npx @openinterface/cofounder -p "YourAppProjectName" -d "describe your app here" -a "(optional) design instructions"
```

