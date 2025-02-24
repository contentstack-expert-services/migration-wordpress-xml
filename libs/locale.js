'use strict';
/**
 * External module Dependencies.
 */
var mkdirp = require('mkdirp'),
  path = require('path'),
  fs = require('fs'),
  when = require('when'),
  axios = require('axios'),
  chalk = require('chalk');
const config = require('../config');

/**
 * Internal module Dependencies .
 */
var helper = require('../utils/helper');
var localeConfig = config.modules.locale;
var localeFolderName = localeConfig.dirName;
var localesFolderPath = path.resolve(config.data, localeFolderName);

if (!fs.existsSync(localesFolderPath)) {
  mkdirp.sync(localesFolderPath);
  helper.writeFile(path.join(localesFolderPath, localeConfig.fileName));
  helper.writeFile(path.join(localesFolderPath, localeConfig.masterfile));
}

function ExtractLocale() {}

ExtractLocale.prototype = {
  saveLocale: function () {
    return when.promise(async function (resolve, reject) {
      try {
        var localeData = helper.readFile(
          path.join(localesFolderPath, localeConfig.masterfile)
        );
        const response = await axios.get(
          'https://app.contentstack.com/api/v3/locales?include_all=true'
        );

        if (
          response?.data?.locales &&
          Object.hasOwn(response?.data?.locales, global.masterLocale)
        ) {
          localeData['locale_uid'] = {
            uid: 'locale_uid',
            code: global.masterLocale,
            fallback_locale: null,
            name: response.data.locales[global.masterLocale],
          };
          helper.writeFile(
            path.join(localesFolderPath, localeConfig.masterfile),
            JSON.stringify(localeData, null, 4)
          );
        }

        console.log(
          chalk.green(`${global.masterLocale}`),
          ` master-locale created successfully`
        );
        resolve();
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
  },
  start: function () {
    successLogger(`Creating Locale folder...`);
    var self = this;
    return when.promise(function (resolve, reject) {
      self
        .saveLocale()
        .then(function () {
          resolve();
        })
        .catch(function () {
          reject();
        });
    });
  },
};

module.exports = ExtractLocale;
