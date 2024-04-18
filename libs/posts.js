/**
 * External module Dependencies.
 */
const mkdirp = require('mkdirp'),
  path = require('path'),
  fs = require('fs'),
  when = require('when');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const virtualConsole = new jsdom.VirtualConsole();
const { htmlToJson } = require('@contentstack/json-rte-serializer');

virtualConsole.on('error', () => {
  // No-op to skip console errors.
});

const chalk = require('chalk');
/**
 * Internal module Dependencies.
 */
var helper = require('../utils/helper');
const config = require('../config');
function limitConcurrency(maxConcurrency) {
  let running = 0;
  const queue = [];

  function runNext() {
    if (running < maxConcurrency && queue.length > 0) {
      const task = queue.shift();
      running++;
      task().finally(() => {
        running--;
        runNext();
      });
      runNext();
    }
  }

  return async function limit(fn) {
    return new Promise((resolve, reject) => {
      queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      runNext();
    });
  };
}

const limit = limitConcurrency(5); // Limiting to 5 concurrent tasks

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

var authorFolderName = global.wordPress_prefix
  ? `${global.wordPress_prefix
      .replace(/^\d+/, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/(^_+)|(_+$)/g, '')
      .toLowerCase()}_authors`
  : 'authors';

const authorId = helper.readFile(
  path.join(
    process.cwd(),
    config.data,
    'entries',
    authorFolderName,
    'en-us.json'
  )
);

const referenceId = helper.readFile(
  path.join(process.cwd(), config.data, 'reference', 'reference.json')
);

const alldata = helper.readFile(path.join(config.data, config.json_filename));
const blog_base_url =
  alldata?.rss?.channel['wp:base_blog_url'] ||
  alldata?.channel['wp:base_blog_url'] ||
  '';

const chunksDir = path.resolve(config.data, 'chunks');

if (!fs.existsSync(postFolderPath)) {
  mkdirp.sync(postFolderPath);
  helper.writeFile(path.join(postFolderPath, postConfig.fileName));
}

// var self = this;
function ExtractPosts() {}

async function featuredImageMapping(postid, post, postdata) {
  try {
    var assetsId = helper.readFile(
      path.join(process.cwd(), config.data, 'assets', 'assets.json')
    );

    let assetsDetails = [];
    if (post['wp:postmeta']) {
      var postmeta = post['wp:postmeta'];
      if (Array.isArray(postmeta)) {
        postmeta.map(function (meta, index) {
          if (meta['wp:meta_key'] == '_thumbnail_id') {
            var attachmentid = `assets_${meta['wp:meta_value']}`;
            // to match the asset id from the asset json and the attachementid
            if (assetsId)
              Object.keys(assetsId).forEach((key) => {
                if (attachmentid === assetsId[key].uid) {
                  assetsDetails.push(assetsId[key]); // to push the key which we got from match
                }
              });

            postdata[postid]['featured_image'] = assetsDetails;
          }
        });
      } else {
        if (postmeta['wp:meta_key']) {
          if (postmeta['wp:meta_key'] == '_thumbnail_id') {
            var attachmentid = postmeta['wp:meta_value'];
            // to match the asset id from the asset json and the attachementid
            Object.keys(assetsId).forEach((key) => {
              if (attachmentid === assetsId[key].uid) {
                assetsDetails.push(assetsId[key]); // to push the key which we got from match
              }
            });

            postdata[postid]['featured_image'] = assetsDetails;
          }
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
}

async function processChunkData(chunkData, filename, isLastChunk) {
  var results;
  var postdata = {};
  try {
    const writePromises = [];

    chunkData.map(function (data) {
      writePromises.push(
        limit(async () => {
          let typeArray = [
            'page',
            'wp_global_styles',
            'wp_block',
            'attachment',
            'amp_validated_url',
          ];
          if (!typeArray.includes(data['wp:post_type'])) {
            let statusArray = ['publish', 'inherit'];
            if (statusArray.includes(data['wp:status'])) {
              var postAuthor = [],
                postCategories = [],
                postTags = [],
                postTerms = [];
              var categories = data['category'];
              if (Array.isArray(categories)) {
                Object.keys(referenceId).forEach((key) => {
                  if (
                    categories.find(
                      (el) => el.attributes.nicename === referenceId[key].slug
                    )
                  ) {
                    if (referenceId[key].content_type.endsWith('terms')) {
                      postTerms.push({
                        uid: key,
                        _content_type_uid: referenceId[key].content_type,
                      });
                    } else if (referenceId[key].content_type.endsWith('tag')) {
                      postTags.push({
                        uid: key,
                        _content_type_uid: referenceId[key].content_type,
                      });
                    } else if (
                      referenceId[key].content_type.endsWith('categories')
                    ) {
                      postCategories.push({
                        uid: key,
                        _content_type_uid: referenceId[key].content_type,
                      });
                    }
                  }
                });
              } else {
                if (categories && categories['$']?.['domain'] !== 'category') {
                  Object.keys(referenceId).forEach((key) => {
                    if (
                      categories.attributes.nicename === referenceId[key].slug
                    ) {
                      if (referenceId[key].content_type.endsWith('terms')) {
                        postTerms.push({
                          uid: key,
                          _content_type_uid: referenceId[key].content_type,
                        });
                      } else if (
                        referenceId[key].content_type.endsWith('tags')
                      ) {
                        postTags.push({
                          uid: key,
                          _content_type_uid: referenceId[key].content_type,
                        });
                      } else if (
                        referenceId[key].content_type.endsWith('categories')
                      ) {
                        postCategories.push({
                          uid: key,
                          _content_type_uid: referenceId[key].content_type,
                        });
                      }
                    }
                  });
                }
              }

              let author_contentType = global.wordPress_prefix
                ? `${global.wordPress_prefix
                    .replace(/^\d+/, '')
                    .replace(/[^a-zA-Z0-9]+/g, '_')
                    .replace(/(^_+)|(_+$)/g, '')
                    .toLowerCase()}_authors`
                : 'authors';
              Object.keys(authorId).forEach((key) => {
                if (
                  data['dc:creator'].split(',').join('') === authorId[key].title
                ) {
                  postAuthor.push({
                    uid: key,
                    _content_type_uid: author_contentType,
                  });
                }
              });
              const dom = new JSDOM(
                data['content:encoded']
                  .replace(/<!--.*?-->/g, '')
                  .replace(/&lt;!--?\s+\/?wp:.*?--&gt;/g, ''),
                { virtualConsole }
              );
              let htmlDoc = dom.window.document.querySelector('body');

              const jsonValue = htmlToJson(htmlDoc);
              var date = new Date(data['wp:post_date_gmt']);
              var base = blog_base_url.split('/');
              var len = base.length;
              var blogname;

              if (base[len - 1] == '') {
                blogname = base[len - 2];
              } else {
                blogname = base[len - 1];
              }
              var url = data['link'];
              url = url.split(blogname);
              url = url[1];
              postdata[`posts_${data['wp:post_id']}`] = {
                title: data['title'] ?? `Posts - ${data['wp:post_id']}`,
                uid: `posts_${data['wp:post_id']}`,
                url: url,
                date: date.toISOString(),
                full_description: jsonValue,
                excerpt: data['excerpt:encoded']
                  .replace(/<!--.*?-->/g, '')
                  .replace(/&lt;!--?\s+\/?wp:.*?--&gt;/g, ''),
                author: postAuthor,
                category: postCategories,
                terms: postTerms,
                tag: postTags,
              };
              featuredImageMapping(
                `posts_${data['wp:post_id']}`,
                data,
                postdata
              );
            }
          }

          fs.writeFileSync(
            path.join(postFolderPath, filename),
            JSON.stringify(postdata, null, 4)
          );
        })
      );
    });

    // Wait for all write promises to complete and store the results
    results = await Promise.all(writePromises);
    // check if all promises resolved successfully
    const allSuccess = results.every(
      (result) => typeof result !== 'object' || result.success
    );

    if (isLastChunk && allSuccess) {
      console.log('last data');
    }
  } catch (error) {
    console.log(error);
    console.log(chalk.red('Error saving posts', error));
    return { success: false, message: error };
  }
}

ExtractPosts.prototype = {
  start: function () {
    successLogger(`Exporting ${postFolderName}...`);
    return when.promise(async function (resolve, reject) {
      try {
        const chunkFiles = fs.readdirSync(chunksDir);
        const lastChunk = chunkFiles[chunkFiles.length - 1];

        // Read and process all files in the directory except the first one
        for (const filename of chunkFiles) {
          const filePath = path.join(chunksDir, filename);
          const data = fs.readFileSync(filePath);
          const chunkData = JSON.parse(data);

          // Check if the current chunk is the last chunk
          const isLastChunk = filename === lastChunk;

          // Process the current chunk
          await processChunkData(chunkData, filename, isLastChunk);
          console.log(
            chalk.green(`${filename.split('.').slice(0, -1).join('.')}`),
            'getting migrated please wait'
          );
        }
        resolve();
      } catch (error) {
        console.log(error);
        reject();
      }
    });
  },
};
module.exports = ExtractPosts;
