import { initializeApp, applicationDefault, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
// Initialize Firebase
let db;

try {
	if (process.env.STATE_CLOUD && process.env.FIREBASE_SERVICE_KEY_PATH?.length) {
		initializeApp({
			credential: cert(
				JSON.parse(
					readFileSync(
						path.resolve(process.env.FIREBASE_SERVICE_KEY_PATH || ""),
						"utf8",
					),
				),
			),
		});
	}
} catch (error) {
	console.error({ "utils:firebase": error });
}

try {
	db = getFirestore();
} catch (e) {
	false;
}

// Function to load a collection
async function loadCollection({ path }) {
	const snapshot = await db.collection(path).get();
	return {
		docs: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
	};
}

async function deleteCollection({ path }) {
	const collectionRef = db.collection(path);
	const snapshot = await collectionRef.get();

	const batch = admin.firestore().batch();
	snapshot.docs.forEach((doc) => {
		batch.delete(doc.ref);
	});

	await batch.commit();
}

// Function to load a document
async function loadDocument({ path }) {
	console.dir({ "utils:firebase:doc:get": { path } });
	const doc = await db.doc(path).get();
	if (!doc.exists) {
		throw new Error("Document not found");
	}
	return { id: doc.id, ...doc.data() };
}

// Function to write a new document
async function writeDocument({ path, data }) {
	console.dir({ "utils:firebase:doc:write": { path, data } });
	await db.doc(path).set(data);
}

// Function to update a document
async function updateDocument({ path, data, merge = false }) {
	console.dir({ "utils:firebase:doc:update": { path, data } });
	await db.doc(path).set(data, { merge });
}

// Function to delete a document
async function deleteDocument({ path }) {
	console.dir({ "utils:firebase:doc:delete": { path } });
	await db.doc(path).delete();
}

export default {
	collection: {
		get: loadCollection,
		delete: deleteCollection,
	},
	doc: {
		get: loadDocument,
		write: writeDocument,
		update: updateDocument,
		delete: deleteDocument,
	},
};
