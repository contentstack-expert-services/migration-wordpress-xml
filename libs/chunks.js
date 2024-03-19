/**
 * External module Dependencies.
 */
const mkdirp = require('mkdirp'),
  path = require('path'),
  fs = require('fs'),
  when = require('when');

const chalk = require('chalk');
/**
 * Internal module Dependencies.
 */
const config = require('../config');
var helper = require('../utils/helper');
var postConfig = config.modules.posts;
var postFolderName = global.wordPress_prefix
  ? `${global.wordPress_prefix
      .replace(/^\d+/, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/(^_+)|(_+$)/g, '')
      .toLowerCase()}_${postConfig.dirName}`
  : postConfig.dirName;
var postFolderPath = path.resolve(
  config.data,
  config.entryfolder,
  postFolderName,
  'en-us'
);

const chunksDir = path.resolve(config.data, 'chunks');

if (!fs.existsSync(postFolderPath)) {
  mkdirp.sync(postFolderPath);
}

if (!fs.existsSync(chunksDir)) {
  mkdirp.sync(chunksDir);
}

// var self = this;
function ExtractChunks() {}

async function splitJsonIntoChunks(arrayData) {
  try {
    let chunkData = [];
    let chunkIndex = 1;
    let postIndex = {};

    for (let i = 0; i < arrayData.length; i++) {
      chunkData.push(arrayData[i]);

      if (
        chunkData.length >= 100 ||
        (i === arrayData.length - 1 && chunkData.length > 0)
      ) {
        // Write chunk data to file
        const chunkFilePath = path.join(chunksDir, `post-${chunkIndex}.json`);
        fs.writeFileSync(chunkFilePath, JSON.stringify(chunkData, null, 4));

        postIndex[chunkIndex] = `post-${chunkIndex}.json`;

        // Reset chunk data
        chunkData = [];
        chunkIndex++;
      }
    }

    fs.writeFileSync(
      path.join(
        process.cwd(),
        config.data,
        'entries',
        postFolderName,
        'en-us',
        'index.json'
      ),
      JSON.stringify(postIndex, null, 4),
      (err) => {
        if (err) console.log(err);
      }
    );
  } catch (error) {
    console.log(error);
  }
}

ExtractChunks.prototype = {
  start: function () {
    successLogger(`Creating ${postFolderName} chunks...`);
    return when.promise(function (resolve, reject) {
      try {
        const alldata = helper.readFile(
          path.join(config.data, config.json_filename)
        );
        const posts =
          alldata?.rss?.channel['item'] ?? alldata?.channel['item'] ?? '';

        if (posts) {
          if (posts.length > 0) {
            splitJsonIntoChunks(posts);
            resolve();
          } else {
            console.log(chalk.red('\nno posts found'));
            resolve();
          }
        } else {
          console.log(chalk.red('\nno posts found'));
          resolve();
        }
      } catch (error) {
        console.log(error);
        reject();
      }
    });
  },
};

module.exports = ExtractChunks;
