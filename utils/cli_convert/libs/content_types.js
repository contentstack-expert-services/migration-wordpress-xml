const fs = require('fs');
const path = require('path');
const { readFile, makeDirectory, writeFile } = require('../../helper');
const config = require('../../../config');

let readPath = path.join(process.cwd(), config.data);
let writePath = path.join(process.cwd(), config.data);

const getAllFiles = async (folderPath, files = []) => {
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
  return files;
};

const findSchema = async () => {
  let contentTypeFolder = path.join(writePath, 'content_types');
  if (!fs.existsSync(contentTypeFolder)) {
    makeDirectory(contentTypeFolder);
  }
  const allFiles = await getAllFiles(path.join(readPath, 'content_types'));
  const check = allFiles.find((item) => item.includes('schema.json'));
  let schema = [];
  if (!check) {
    for (let i = 0; i < allFiles.length; i++) {
      let data = await readFile(allFiles[i]);
      schema.push(data);
      await writeFile(
        path.join(contentTypeFolder, 'schema.json'),
        JSON.stringify(schema, null, 4)
      );
    }
  }
};

const createSchemaFile = async () => {
  fs.watch(path.join(readPath, 'content_types'), (eventType, filename) => {
    if (eventType === 'rename' && filename) {
      findSchema();
    }
  });
};
module.exports = createSchemaFile;
