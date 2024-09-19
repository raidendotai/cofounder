import { Storage } from "@google-cloud/storage";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

/*
  no signed urls in dev mode here;
*/
let storage;
let bucket;
try {
	if (
		process.env.STATE_CLOUD &&
		process.env.GOOGLECLOUDSTORAGE_SERVICE_KEY_PATH?.length &&
		process.env.GOOGLECLOUDSTORAGE_BUCKET?.length
	) {
		storage = new Storage({
			keyFilename: process.env.GOOGLECLOUDSTORAGE_SERVICE_KEY_PATH,
		});
		bucket = storage.bucket(process.env.GOOGLECLOUDSTORAGE_BUCKET);
	}
} catch (e) {
	console.error(e);
}

const cloudStorage = {
	upload: async ({ path, base64, url, file }) => {
		try {
			console.dir({ "utils:storage:upload": { path } });
			if (base64) {
				const buffer = Buffer.from(base64.split(",")[1], "base64");
				await bucket.file(path).save(buffer, {
					metadata: {
						contentType: base64.split(";base64")[0].split("data:")[1],
					},
				});
			} else if (url) {
				const response = await fetch(url);
				const buffer = await response.buffer();
				await bucket.file(path).save(buffer);
			}
			/*
      const signedUrl = await bucket.file(path).getSignedUrl({
        action: 'read',
        expires: Date.now() + 1000 * 60 * 60 *12, // 12 hrs
      });
      */

			return `https://storage.googleapis.com/${process.env.GOOGLECLOUDSTORAGE_BUCKET}/${path}`;
		} catch (error) {
			console.error("Error uploading to Google Cloud Storage:", error);
			throw new Error("Upload failed");
		}
	},
	/*
  get: {
    signed: async ({ path }) => {
      try {
        const signedUrl = await bucket.file(path).getSignedUrl({
          action: 'read',
          expires: Date.now() + 1000 * 60 * 60 *12, // 12 hrs
        });
        return { url: signedUrl[0] };
      } catch (error) {
        console.error('Error getting signed URL from Google Cloud Storage:', error);
        throw new Error('Failed to get signed URL');
      }
    },
  },
  */
};

export default cloudStorage;
