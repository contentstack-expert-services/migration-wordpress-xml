/**
 * External module Dependencies.
 */
var mkdirp = require('mkdirp'),
  path = require('path'),
  fs = require('fs'),
  when = require('when');
const config = require('../config');
const { JSDOM } = require('jsdom');
const { htmlToJson } = require('@contentstack/json-rte-serializer');

const chalk = require('chalk');

/**
 * Internal module Dependencies.
 */
var helper = require('../utils/helper');

var categoryConfig = config.modules.categories;
var categoryFolderName = global.wordPress_prefix
  ? `${global.wordPress_prefix
      .replace(/^\d+/, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/(^_+)|(_+$)/g, '')
      .toLowerCase()}_${categoryConfig.dirName}`
  : categoryConfig.dirName;
var categoryFolderPath = path.resolve(
  config.data,
  config.entryfolder,
  categoryFolderName
);

/**
 * Create folders and files
 */
if (!fs.existsSync(categoryFolderPath)) {
  mkdirp.sync(categoryFolderPath);
  helper.writeFile(path.join(categoryFolderPath, categoryConfig.fileName));
}

function ExtractCategories() {}

ExtractCategories.prototype = {
  parentCategoires: function (catId, data, categoiesData) {
    var parentId = helper.readFile(
      path.join(process.cwd(), config.data, 'reference', 'reference.json')
    );
    var catParent = [];

    var getParent = data['parent'];
    if (Array.isArray(getParent)) {
      Object.keys(getParent).forEach((key) => {});
    } else {
      Object.keys(parentId).forEach((key) => {
        if (getParent === parentId[key].slug) {
          catParent.push({
            uid: parentId[key].uid,
            _content_type_uid: parentId[key].content_type,
          });
        }
      });
    }
    categoiesData[catId]['parent'] = catParent;
  },
  saveCategories: function (categoryDetails) {
    var self = this;
    return when.promise(function (resolve, reject) {
      var categorydata = helper.readFile(
        path.join(categoryFolderPath, categoryConfig.fileName)
      );

      if (categoryDetails.length === undefined) {
        var url = `/category/${categoryDetails['wp:term_id']}`;

        // for HTML RTE to JSON RTE convert
        const dom = new JSDOM('');
        let htmlDoc = dom.window.document.querySelector('body');
        const jsonValue = htmlToJson(htmlDoc);
        var description = jsonValue;

        categorydata[`category_${categoryDetails['wp:term_id']}`] = {
          uid: `category_${categoryDetails['wp:term_id']}`,
          title: `${categoryDetails['wp:cat_name']}`,
          url: url,
          nicename: `${categoryDetails['wp:category_nicename']}`,
          description: description,
          parent: '',
        };
      } else {
        categoryDetails.map(function (data) {
          var title = data['title'];
          title = title.replace(/&amp;/g, '&');
          var uid = data['id'];
          var description = data['description'] || '';

          // for HTML RTE to JSON RTE convert
          const dom = new JSDOM(description.replace(/&amp;/g, '&'));
          let htmlDoc = dom.window.document.querySelector('body');
          const jsonValue = htmlToJson(htmlDoc);
          description = jsonValue;

          var nicename = data['nicename'] || '';

          var url = '/category/' + uid;
          categorydata[`category_${uid}`] = {
            uid: `category_${uid}`,
            title: title,
            url: url,
            nicename: nicename,
            description: description,
          };
          self.parentCategoires(`category_${uid}`, data, categorydata);

          fs.writeFileSync(
            path.join(categoryFolderPath, categoryConfig.fileName),
            JSON.stringify(categorydata, null, 4)
          );
        });
      }
      console.log(
        chalk.green(
          `${categoryDetails.length}`,
          ' Categories exported successfully'
        )
      );
      resolve();
    });
  },
  getAllCategories: function () {
    var self = this;
    return when.promise(function (resolve, reject) {
      var categorisname;
      var alldata = helper.readFile(
        path.join(config.data, config.json_filename)
      );
      var categories =
        alldata?.rss?.channel?.['wp:category'] ??
        alldata?.channel?.['wp:category'] ??
        '';
      var categoriesArrray = [];
      if (categories !== '') {
        if (categories.length > 0) {
          categories.forEach(function (categoryinfo, instanceIndex) {
            if (categorisname && categorisname.length > 0) {
              if (
                categorisname.indexOf(categoryinfo['wp:category_nicename']) !=
                -1
              ) {
                categoriesArrray.push({
                  id: categoryinfo['wp:term_id'],
                  title: categoryinfo['wp:cat_name'],
                  nicename: categoryinfo['wp:category_nicename'],
                  description: categoryinfo['wp:category_description'],
                  parent: categoryinfo['wp:category_parent'],
                });
              }
            } else {
              categoriesArrray.push({
                id: categoryinfo['wp:term_id'],
                title: categoryinfo['wp:cat_name'],
                nicename: categoryinfo['wp:category_nicename'],
                description: categoryinfo['wp:category_description'],
                parent: categoryinfo['wp:category_parent'],
              });
            }
          });
          if (categoriesArrray.length > 0) {
            self.saveCategories(categoriesArrray);
            resolve();
          } else {
            resolve();
          }
        } else {
          categoriesArrray.push({
            id: categories['wp:term_id'],
            title: categories['wp:cat_name'],
            nicename: categories['wp:category_nicename'],
            description: categories['wp:category_description'],
            parent: categories['wp:category_parent'],
          });
          if (categoriesArrray.length > 0) {
            self.saveCategories(categoriesArrray);
            resolve();
          } else {
            resolve();
          }
        }
      } else {
        console.log(chalk.red('\nno categories found'));
        resolve();
      }
    });
  },
  start: function () {
    successLogger(`Exporting ${categoryFolderName}...`);
    var self = this;
    return when.promise(function (resolve, reject) {
      self
        .getAllCategories()
        .then(function () {
          resolve();
        })
        .catch(function () {
          reject();
        });
    });
  },
};

module.exports = ExtractCategories;
