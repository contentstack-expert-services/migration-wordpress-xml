'use strict';
/**
 * External module Dependencies.
 */
var path = require('path'),
  when = require('when'),
  chalk = require('chalk');
/**
 * Internal module Dependencies .
 */

var helper = require('../utils/helper');
const config = require('../config');

function ExtractFolders() {}

ExtractFolders.prototype = {
  saveFolder: function () {
    return when.promise(function (resolve, reject) {
      try {
        var folderJSON = [
          {
            urlPath: '/assets/wordpressasset',
            uid: 'wordpressasset',
            content_type: 'application/vnd.contenstack.folder',
            tags: [],
            name: global.wordPress_prefix
              ? global.wordPress_prefix
              : 'WordPress Migration Assets',
            is_dir: true,
            parent_uid: null,
            _version: 1,
          },
        ];
        helper.writeFile(
          path.join(process.cwd(), config.data, 'assets', 'folders.json'),
          JSON.stringify(folderJSON, null, 4)
        );
        console.log(chalk.green(`Assets Folder created successfully`));
        resolve();
      } catch (error) {
        console.log(error);
        reject();
      }
    });
  },
  start: function () {
    successLogger(`Creating assets folder...`);
    var self = this;
    return when.promise(function (resolve, reject) {
      self
        .saveFolder()
        .then(function () {
          resolve();
        })
        .catch(function () {
          reject();
        });
    });
  },
};

module.exports = ExtractFolders;
