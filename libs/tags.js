/**
 * External module Dependencies.
 */
var mkdirp = require("mkdirp"),
  path = require("path"),
  fs = require("fs"),
  xml2js = require("xml2js");
when = require("when");

const cliProgress = require("cli-progress");
const colors = require("ansi-colors");
const chalk = require("chalk");
/**
 * Internal module Dependencies.
 */
var helper = require("../utils/helper");

var tagsConfig = config.modules.tag,
  tagsFolderPath = path.resolve(
    config.data,
    config.entryfolder,
    tagsConfig.dirName
  );

/**
 * Create folders and files
 */
if (!fs.existsSync(tagsFolderPath)) {
  mkdirp.sync(tagsFolderPath);
  helper.writeFile(path.join(tagsFolderPath, tagsConfig.fileName));
}

function ExtractTags() {
  if (!fs.existsSync(path.join(config.data, config.json_filename))) {
    const xmlFilePath = config.xml_filename;
    const jsonFilePath = path.join(config.data, config.json_filename);
    const xml = fs.readFileSync(xmlFilePath, "utf8");
    const parser = new xml2js.Parser({
      attrkey: "attributes",
      charkey: "text",
      explicitArray: false,
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

ExtractTags.prototype = {
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
  saveTags: function (tagDetails) {
    var self = this;
    return when.promise(function (resolve, reject) {
      self.customBar.start(tagDetails.length, 0, {
        title: "Migrating Tags       ",
      });
      var tagdata = helper.readFile(
        path.join(tagsFolderPath, tagsConfig.fileName)
      );

      tagDetails.map(function (data, index) {
        var title = data["tag_name"];
        var uid = `tags_${data["id"]}`;
        var slug = data["tag_slug"];
        var description = data["description"] || "";
        var url = "/tags/" + uid;
        tagdata[uid] = {
          uid: uid,
          title: title,
          url: url,
          slug: slug,
          description: description,
        };
        self.customBar.increment();
      });
      helper.writeFile(
        path.join(tagsFolderPath, tagsConfig.fileName),
        JSON.stringify(tagdata, null, 4)
      );

      // console.log(
      //   chalk.green(`${tagDetails.length} Tags exported successfully`)
      // );
      resolve();
    });
  },
  getAllTags: function () {
    var self = this;
    return when.promise(function (resolve, reject) {
      var alldata = helper.readFile(
        path.join(config.data, config.json_filename)
      );
      var tags =
        alldata?.rss?.channel?.["wp:tag"] ?? alldata?.channel?.["wp:tag"] ?? "";
      var tagsArrray = [];
      if (tags !== "") {
        if (tags.length > 0) {
          tags.forEach(function (taginfo) {
            tagsArrray.push({
              id: taginfo["wp:term_id"],
              tag_name: taginfo["wp:tag_name"],
              tag_slug: taginfo["wp:tag_slug"],
              description: taginfo["wp:tag_description"],
            });
          });
        } else {
          tagsArrray.push({
            id: tags["wp:term_id"],
            tag_name: tags["wp:tag_name"],
            tag_slug: tags["wp:tag_slug"],
            description: tags["wp:tag_description"],
          });
        }
        if (tagsArrray.length > 0) {
          self.saveTags(tagsArrray);
          resolve();
        } else {
          console.log(chalk.red("\nno tags found"));
          resolve();
        }
      } else {
        console.log(chalk.red("\nno tags found"));
        resolve();
      }
    });
  },
  start: function () {
    var self = this;
    this.initalizeLoader();
    return when.promise(function (resolve, reject) {
      self
        .getAllTags()
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

module.exports = ExtractTags;
