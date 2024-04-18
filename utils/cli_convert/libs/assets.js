const fs = require('fs');
const { readFile, makeDirectory, writeFile } = require('../../helper');
const path = require('path');
const chunkSize = 1048576; // 1 mb ->bytes
const uuid = require('uuid');
const config = require('../../../config');

let readPath = path.join(process.cwd(), config.data);

let writePath = path.join(process.cwd(), config.data);
writeFile(path.join(writePath, 'export-info.json'), {
  contentVersion: 2,
  logsPath: writePath,
});

const createMetaData = async (assetData) => {
  const assetValues = Object.values(assetData);
  const data = assetValues.map((item) => {
    return {
      uid: item.uid,
      url: item.url,
      filename: item.filename,
    };
  });
  await writeFile(path.join(writePath, 'assets', 'metadata.json'), data);
};

const makeChunks = async (assetData) => {
  let currentChunkSize = 0;
  let currentChunkId = uuid.v4();
  let chunks = {};
  for (
    let currentAssetId = 0;
    currentAssetId < Object.keys(assetData).length;
    currentAssetId += 1
  ) {
    let curAssetKey = Object.keys(assetData)[currentAssetId];

    let tempObj = {};
    tempObj[assetData[curAssetKey].uid] = assetData[curAssetKey];
    chunks[currentChunkId] = { ...chunks[currentChunkId], ...tempObj };

    currentChunkSize = Buffer.byteLength(
      JSON.stringify(chunks[currentChunkId]),
      'utf8'
    );

    if (currentChunkSize > chunkSize) {
      currentChunkId = uuid.v4();
      currentChunkSize = 0;
      let tempObj = {};
      // tempObj[assetData[curAssetKey].uid] = assetData[curAssetKey];
      chunks[currentChunkId] = tempObj;
    }
  }

  return chunks;
};

const moveAssets = async (folderNames) => {
  let assetPath = path.join(writePath, 'assets', 'files');
  if (!fs.existsSync(assetPath)) {
    makeDirectory(assetPath);
  }

  for (let i = 0; i < folderNames.length; i++) {
    let sourcePath = path.join(readPath, 'assets', folderNames[i]);
    let destinationPath = path.join(assetPath, folderNames[i]);
    fs.rename(sourcePath, destinationPath, (err) => {
      if (err) {
        console.error(`Error moving folder: ${err.message}`);
      } else {
        // console.log("Folder moved successfully!");
      }
    });
  }
};

const handleAssets = async () => {
  if (!fs.existsSync(path.join(writePath, 'assets'))) {
    makeDirectory(path.join(writePath, 'assets'));
  }
  const assetData = await readFile(
    path.join(readPath, 'assets', 'assets.json')
  );
  let chunks = await makeChunks(assetData);
  let refs = {};
  for (let i = 0; i < Object.keys(chunks).length; i++) {
    let chunkId = Object.keys(chunks)[i];
    refs[i + 1] = `${chunkId}-assets.json`;

    await writeFile(
      path.join(writePath, 'assets', `${chunkId}-assets.json`),
      JSON.stringify(
        {
          ...chunks[chunkId],
        },
        null,
        4
      )
    );
  }
  await writeFile(
    path.join(writePath, 'assets', 'assets.json'),
    JSON.stringify(refs, null, 4)
  );
  await createMetaData(assetData);
  await moveAssets(Object.keys(assetData));
};

module.exports = handleAssets;
