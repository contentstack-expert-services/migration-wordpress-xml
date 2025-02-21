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
const { reject } = require('lodash');
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
    try {
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
    } catch (error) {
      console.error('Error in saveReference:', error);
      reject(error);
    }
  },
  getAllreference: function () {
    var self = this;
    return when.promise(function (resolve, reject) {
      try {
        // Read the file and parse the data
        var alldata = helper.readFile(
          path.join(config.data, config.json_filename)
        );

        // Ensure alldata is defined and has the expected structure
        if (!alldata) {
          throw new Error('alldata is undefined or null');
        }

        // Extract prefix
        var prefix = global.wordPress_prefix
          .replace(/^\d+/, '')
          .replace(/[^a-zA-Z0-9]+/g, '_')
          .replace(/(^_+)|(_+$)/g, '')
          .toLowerCase();

        // Safely extract reference data
        var referenceTags =
          alldata?.rss?.channel?.['wp:tag'] ??
          alldata?.channel?.['wp:tag'] ??
          '';
        var referenceTerms =
          alldata?.rss?.channel?.['wp:term'] ??
          alldata?.channel?.['wp:term'] ??
          '';
        var referenceCategories =
          alldata?.rss?.channel?.['wp:category'] ??
          alldata?.channel?.['wp:category'] ??
          '';

        var referenceArray = [];
        let categories = prefix ? `${prefix}_categories` : 'categories';
        let terms = prefix ? `${prefix}_terms` : 'terms';
        let tag = prefix ? `${prefix}_tag` : 'tag';

        // Process referenceCategories
        if (Array.isArray(referenceCategories)) {
          referenceCategories.forEach(function (catinfo) {
            referenceArray.push({
              id: `category_${catinfo['wp:term_id']}`,
              slug: catinfo['wp:category_nicename'],
              content_type: categories,
            });
          });
        } else if (
          referenceCategories &&
          typeof referenceCategories === 'object'
        ) {
          referenceArray.push({
            id: `category_${referenceCategories['wp:term_id']}`,
            slug: referenceCategories['wp:category_nicename'],
            content_type: categories,
          });
        }

        // Process referenceTerms
        if (Array.isArray(referenceTerms)) {
          referenceTerms.forEach(function (terminfo) {
            referenceArray.push({
              id: `terms_${terminfo['wp:term_id']}`,
              slug: terminfo['wp:term_slug'],
              content_type: terms,
            });
          });
        } else if (referenceTerms && typeof referenceTerms === 'object') {
          referenceArray.push({
            id: `terms_${referenceTerms['wp:term_id']}`,
            slug: referenceTerms['wp:term_slug'],
            content_type: terms,
          });
        }

        // Process referenceTags
        if (Array.isArray(referenceTags)) {
          referenceTags.forEach(function (taginfo) {
            referenceArray.push({
              id: `tags_${taginfo['wp:term_id']}`,
              slug: taginfo['wp:tag_slug'],
              content_type: tag,
            });
          });
        } else if (referenceTags && typeof referenceTags === 'object') {
          referenceArray.push({
            id: `tags_${referenceTags['wp:term_id']}`,
            slug: referenceTags['wp:tag_slug'],
            content_type: tag,
          });
        }

        // Save references if any exist
        if (referenceArray.length > 0) {
          self.saveReference(referenceArray);
        }

        resolve();
      } catch (error) {
        console.error('Error in getAllreference:', error);
        reject(error);
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
