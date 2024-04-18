/**
 * External module Dependencies.
 */
var mkdirp = require('mkdirp'),
  path = require('path'),
  _ = require('lodash'),
  fs = require('fs'),
  when = require('when');
const config = require('../config');
const chalk = require('chalk');
/**
 * Internal module Dependencies.
 */
var helper = require('../utils/helper');

var authorConfig = config.modules.authors;
var authorFolderName = global.wordPress_prefix
  ? `${global.wordPress_prefix
      .replace(/^\d+/, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/(^_+)|(_+$)/g, '')
      .toLowerCase()}_${authorConfig.dirName}`
  : authorConfig.dirName;
var authorsFolderPath = path.resolve(
  config.data,
  config.entryfolder,
  authorFolderName
);

/**
 * Create folders and files if they are not created
 */
if (!fs.existsSync(authorsFolderPath)) {
  mkdirp.sync(authorsFolderPath);
  helper.writeFile(path.join(authorsFolderPath, authorConfig.fileName));
}

function ExtractAuthors() {}

ExtractAuthors.prototype = {
  saveAuthors: function (authorDetails) {
    var self = this;
    return when.promise(function (resolve, reject) {
      var slugRegExp = new RegExp('[^a-z0-9_-]+', 'g');
      var authordata = helper.readFile(
        path.join(authorsFolderPath, authorConfig.fileName)
      );

      authorDetails.map(function (data) {
        var uid =
          data['wp:author_id'] === undefined
            ? `authors_${data['wp:author_login']}`
            : `authors_${data['wp:author_id']}`;

        var url = '/author/' + uid.toLowerCase().replace(slugRegExp, '-');
        authordata[uid] = {
          uid: uid,
          title:
            data['wp:author_login'] ??
            `Authors - ${data['wp:author_login']}` ??
            `Authors - ${data['wp:author_id']}`,
          url: url,
          email: data['wp:author_email'],
          first_name: data['wp:author_first_name'],
          last_name: data['wp:author_last_name'],
        };
      });
      fs.writeFileSync(
        path.join(authorsFolderPath, authorConfig.fileName),
        JSON.stringify(authordata, null, 4)
      );
      console.log(
        chalk.green(`\n${authorDetails.length}`),
        ' Authors exported successfully'
      );

      resolve();
    });
  },
  getAllAuthors: function () {
    var self = this;
    return when.promise(function (resolve, reject) {
      var alldata = helper.readFile(
        path.join(config.data, config.json_filename)
      );
      var authors =
        alldata?.rss?.channel?.['wp:author'] ??
        alldata?.channel?.['wp:author'] ??
        '';
      if (authors !== '') {
        if (authors.length > 0) {
          if (!filePath) {
            self.saveAuthors(authors);
            resolve();
          } else {
            //if want to custom export
            var authorids = [];
            if (fs.existsSync(filePath)) {
              authorids = fs.readFileSync(filePath, 'utf-8').split(',');
            }
            if (authorids.length > 0) {
              var authordetails = [];
              authorids.map(function (author, index) {
                var index = _.findIndex(authors, { 'wp:author_id': author });
                if (index != -1) authordetails.push(authors[index]);
              });
              if (authordetails.length > 0) {
                self.saveAuthors(authordetails);
                resolve();
              } else {
                resolve();
              }
            } else {
              resolve();
            }
          }
        } else {
          if (typeof authors == 'object') {
            var singleAuthor = [];
            if (!filePath) {
              singleAuthor.push(authors);
              self.saveAuthors(singleAuthor);
            } else {
              var authorids = [];
              if (fs.existsSync(filePath)) {
                authorids = fs.readFileSync(filePath, 'utf-8').split(',');
              }
              if (authorids.indexOf(authors['wp:author_id']) != -1) {
                singleAuthor.push(authors);
                self.saveAuthors(singleAuthor);
              } else {
                console.log(chalk.red('\nno authors uid found'));
              }
            }
          } else {
            console.log(chalk.red('\nno authors found'));
          }
          resolve();
        }
      } else {
        console.log(chalk.red('\nno authors found'));
        resolve();
      }
    });
  },
  start: function () {
    successLogger(`Exporting ${authorFolderName}...`);
    var self = this;
    return when.promise(function (resolve, reject) {
      self
        .getAllAuthors()
        .then(function () {
          resolve();
        })
        .catch(function () {
          reject();
        });
    });
  },
};

module.exports = ExtractAuthors;
