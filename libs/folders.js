'use strict';
/**
 * External module Dependencies.
 */
var path = require('path'),
  when = require('when');
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
            name: global.wordPress_prefix,
            is_dir: true,
            parent_uid: null,
            _version: 1,
          },
        ];
        helper.writeFile(
          path.join(process.cwd(), config.data, 'assets', 'folders.json'),
          JSON.stringify(folderJSON, null, 4)
        );
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
      if (global.wordPress_prefix) {
        self
          .saveFolder()
          .then(function () {
            resolve();
          })
          .catch(function () {
            reject();
          });
      } else {
        resolve();
      }
    });
  },
};

module.exports = ExtractFolders;
