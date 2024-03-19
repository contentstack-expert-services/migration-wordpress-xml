const fs = require('fs');
const path = require('path');
const { readFile, makeDirectory, writeFile } = require('../../helper');
const chunkSize = 1048576; // 1 mb ->bytes
const uuid = require('uuid');
const os = require('os');
const platform = os.platform();
const config = require('../../../config');

let readPath = path.join(process.cwd(), config.data);
let writePath = path.join(process.cwd(), config.data);

const handleEntries = async () => {
  if (!fs.existsSync(path.join(writePath, 'entries'))) {
    makeDirectory(path.join(writePath, 'entries'));
  }
  await createCTFolders();
  let allEntries = getAllFiles(path.join(readPath, 'entries'));

  for (let i = 0; i < allEntries.length; i++) {
    let commonFolderPath = path.join(process.cwd(), config.data, 'entries');
    let entryPath = allEntries[i];
    let differenceFilePath = path.relative(commonFolderPath, entryPath);

    const diffChecker = differenceFilePath.split(path.sep);

    if (diffChecker.length < 3) {
      let locale = entryPath.split('/').reverse()[0].split('.')[0];
      let content_type = entryPath.split('/').reverse()[1];
      makeDirectory(path.join(writePath, 'entries', content_type, locale));
      let entryData = await readFile(entryPath);
      let chunks = await makeChunks(entryData);
      let refs = {};
      for (let i = 0; i < Object.keys(chunks).length; i++) {
        let chunkId = Object.keys(chunks)[i];
        refs[i + 1] = `${chunkId}-entries.json`;
        await writeFile(
          path.join(
            writePath,
            'entries',
            content_type,
            locale,
            `${chunkId}-entries.json`
          ),
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
        path.join(writePath, 'entries', content_type, locale, 'index.json'),
        JSON.stringify(refs, null, 4)
      );
    }
  }
};

const createCTFolders = async () => {
  const CTs = fs.readdirSync(path.join(readPath, 'entries'));
  for (let i = 0; i < CTs.length; i++) {
    if (!fs.existsSync(path.join(writePath, 'entries', CTs[i]))) {
      makeDirectory(path.join(writePath, 'entries', CTs[i]));
    }
  }
};

const makeChunks = async (entryData) => {
  let currentChunkSize = 0;
  let currentChunkId = uuid.v4();
  let chunks = {};
  for (
    let currentAssetId = 0;
    currentAssetId < Object.keys(entryData).length;
    currentAssetId += 1
  ) {
    let curAssetKey = Object.keys(entryData)[currentAssetId];

    let tempObj = {};
    tempObj[entryData[curAssetKey].uid] = entryData[curAssetKey];
    chunks[currentChunkId] = { ...chunks[currentChunkId], ...tempObj };

    currentChunkSize = Buffer.byteLength(
      JSON.stringify(chunks[currentChunkId]),
      'utf8'
    );
    if (currentChunkSize > chunkSize) {
      currentChunkId = uuid.v4();
      currentChunkSize = 0;
      let tempObj = {};
      tempObj[entryData[curAssetKey].uid] = entryData[curAssetKey];
      chunks[currentChunkId] = tempObj;
    }
  }

  return chunks;
};

const getAllFiles = (folderPath, files = []) => {
  const contents = fs.readdirSync(folderPath);

  contents.forEach((item) => {
    const itemPath = path.join(folderPath, item);
    const isDirectory = fs.statSync(itemPath).isDirectory();

    if (isDirectory) {
      getAllFiles(itemPath, files);
    } else {
      files.push(itemPath);
    }
  });
  if (platform === 'win32') {
    files = files.map((item) => item.replace(/\\/g, '/'));
  }
  return files;
};

module.exports = handleEntries;
