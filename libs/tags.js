/**
 * External module Dependencies.
 */
var mkdirp = require('mkdirp'),
  path = require('path'),
  fs = require('fs'),
  when = require('when');

const chalk = require('chalk');
/**
 * Internal module Dependencies.
 */
var helper = require('../utils/helper');
const config = require('../config');
var tagsConfig = config.modules.tag;
var tagsFolderName = global.wordPress_prefix
  ? `${global.wordPress_prefix
      .replace(/^\d+/, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/(^_+)|(_+$)/g, '')
      .toLowerCase()}_${tagsConfig.dirName}`
  : tagsConfig.dirName;
var tagsFolderPath = path.resolve(
  config.data,
  config.entryfolder,
  tagsFolderName
);

/**
 * Create folders and files
 */
if (!fs.existsSync(tagsFolderPath)) {
  mkdirp.sync(tagsFolderPath);
  helper.writeFile(path.join(tagsFolderPath, tagsConfig.fileName));
}

function ExtractTags() {}

ExtractTags.prototype = {
  saveTags: function (tagDetails) {
    var self = this;
    return when.promise(function (resolve, reject) {
      var tagdata = helper.readFile(
        path.join(tagsFolderPath, tagsConfig.fileName)
      );

      tagDetails.map(function (data, index) {
        var title = data['tag_name'];
        var uid = `tags_${data['id']}`;
        var slug = data['tag_slug'];
        var description = data['description'] || '';
        var url = '/tags/' + uid;
        tagdata[uid] = {
          uid: uid,
          title: title ?? `Tags - ${data['id']}`,
          url: url,
          slug: slug,
          description: description,
        };
        fs.writeFileSync(
          path.join(tagsFolderPath, tagsConfig.fileName),
          JSON.stringify(tagdata, null, 4)
        );
      });

      console.log(
        chalk.green(`${tagDetails.length}`),
        ' Tags exported successfully'
      );
      resolve();
    });
  },
  getAllTags: function () {
    var self = this;
    return when.promise(function (resolve, reject) {
      var tagsname;
      if (filePath) {
        //if user provide custom name of category
        if (fs.existsSync(filePath)) {
          tagsname = fs.readFileSync(filePath, 'utf-8');
        }
      }
      if (tagsname) {
        tagsname = tagsname.split(',');
      }
      var alldata = helper.readFile(
        path.join(config.data, config.json_filename)
      );
      var tags =
        alldata?.rss?.channel?.['wp:tag'] ?? alldata?.channel?.['wp:tag'] ?? '';
      var tagsArrray = [];
      if (tags !== '') {
        if (tags.length > 0) {
          tags.forEach(function (taginfo) {
            tagsArrray.push({
              id: taginfo['wp:term_id'],
              tag_name: taginfo['wp:tag_name'],
              tag_slug: taginfo['wp:tag_slug'],
              description: taginfo['wp:tag_description'],
            });
          });
        } else {
          tagsArrray.push({
            id: tags['wp:term_id'],
            tag_name: tags['wp:tag_name'],
            tag_slug: tags['wp:tag_slug'],
            description: tags['wp:tag_description'],
          });
        }
        if (tagsArrray.length > 0) {
          self.saveTags(tagsArrray);
          resolve();
        } else {
          console.log(chalk.red('\nno tags found'));
          resolve();
        }
      } else {
        console.log(chalk.red('\nno tags found'));
        resolve();
      }
    });
  },
  start: function () {
    var self = this;
    successLogger(`Exporting ${tagsFolderName}...`);
    return when.promise(function (resolve, reject) {
      self
        .getAllTags()
        .then(function () {
          resolve();
        })
        .catch(function () {
          reject();
        });
    });
  },
};

module.exports = ExtractTags;
