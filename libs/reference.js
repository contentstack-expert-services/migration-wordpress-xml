/**
 * External module Dependencies.
 */
var mkdirp = require("mkdirp"),
  path = require("path"),
  fs = require("fs"),
  when = require("when"),
  xml2js = require("xml2js");

/**
 * Internal module Dependencies.
 */
var helper = require("../utils/helper");

var referenceConfig = config.modules.references,
  referenceFolderPath = path.resolve(
    config.data,
    config.entryfolder,
    referenceConfig.dirName
  );

/**
 * Create folders and files
 */
if (!fs.existsSync(referenceFolderPath)) {
  mkdirp.sync(referenceFolderPath);
  helper.writeFile(path.join(referenceFolderPath, referenceConfig.fileName));
}

function ExtractReference() {
  var self = this;
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
  } else {
    self.start();
  }
}

ExtractReference.prototype = {
  saveReference: function (referenceDetails) {
    return when.promise(function (resolve, reject) {
      var referenceData = helper.readFile(
        path.join(referenceFolderPath, referenceConfig.fileName)
      );

      referenceDetails.map(function (data, index) {
        var uid = data["id"];
        var slug = data["slug"];
        var content_type = data["content_type"] || "";
        // this is for reference purpose
        referenceData[uid] = {
          uid: uid,
          slug: slug,
          content_type: content_type,
        };
      });
      helper.writeFile(
        path.join(referenceFolderPath, referenceConfig.fileName),
        JSON.stringify(referenceData, null, 4)
      );

      resolve();
    });
  },
  start: function () {
    var self = this;
    return when.promise(function (resolve, reject) {
      var alldata = helper.readFile(
        path.join(config.data, config.json_filename)
      );
      var referenceTags =
        alldata?.rss?.channel?.["wp:tag"] || alldata?.channel?.["wp:tag"] || "";
      var referenceTerms =
        alldata?.rss?.channel?.["wp:term"] ||
        alldata?.channel?.["wp:term"] ||
        "";
      var referenceCategories =
        alldata?.rss?.channel?.["wp:category"] ||
        alldata?.channel?.["wp:category"] ||
        "";
      var referenceArrray = [];
      if (
        (referenceTags && referenceTags.length > 0) ||
        (referenceTerms && referenceTerms.length > 0) ||
        (referenceCategories && referenceCategories.length > 0)
      ) {
        referenceTags.map(function (taginfo) {
          referenceArrray.push({
            id: `tags_${taginfo["wp:term_id"]}`,
            slug: taginfo["wp:tag_slug"],
            content_type: "tag",
          });
        });
        referenceTerms.map(function (terminfo) {
          referenceArrray.push({
            id: `terms_${terminfo["wp:term_id"]}`,
            slug: terminfo["wp:term_slug"],
            content_type: "terms",
          });
        });
        referenceCategories.map(function (catinfo) {
          referenceArrray.push({
            id: `category_${catinfo["wp:term_id"]}`,
            slug: catinfo["wp:category_nicename"],
            content_type: "categories",
          });
        });
        if (referenceArrray.length > 0) {
          self.saveReference(referenceArrray);
          resolve();
        } else {
          resolve();
        }
      } else {
        resolve();
      }
    });
  },
};

module.exports = ExtractReference;
