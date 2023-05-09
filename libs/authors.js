/**
 * External module Dependencies.
 */
var mkdirp = require("mkdirp"),
  path = require("path"),
  _ = require("lodash"),
  fs = require("fs"),
  when = require("when"),
  xml2js = require("xml2js");

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
  );

/**
 * Create folders and files if they are not created
 */
if (!fs.existsSync(authorsFolderPath)) {
  mkdirp.sync(authorsFolderPath);
  helper.writeFile(path.join(authorsFolderPath, authorConfig.fileName));
}

function ExtractAuthors() {
  if (!fs.existsSync(path.join(config.data, config.json_filename))) {
    const xmlFilePath = config.xml_filename;
    const jsonFilePath = path.join(config.data, config.json_filename);
    const xml = fs.readFileSync(xmlFilePath, "utf8");
    const parser = new xml2js.Parser({
      attrkey: "attributes",
      charkey: "text",
    });
    parser.parseString(xml, (err, result) => {
      if (err) {
        console.error(`Error parsing XML: ${err.message}`);
      } else {
        const json = JSON.stringify(result, null, 2);
        fs.writeFile(jsonFilePath, json, "utf8", (err) => {
          if (err) {
            console.error(`Error writing JSON: ${err.message}`);
          } else {
            console.log(`XML to JSON conversion complete.`);
          }
        });
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

      authorDetails.map(function (data, index) {
        var uid =
          data["wp:author_id"] === undefined
            ? `authors_${data["wp:author_login"]}`
            : `authors_${data["wp:author_id"]}`;

        var url = "/author/" + uid.toLowerCase().replace(slugRegExp, "-");
        authordata[uid] = {
          uid: uid,
          title: data["wp:author_login"],
          url: url,
          email: data["wp:author_email"],
          first_name: data["wp:author_first_name"],
          last_name: data["wp:author_last_name"],
        };

        self.customBar.increment();
      });
      helper.writeFile(
        path.join(authorsFolderPath, authorConfig.fileName),
        JSON.stringify(authordata, null, 4)
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
        alldata?.rss?.channel?.["wp:author"] ??
        alldata?.channel?.["wp:author"] ??
        "";
      if (authors !== "") {
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
