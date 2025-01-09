const mkdirp = require('mkdirp');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { existsSync, createWriteStream, lstatSync } = fs;
const chalk = require('chalk');

const config = require('../config');
const helper = require('../utils/helper');

const assetConfig = config.modules.asset;
const assetFolderPath = path.resolve(config.data, assetConfig.dirName);
const assetMasterFolderPath = path.resolve(config.data, 'logs', 'assets');
const failedJSON =
  helper.readFile(path.join(assetMasterFolderPath, 'wp_failed.json')) || {};

if (!existsSync(assetFolderPath)) {
  mkdirp.sync(assetFolderPath);
  helper.writeFile(path.join(assetFolderPath, assetConfig.fileName));
  mkdirp.sync(assetMasterFolderPath);
}

let assetData = {};

// Helper function to check and construct URLs
function toCheckUrl(url, baseSiteUrl) {
  const validPattern = /^(https?:\/\/|www\.)/;
  return validPattern.test(url)
    ? url
    : `${baseSiteUrl}${url.replace(/^\/+/, '')}`;
}

// Save a single asset with retries
async function saveAsset(asset, baseSiteUrl, retryCount = 0) {
  const maxRetries = 3;
  const url = encodeURI(toCheckUrl(asset['wp:attachment_url'], baseSiteUrl));
  const name = path.basename(url);
  const assetPath = path.join(
    assetFolderPath,
    `assets_${asset['wp:post_id']}`,
    name
  );
  let description =
    asset['description'] ||
    asset['content:encoded'] ||
    asset['excerpt:encoded'] ||
    '';
  if (description.length > 255) {
    description = description.slice(0, 255);
  }
  const parent_uid = global.wordPress_prefix
    ? global.wordPress_prefix
    : 'wordpressasset';

  if (existsSync(assetPath)) {
    console.log(chalk.yellow(`Asset already exists: ${assetPath}`));
    return;
  }

  try {
    const dir = path.dirname(assetPath);
    mkdirp.sync(dir);

    const response = await axios({
      method: 'get',
      url,
      responseType: 'stream',
    });

    const writer = createWriteStream(assetPath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    const stats = lstatSync(assetPath);
    assetData[`assets_${asset['wp:post_id']}`] = {
      uid: `assets_${asset['wp:post_id']}`,
      filename: name,
      url,
      file_size: stats.size,
      status: true,
      description: description,
      is_dir: false,
      parent_uid: parent_uid,
      publish_details: [],
      title: asset['title'] || name.slice(0, name.lastIndexOf('.')),
      _version: 1,
    };

    console.log(chalk.green(`Asset downloaded: ${name}`));
  } catch (err) {
    if (retryCount < maxRetries) {
      console.log(
        chalk.red(`Retrying (${retryCount + 1}/${maxRetries}): ${url}`)
      );
      return saveAsset(asset, baseSiteUrl, retryCount + 1);
    }

    console.log(chalk.red(`Failed to download: ${url}`));
    failedJSON[asset['wp:post_id']] = {
      url,
      reason: err.message,
    };
  }
}

// Process assets in batches
async function processAssets(attachments, baseSiteUrl, batchSize = 5) {
  for (let i = 0; i < attachments.length; i += batchSize) {
    const batch = attachments.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map((asset) => saveAsset(asset, baseSiteUrl))
    );
  }

  helper.writeFile(
    path.join(assetFolderPath, assetConfig.fileName),
    JSON.stringify(assetData, null, 4)
  );
  helper.writeFile(
    path.join(assetMasterFolderPath, 'wp_failed.json'),
    JSON.stringify(failedJSON, null, 4)
  );
}

function ExtractAssets() {}

ExtractAssets.prototype = {
  start: async function () {
    const data = helper.readFile(path.join(config.data, config.json_filename));
    const baseSiteUrl =
      data?.rss?.channel?.['wp:base_site_url'] ||
      data?.channel?.['wp:base_site_url'];
    const items = data?.rss?.channel?.item || data?.channel?.item;

    const attachments = items.filter(
      (item) => item['wp:post_type'] === 'attachment'
    );
    if (attachments.length === 0) {
      console.log(chalk.red('No attachments found.'));
      return;
    }

    console.log(chalk.blue(`Processing ${attachments.length} assets...`));
    await processAssets(attachments, baseSiteUrl);
    console.log(chalk.green('Asset extraction completed.'));
  },
};

module.exports = ExtractAssets;
