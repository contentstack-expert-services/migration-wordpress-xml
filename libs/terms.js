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
var termsConfig = config.modules.terms;
var termsFolderName = global.wordPress_prefix
  ? `${global.wordPress_prefix
      .replace(/^\d+/, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/(^_+)|(_+$)/g, '')
      .toLowerCase()}_${termsConfig.dirName}`
  : termsConfig.dirName;
var termsFolderPath = path.resolve(
  config.data,
  config.entryfolder,
  termsFolderName
);

/**
 * Create folders and files
 */
if (!fs.existsSync(termsFolderPath)) {
  mkdirp.sync(termsFolderPath);
  helper.writeFile(path.join(termsFolderPath, termsConfig.fileName));
}

function ExtractTerms() {}

ExtractTerms.prototype = {
  saveTerms: function (termsDetails) {
    var self = this;
    return when.promise(function (resolve, reject) {
      try {
        var termsdata = helper.readFile(
          path.join(termsFolderPath, termsConfig.fileName)
        );

        termsDetails.map(function (data, index) {
          var title = data['term_name'];
          var uid = `terms_${data['id']}`;
          var taxonomy = data['term_taxonomy'] || '';
          var url = '/terms/' + uid;
          var slug = data['term_slug'];

          termsdata[uid] = {
            uid: uid,
            title: title ?? `Terms - ${data['id']}`,
            url: url,
            taxonomy: taxonomy,
            slug: slug,
          };
          fs.writeFileSync(
            path.join(termsFolderPath, termsConfig.fileName),
            JSON.stringify(termsdata, null, 4)
          );
        });
        console.log(
          chalk.green(`${termsDetails.length} Terms exported successfully`)
        );
        resolve();
      } catch (error) {
        console.error('Error in saveTags:', error);
        reject(error);
      }
    });
  },
  getAllTerms: function () {
    var self = this;
    return when.promise(function (resolve, reject) {
      try {
        var termsname;
        if (filePath) {
          //if user provide custom name of category
          if (fs.existsSync(filePath)) {
            termsname = fs.readFileSync(filePath, 'utf-8');
          }
        }
        if (termsname) {
          termsname = termsname.split(',');
        }
        var alldata = helper.readFile(
          path.join(config.data, config.json_filename)
        );
        var terms =
          alldata?.rss?.channel?.['wp:term'] ??
          alldata?.channel?.['wp:term'] ??
          '';
        var termsArrray = [];
        if (terms !== '') {
          if (terms.length > 0) {
            terms.forEach(function (terminfo) {
              termsArrray.push({
                id: terminfo['wp:term_id'],
                term_name: terminfo['wp:term_name'],
                term_slug: terminfo['wp:term_slug'],
                term_taxonomy: terminfo['wp:term_taxonomy'],
              });
            });
          } else {
            termsArrray.push({
              id: terms['wp:term_id'],
              term_name: terms['wp:term_name'],
              term_slug: terms['wp:term_slug'],
              term_taxonomy: terms['wp:term_taxonomy'],
            });
          }
          if (termsArrray.length > 0) {
            self.saveTerms(termsArrray);
            resolve();
          } else {
            console.log(chalk.red('\nno terms found'));
            resolve();
          }
        } else {
          console.log(chalk.red('\nno terms found'));
          resolve();
        }
      } catch (error) {
        console.error('Error in getAllTerms:', error);
        reject(error);
      }
    });
  },
  start: function () {
    var self = this;
    successLogger(`Exporting ${termsFolderName}...`);
    return when.promise(function (resolve, reject) {
      self
        .getAllTerms()
        .then(function () {
          resolve();
        })
        .catch(function () {
          reject();
        });
    });
  },
};

module.exports = ExtractTerms;
