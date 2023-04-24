/**
 * External module Dependencies.
 */
var mkdirp = require("mkdirp"),
  path = require("path"),
  _ = require("lodash"),
  fs = require("fs"),
  when = require("when");

const { JSDOM } = require("jsdom");
const { htmlToJson } = require("@contentstack/json-rte-serializer");

const chalk = require("chalk");
const cliProgress = require("cli-progress");
const colors = require("ansi-colors");
/**

/**
 * Internal module Dependencies.
 */
var helper = require("../utils/helper");

var categoryConfig = config.modules.categories,
  categoryFolderPath = path.resolve(
    config.data,
    config.entryfolder,
    categoryConfig.dirName
  ),
  masterFolderPath = path.resolve(config.data, "master", config.entryfolder);

/**
 * Create folders and files
 */
if (!fs.existsSync(categoryFolderPath)) {
  mkdirp.sync(categoryFolderPath);
  helper.writeFile(path.join(categoryFolderPath, categoryConfig.fileName));
  mkdirp.sync(masterFolderPath);
  helper.writeFile(
    path.join(masterFolderPath, categoryConfig.masterfile),
    '{"en-us":{}}'
  );
}

function ExtractCategories() {}

ExtractCategories.prototype = {
  customBar: null,
  initalizeLoader: function () {
    this.customBar = new cliProgress.SingleBar({
      format:
        "{title}|" +
        colors.cyan("{bar}") +
        "|  {percentage}%  || {value}/{total} completed",
      barCompleteChar: "\u2588",
      barIncompleteChar: "\u2591",
      hideCursor: true,
    });
  },
  destroyLoader: function () {
    if (this.customBar) {
      this.customBar.stop();
    }
  },
  saveCategories: function (categoryDetails) {
    var self = this;
    return when.promise(function (resolve, reject) {
      self.customBar.start(categoryDetails.length, 0, {
        title: "Migrating Categories ",
      });

      var categorydata = helper.readFile(
        path.join(categoryFolderPath, categoryConfig.fileName)
      );
      var categorymaster = helper.readFile(
        path.join(masterFolderPath, categoryConfig.masterfile)
      );
      var parentId = helper.readFile(
        path.join(
          process.cwd(),
          "wordPressMigrationData",
          "entries",
          "reference",
          "en-us.json"
        )
      );

      categoryDetails.map(function (data, index) {
        var catParent = [];
        var getParent = data["parent"];
        if (Array.isArray(getParent)) {
          Object.keys(parentId).forEach((key) => {});
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
        var title = data["title"];
        title = title.replace(/&amp;/g, "&");
        var uid = data["id"];
        var description = data["description"] || "";

        // for HTML RTE to JSON RTE convert
        const dom = new JSDOM(description.replace(/&amp;/g, "&"));
        let htmlDoc = dom.window.document.querySelector("body");
        const jsonValue = htmlToJson(htmlDoc);
        description = jsonValue;

        var nicename = data["nicename"] || "";

        var url = "/category/" + uid;
        categorydata[`category_${uid}`] = {
          uid: `category_${uid}`,
          title: title,
          url: url,
          nicename: nicename,
          description: description,
          parent: catParent,
        };
        self.customBar.increment();
      });
      helper.writeFile(
        path.join(categoryFolderPath, categoryConfig.fileName),
        JSON.stringify(categorydata, null, 4)
      );
      helper.writeFile(
        path.join(masterFolderPath, categoryConfig.masterfile),
        JSON.stringify(categorymaster, null, 4)
      );
      // console.log(
      //   chalk.green(
      //     `\n${categoryDetails.length} Categories exported successfully`
      //   )
      // );
      resolve();
    });
  },
  getAllCategories: function () {
    var self = this;
    return when.promise(function (resolve, reject) {
      var categorisname;
      if (filePath) {
        //if user provide custom name of category
        if (fs.existsSync(filePath)) {
          categorisname = fs.readFileSync(filePath, "utf-8");
        }
      }
      if (categorisname) {
        categorisname = categorisname.split(",");
      }
      var alldata = helper.readFile(
        path.join(config.data, config.json_filename)
      );
      var categories =
        alldata?.rss?.channel?.["wp:category"] ??
        alldata?.channel?.["wp:category"] ??
        "";
      var posts =
        alldata?.rss?.channel?.["item"] ?? alldata?.channel?.["item"] ?? "";
      var categoriesArrray = [];
      if (categories !== "") {
        if (categories.length > 0) {
          categories.forEach(function (categoryinfo, instanceIndex) {
            if (categorisname && categorisname.length > 0) {
              if (
                categorisname.indexOf(categoryinfo["wp:category_nicename"]) !=
                -1
              ) {
                categoriesArrray.push({
                  id: categoryinfo["wp:term_id"],
                  title: categoryinfo["wp:cat_name"],
                  nicename: categoryinfo["wp:category_nicename"],
                  description: categoryinfo["wp:category_description"],
                  parent: categoryinfo["wp:category_parent"],
                });
              }
            } else {
              categoriesArrray.push({
                id: categoryinfo["wp:term_id"],
                title: categoryinfo["wp:cat_name"],
                nicename: categoryinfo["wp:category_nicename"],
                description: categoryinfo["wp:category_description"],
                parent: categoryinfo["wp:category_parent"],
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
            id: categories["wp:term_id"],
            title: categories["wp:cat_name"],
            nicename: categories["wp:category_nicename"],
            description: categories["wp:category_description"],
            parent: categories["wp:category_parent"],
          });
          if (categoriesArrray.length > 0) {
            self.saveCategories(categoriesArrray);
            resolve();
          } else {
            resolve();
          }
        }
      } else if (posts) {
        posts.map(function (post, instanceIndex) {
          if (post["wp:post_type"] == "post") {
            if (post["wp:status"] == "publish") {
              var categories = post["category"];
              if (Array.isArray(categories)) {
                categories.map(function (category, instanceIndex) {
                  if (category["$"]["domain"] == "category") {
                    if (categorisname && categorisname.length > 0) {
                      if (
                        categorisname.indexOf(category["$"]["nicename"]) != -1
                      ) {
                        categoriesArrray.push({
                          title: category["_"],
                          nicename: category["$"]["nicename"],
                        });
                      }
                    } else {
                      categoriesArrray.push({
                        title: category["_"],
                        nicename: category["$"]["nicename"],
                      });
                    }
                  }
                });
              } else {
                if (categories["$"]["domain"] == "category") {
                  if (categorisname && categorisname.length > 0) {
                    if (
                      categorisname.indexOf(categories["$"]["nicename"]) != -1
                    ) {
                      categoriesArrray.push({
                        title: categories["_"],
                        nicename: categories["$"]["nicename"],
                      });
                    }
                  } else {
                    categoriesArrray.push({
                      title: categories["_"],
                      nicename: categories["$"]["nicename"],
                    });
                  }
                }
              }
            }
          }
        });
        categoriesArrray = _.uniqBy(categoriesArrray, "nicename");
        if (categoriesArrray.length > 0) {
          self.saveCategories(categoriesArrray);
          resolve();
        } else {
          console.log(chalk.red("\nno categories found"));
          resolve();
        }
      } else {
        console.log(chalk.red("\nno categories found"));
        resolve();
      }
    });
  },
  start: function () {
    // successLogger("exporting categories...");
    var self = this;
    this.initalizeLoader();
    return when.promise(function (resolve, reject) {
      self
        .getAllCategories()
        .then(function () {
          resolve();
        })
        .catch(function () {
          reject();
        })
        .finally(function () {
          self.destroyLoader();
        });
    });
  },
};

module.exports = ExtractCategories;
