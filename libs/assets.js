/**
 * External module Dependencies.
 */
var mkdirp = require('mkdirp'),
  path = require('path'),
  _ = require('lodash'),
  guard = require('when/guard'),
  parallel = require('when/parallel'),
  fs = require('fs'),
  when = require('when'),
  axios = require('axios');

const chalk = require('chalk');
const config = require('../config');

/**
 * Internal module Dependencies .
 */
var helper = require('../utils/helper');

var assetConfig = config.modules.asset,
  assetFolderPath = path.resolve(config.data, assetConfig.dirName),
  assetMasterFolderPath = path.resolve(config.data, 'logs', 'assets'),
  failedJSON =
    helper.readFile(path.join(assetMasterFolderPath, 'wp_failed.json')) || {};

if (!fs.existsSync(assetFolderPath)) {
  mkdirp.sync(assetFolderPath);
  helper.writeFile(path.join(assetFolderPath, assetConfig.fileName));
  mkdirp.sync(assetMasterFolderPath);
} else {
  if (!fs.existsSync(path.join(assetFolderPath, assetConfig.fileName)))
    helper.writeFile(path.join(assetFolderPath, assetConfig.fileName));
  if (!fs.existsSync(assetMasterFolderPath)) {
    mkdirp.sync(assetMasterFolderPath);
  }
}
//Reading a File
var assetData = {};

function ExtractAssets() {}

ExtractAssets.prototype = {
  saveAsset: function (assets, retryCount) {
    var self = this;
    return when.promise(async function (resolve, reject) {
      var url = assets['wp:attachment_url'];
      var name = url.split('/');
      var len = name.length;
      name = name[len - 1];
      url = encodeURI(url);
      var description =
        assets['description'] ||
        assets['content:encoded'] ||
        assets['excerpt:encoded'] ||
        '';
      if (description.length > 255) {
        description = description.slice(0, 255);
      }
      const parent_uid = global.wordPress_prefix ? 'wordpressasset' : null;
      if (
        fs.existsSync(
          path.resolve(assetFolderPath, assets['wp:post_id'].toString(), name)
        )
      ) {
        successLogger(
          'asset already present ' + "'" + assets['wp:post_id'] + "'"
        );
        resolve(assets['wp:post_id']);
      } else {
        try {
          const response = await axios.get(url, {
            responseType: 'arraybuffer',
          });
          mkdirp.sync(
            path.resolve(
              assetFolderPath,
              `assets_${assets['wp:post_id'].toString()}`
            )
          );
          fs.writeFileSync(
            path.join(
              assetFolderPath,
              `assets_${assets['wp:post_id'].toString()}`,
              name
            ),
            response.data
          );

          var stats = fs.lstatSync(
            path.join(
              assetFolderPath,
              `assets_${assets['wp:post_id'].toString()}`,
              name
            )
          );
          assetData[`assets_${assets['wp:post_id']}`] = {
            uid: `assets_${assets['wp:post_id']}`,
            urlPath: `/assets/assets_${assets['wp:post_id']}`,
            status: true,
            file_size: `${stats.size}`,
            tag: [],
            filename: name,
            url: url,
            is_dir: false,
            parent_uid: parent_uid,
            _version: 1,
            title: assets['title'] || name.substr(0, name.lastIndexOf('.')),
            publish_details: [],
            description: description,
          };
          if (failedJSON[assets['wp:post_id']]) {
            delete failedJSON[assets['wp:post_id']];
          }

          helper.writeFile(
            path.join(assetFolderPath, assetConfig.fileName),
            JSON.stringify(assetData, null, 4)
          );

          console.log(
            'An asset with id',
            chalk.green(`assets_${assets['wp:post_id']}`),
            'and name',
            chalk.green(`${name}`),
            'got downloaded successfully.'
          );
          resolve(assets['wp:post_id']);
        } catch (err) {
          if (err) {
            failedJSON[assets['wp:post_id']] = err;
            if (retryCount == 1) {
              failedJSON[assets['wp:post_id']] = {
                failedUid: assets['wp:post_id'],
                name: assets['title'] || name.substr(0, name.lastIndexOf('.')),
                url: url,
                reason_for_error: err?.message,
              };
              helper.writeFile(
                path.join(assetMasterFolderPath, 'wp_failed.json'),
                JSON.stringify(failedJSON, null, 4)
              ),
                resolve(assets['wp:post_id']);
            } else {
              self.saveAsset(assets, 1).then(function (results) {
                resolve();
              });
            }
          }
        }
      }
    });
  },
  getAsset: function (attachments) {
    var self = this;
    return when.promise(function (resolve, reject) {
      var _getAsset = [];

      for (var i = 0, total = attachments.length; i < total; i++) {
        _getAsset.push(
          (function (data) {
            return function () {
              return self.saveAsset(data, 0);
            };
          })(attachments[i])
        );
      }
      var guardTask = guard.bind(null, guard.n(5));
      _getAsset = _getAsset.map(guardTask);
      var taskResults = parallel(_getAsset);
      taskResults
        .then(function (results) {
          helper.writeFile(
            path.join(assetFolderPath, assetConfig.fileName),
            JSON.stringify(assetData, null, 4)
          );
          helper.writeFile(
            path.join(assetMasterFolderPath, 'wp_failed.json'),
            JSON.stringify(failedJSON, null, 4)
          );
          resolve(results);
        })
        .catch(function (e) {
          errorLogger('failed to download assets: ', e);
          resolve();
        });
    });
  },
  getAllAssets: function () {
    var self = this;
    return when.promise(function (resolve, reject) {
      var alldata = helper.readFile(
        path.join(config.data, config.json_filename)
      );
      var assets = alldata?.rss?.channel?.item ?? alldata?.channel?.item;
      if (assets) {
        if (assets.length > 0) {
          if (!filePath) {
            var attachments = _.filter(assets, {
              'wp:post_type': 'attachment',
            }); //for media(assets)
            self
              .getAsset(attachments, attachments.length)
              .then(function () {
                resolve();
              })
              .catch(function () {
                reject();
              });
          } else {
            //if want to custom export
            var assetids = [];
            if (fs.existsSync(filePath)) {
              assetids = fs.readFileSync(filePath, 'utf-8').split(',');
            }
            if (assetids.length > 0) {
              var assetDetails = [];
              assetids.map(function (asset, index) {
                var index = _.findIndex(assets, { 'wp:post_id': asset });
                if (index != -1)
                  if (assets[index]['wp:post_type'] == 'attachment') {
                    assetDetails.push(assets[index]);
                  }
              });
              if (assetDetails.length > 0) {
                self
                  .getAsset(assetDetails, assetDetails.length)
                  .then(function () {
                    resolve();
                  })
                  .catch(function () {
                    reject();
                  });
              } else {
                errorLogger('please provide valid id for assets export');
                resolve();
              }
            } else {
              errorLogger('no assets id found');
              resolve();
            }
          }
        } else {
          console.log(chalk.red('no assets found'));
          resolve();
        }
      } else {
        console.log(chalk.red('no assets found'));
        resolve();
      }
    });
  },
  start: function () {
    var self = this;
    successLogger('exporting assets...');
    return when.promise(function (resolve, reject) {
      self
        .getAllAssets()
        .then(function () {
          resolve();
        })
        .catch(function () {
          reject();
        });
    });
  },
};

module.exports = ExtractAssets;
