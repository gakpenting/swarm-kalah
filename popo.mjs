import axios from "axios";
import fs from "fs";
import path from "path";
import Tar from "tar-js";
function fixUnicodePath(path) {
  const codes = new TextEncoder().encode(path);

  return {
    length: codes.length,
    charCodeAt: (index) => codes[index],
  };
}
function makeTar(data) {
  const tar = new Tar();
  for (const entry of data) {
    const path = fixUnicodePath(entry.path);
    tar.append(path, entry.data);
  }

  return tar.out;
}
async function makeCollectionFromFS(dir) {
  if (typeof dir !== "string") {
    throw new TypeError("dir has to be string!");
  }

  if (dir === "") {
    throw new TypeError("dir must not be empty string!");
  }

  return buildCollectionRelative(dir, "");
}

async function buildCollectionRelative(dir, relativePath) {
  // Handles case when the dir is not existing or it is a file ==> throws an error
  const dirname = path.join(dir, relativePath);
  const entries = await fs.promises.opendir(dirname);
  let collection = [];

  for await (const entry of entries) {
    const fullPath = path.join(dir, relativePath, entry.name);
    const entryPath = path.join(relativePath, entry.name);

    if (entry.isFile()) {
      collection.push({
        path: entryPath,
        data: new Uint8Array(await fs.promises.readFile(fullPath)),
      });
    } else if (entry.isDirectory()) {
      collection = [
        ...(await buildCollectionRelative(dir, entryPath)),
        ...collection,
      ];
    }
  }

  return collection;
}
/**
 * Calculate folder size recursively
 *
 * @param dir the path to the folder to check
 * @returns size in bytes
 */

async function getFolderSize(dir) {
  if (typeof dir !== "string") {
    throw new TypeError("dir has to be string!");
  }

  if (dir === "") {
    throw new TypeError("dir must not be empty string!");
  }

  const entries = await fs.promises.opendir(dir);
  let size = 0;

  for await (const entry of entries) {
    if (entry.isFile()) {
      const stats = await fs.promises.stat(path.join(dir, entry.name));
      size += stats.size;
    } else if (entry.isDirectory()) {
      size += await getFolderSize(path.join(dir, entry.name));
    }
  }

  return size;
}


const gatewayUrl = "https://gateway-proxy-bee-0-0.gateway.ethswarm.org/bzz";

try {
  // console.log(makeCollectionFromFS('./copin'))
  // break
  const UPLOAD_SIZE_LIMIT = 10000000;
  if (getFolderSize("./copin") > UPLOAD_SIZE_LIMIT) {
    throw new Error("FILE SIZE SHOULD BE EQUAL OR LESS THAN 10 MB");
    
  }
  const data = await makeCollectionFromFS("./copin");
  const tarData = makeTar(data);

  const a = await axios.post(gatewayUrl, tarData, {
    headers: {
      accept: "application/json, text/plain, */*",
      "content-type": "application/x-tar",
      "swarm-collection": "true",
      "swarm-index-document": "index.html",
      "swarm-postage-batch-id":
        "0000000000000000000000000000000000000000000000000000000000000000",
    },
  });

  console.log("reference: ", a.data.reference);
  console.log("full url:", gatewayUrl+"/" + a.data.reference);
} catch (e) {
  console.log(e.message);
}
