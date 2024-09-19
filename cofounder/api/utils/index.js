import parsers from "@/utils/parsers.js";
import openai from "@/utils/openai.js";
import vectra from "@/utils/vectra.js";
import render from "@/utils/render.js";
import firebase from "@/utils/firebase.js";
import storage from "@/utils/storage.js";
import load from "@/utils/load.js";
import anthropic from "@/utils/anthropic.js";

export default {
	parsers,
	openai,
	anthropic,
	vectra,
	render,
	firebase,
	storage,
	load,
};
