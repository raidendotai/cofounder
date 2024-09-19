import utils from "@/utils/index.js";
import yaml from "yaml";

async function swarmFixBackend({ context, data }) {}
async function swarmFixWebapp({ context, data }) {}

export default {
	"SWARM:FIX::BACKEND": swarmFixBackend,
	"SWARM:FIX::WEBAPP": swarmFixWebapp,
};
