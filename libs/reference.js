/**
 * External module Dependencies.
 */
var mkdirp = require('mkdirp'),
  path = require('path'),
  fs = require('fs'),
  when = require('when');

/**
 * Internal module Dependencies.
 */
var helper = require('../utils/helper');
const config = require('../config');
var referenceConfig = config.modules.references,
  referenceFolderPath = path.resolve(config.data, referenceConfig.dirName);

/**
 * Create folders and files
 */
if (!fs.existsSync(referenceFolderPath)) {
  mkdirp.sync(referenceFolderPath);
  helper.writeFile(path.join(referenceFolderPath, referenceConfig.fileName));
}

function ExtractReference() {}

ExtractReference.prototype = {
  saveReference: function (referenceDetails) {
    return when.promise(function (resolve, reject) {
      var referenceData = helper.readFile(
        path.join(referenceFolderPath, referenceConfig.fileName)
      );

      referenceDetails.map(function (data, index) {
        var uid = data['id'];
        var slug = data['slug'];
        var content_type = data['content_type'] || '';
        // this is for reference purpose
        referenceData[uid] = {
          uid: uid,
          slug: slug,
          content_type: content_type,
        };

        fs.writeFileSync(
          path.join(referenceFolderPath, referenceConfig.fileName),
          JSON.stringify(referenceData, null, 4)
        );
      });

      resolve();
    });
  },
  getAllreference: function () {
    var self = this;
    return when.promise(function (resolve, reject) {
      var alldata = helper.readFile(
        path.join(config.data, config.json_filename)
      );

      var prefix = global.wordPress_prefix
        .replace(/^\d+/, '')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/(^_+)|(_+$)/g, '')
        .toLowerCase();

      var referenceTags =
        alldata?.rss?.channel['wp:tag'] ?? alldata?.channel['wp:tag'] ?? '';
      var referenceTerms =
        alldata?.rss?.channel['wp:term'] ?? alldata?.channel['wp:term'] ?? '';
      var referenceCategories =
        alldata?.rss?.channel['wp:category'] ??
        alldata?.channel['wp:category'] ??
        '';
      var referenceArray = [];
      let categories = prefix ? `${prefix}_categories` : 'categories';
      let terms = prefix ? `${prefix}_terms` : 'terms';
      let tag = prefix ? `${prefix}_tag` : 'tag';
      if (referenceCategories && referenceCategories.length > 0) {
        referenceCategories.map(function (catinfo) {
          referenceArray.push({
            id: `category_${catinfo['wp:term_id']}`,
            slug: catinfo['wp:category_nicename'],
            content_type: categories,
          });
        });
      } else {
        if (typeof referenceCategories === 'object') {
          referenceArray.push({
            id: `category_${referenceCategories['wp:term_id']}`,
            slug: referenceCategories['wp:category_nicename'],
            content_type: categories,
          });
        }
      }

      if (referenceTerms && referenceTerms.length > 0) {
        referenceTerms.map(function (terminfo) {
          referenceArray.push({
            id: `terms_${terminfo['wp:term_id']}`,
            slug: terminfo['wp:term_slug'],
            content_type: terms,
          });
        });
      } else {
        if (typeof referenceTerms === 'object') {
          referenceArray.push({
            id: `terms_${referenceTerms['wp:term_id']}`,
            slug: referenceTerms['wp:term_slug'],
            content_type: terms,
          });
        }
      }

      if (referenceTags && referenceTags.length > 0) {
        referenceTags.map(function (taginfo) {
          referenceArray.push({
            id: `tags_${taginfo['wp:term_id']}`,
            slug: taginfo['wp:tag_slug'],
            content_type: tag,
          });
        });
      } else {
        if (typeof referenceTags === 'object') {
          referenceArray.push({
            id: `tags_${referenceTags['wp:term_id']}`,
            slug: referenceTags['wp:tag_slug'],
            content_type: tag,
          });
        }
      }

      if (referenceArray.length > 0) {
        self.saveReference(referenceArray);
        resolve();
      } else {
        resolve();
      }
    });
  },
  start: function () {
    var self = this;
    return when.promise(function (resolve, reject) {
      self
        .getAllreference()
        .then(function () {
          resolve();
        })
        .catch(function () {
          reject();
        });
    });
  },
};

module.exports = ExtractReference;
