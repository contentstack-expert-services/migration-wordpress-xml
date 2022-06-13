/**
 * External module Dependencies.
 */
var mkdirp = require("mkdirp"),
  path = require("path"),
  _ = require("lodash"),
  fs = require("fs"),
  parseString = require("xml2js").parseString,
  when = require("when");

const cliProgress = require("cli-progress");
const colors = require("ansi-colors");
const chalk = require("chalk");
/**
 * Internal module Dependencies.
 */
var helper = require("../utils/helper");

var authorConfig = config.modules.authors,
  authorsFolderPath = path.resolve(
    config.data,
    config.entryfolder,
    authorConfig.dirName
  ),
  masterFolderPath = path.resolve(config.data, "master", config.entryfolder);

/**
 * Create folders and files if they are not created
 */
if (!fs.existsSync(authorsFolderPath)) {
  mkdirp.sync(authorsFolderPath);
  helper.writeFile(path.join(authorsFolderPath, authorConfig.fileName));
  mkdirp.sync(masterFolderPath);
  helper.writeFile(
    path.join(masterFolderPath, authorConfig.masterfile),
    '{"en-us":{}}'
  );
}

function ExtractAuthors() {
  if (!fs.existsSync(path.join(config.data, config.json_filename))) {
    var xml_data = helper.readXMLFile(config.xml_filename);
    parseString(xml_data, { explicitArray: false }, function (err, result) {
      if (err) {
        errorLogger("failed to parse xml: ", err);
      } else {
        helper.writeFile(
          path.join(config.data, config.json_filename),
          JSON.stringify(result, null, 4)
        );
      }
    });
  }
}

ExtractAuthors.prototype = {
  customBar: null,
  initalizeLoader: function () {
    this.customBar = new cliProgress.SingleBar({
      format:
        "Migrating Authors    |" +
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
  saveAuthors: function (authorDetails) {
    var self = this;
    return when.promise(function (resolve, reject) {
      self.customBar.start(authorDetails.length, 0, {
        // title: "Migrating Authors   ",
      });
      var slugRegExp = new RegExp("[^a-z0-9_-]+", "g");
      var authordata = helper.readFile(
        path.join(authorsFolderPath, authorConfig.fileName)
      );
      var authormaster = helper.readFile(
        path.join(masterFolderPath, authorConfig.masterfile)
      );
      authorDetails.map(function (data, index) {
        var title = `authors_${data["wp:author_id"]}`;
        if (title === undefined) {
          var title = data["wp:author_login"];
          var url = "/author/" + title.toLowerCase().replace(slugRegExp, "-");
          authordata[title] = {
            uid: data["wp:author_id"],
            title: data["wp:author_login"],
            url: url,
            email: data["wp:author_email"],
            first_name: data["wp:author_first_name"],
            last_name: data["wp:author_last_name"],
          };
        } else {
          var url = "/author/" + title.toLowerCase().replace(slugRegExp, "-");
          authordata[title] = {
            uid: title,
            title: data["wp:author_login"],
            url: url,
            email: data["wp:author_email"],
            first_name: data["wp:author_first_name"],
            last_name: data["wp:author_last_name"],
          };
        }
        authormaster["en-us"][title] = "";
        self.customBar.increment();
      });
      helper.writeFile(
        path.join(authorsFolderPath, authorConfig.fileName),
        JSON.stringify(authordata, null, 4)
      );
      helper.writeFile(
        path.join(masterFolderPath, authorConfig.masterfile),
        JSON.stringify(authormaster, null, 4)
      );
      // console.log(
      //   chalk.green(`\n${authorDetails.length} Authors exported successfully`)
      // );
      resolve();
    });
  },
  getAllAuthors: function () {
    var self = this;
    return when.promise(function (resolve, reject) {
      var alldata = helper.readFile(
        path.join(config.data, config.json_filename)
      );
      var authors = alldata.rss.channel["wp:author"];
      if (authors) {
        if (authors.length > 0) {
          if (!filePath) {
            self.saveAuthors(authors);
            resolve();
          } else {
            //if want to custom export
            var authorids = [];
            if (fs.existsSync(filePath)) {
              authorids = fs.readFileSync(filePath, "utf-8").split(",");
            }
            if (authorids.length > 0) {
              var authordetails = [];
              authorids.map(function (author, index) {
                var index = _.findIndex(authors, { "wp:author_id": author });
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
          if (typeof authors == "object") {
            var singleAuthor = [];
            if (!filePath) {
              singleAuthor.push(authors);
              self.saveAuthors(singleAuthor);
            } else {
              var authorids = [];
              if (fs.existsSync(filePath)) {
                authorids = fs.readFileSync(filePath, "utf-8").split(",");
              }
              if (authorids.indexOf(authors["wp:author_id"]) != -1) {
                singleAuthor.push(authors);
                self.saveAuthors(singleAuthor);
              } else {
                console.log(chalk.red("\nno authors uid found"));
              }
            }
          } else {
            console.log(chalk.red("\nno authors found"));
          }
          resolve();
        }
      } else {
        console.log(chalk.red("\nno authors found"));
        resolve();
      }
    });
  },
  start: function () {
    // successLogger("exporting authors...");
    var self = this;
    this.initalizeLoader();
    return when.promise(function (resolve, reject) {
      self
        .getAllAuthors()
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

module.exports = ExtractAuthors;
