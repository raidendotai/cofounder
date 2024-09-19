import utils from "@/utils/index.js";
import yaml from "yaml";
import dotenv from "dotenv";
dotenv.config();

/*
  should check process.env.SWARM_ENABLE
*/

async function swarmReviewServerMain({ context, data }) {}
async function swarmReviewWebappStore({ context, data }) {}
async function swarmReviewWebappRoot({ context, data }) {}
async function swarmReviewWebappView({ context, data }) {}

export default {
	"SWARM:REVIEW::SERVER:MAIN": swarmReviewServerMain,
	"SWARM:REVIEW::WEBAPP:STORE": swarmReviewWebappStore,
	"SWARM:REVIEW::WEBAPP:ROOT": swarmReviewWebappRoot,
	"SWARM:REVIEW::WEBAPP:VIEW": swarmReviewWebappView,
};
