/**
 * External module Dependencies.
 */
var mkdirp = require("mkdirp"),
  path = require("path"),
  fs = require("fs");

/**
 * Internal module Dependencies .
 */
var helper = require("../utils/helper");

var termsConfig = config.contentmodules.terms,
  termsFolderPath = path.resolve(config.data, config.contenttypes) || {};

/**
 * Create folders and files if they are not created
 */

if (!fs.existsSync(termsFolderPath)) {
  mkdirp.sync(termsFolderPath);
  helper.writeFile(path.join(termsFolderPath, termsConfig.fileName));
}

function ExtractTerms() {
  let termsSchema = {
    title: "Terms",
    uid: "terms",
    schema: [
      {
        display_name: "Title",
        uid: "title",
        data_type: "text",
        field_metadata: {
          _default: true,
        },
        unique: false,
        mandatory: false,
        multiple: false,
      },
      {
        display_name: "URL",
        uid: "url",
        data_type: "text",
        field_metadata: {
          _default: true,
        },
        unique: true,
        mandatory: false,
        multiple: false,
      },
      {
        display_name: "Taxonomy",
        uid: "taxonomy",
        data_type: "text",
        field_metadata: {
          _default: true,
        },
        unique: false,
        mandatory: false,
        multiple: false,
      },
      {
        display_name: "Slug",
        uid: "slug",
        data_type: "text",
        field_metadata: {
          _default: true,
        },
        unique: false,
        mandatory: false,
        multiple: false,
      },
    ],
    options: {
      is_page: true,
      title: "title",
      sub_title: [],
      url_pattern: "/:title",
      _version: 1,
      url_prefix: "/terms/",
      description: "Schema for Terms",
      singleton: false,
    },
    description: "",
  };
  helper.writeFile(
    path.join(
      process.cwd(),
      "wordPressMigrationData",
      "content_types",
      termsConfig.fileName
    ),
    JSON.stringify(termsSchema, null, 4),
    (err) => {
      if (err) throw err;
    }
  );
}

ExtractTerms.prototype = {
  start: function () {},
};

module.exports = ExtractTerms;
