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

var tagsConfig = config.contentmodules.tag,
  tagsFolderPath = path.resolve(config.data, config.contenttypes) || {};

/**
 * Create folders and files if they are not created
 */

if (!fs.existsSync(tagsFolderPath)) {
  mkdirp.sync(tagsFolderPath);
  helper.writeFile(path.join(tagsFolderPath, tagsConfig.fileName));
}

function ExtractTags() {
  let tagsSchema = {
    title: "Tag",
    uid: "tag",
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
      {
        data_type: "text",
        display_name: "Description",
        uid: "description",
        field_metadata: {
          description: "",
          default_value: "",
          multiline: true,
        },
        format: "",
        error_messages: { format: "" },
        mandatory: false,
        multiple: false,
        non_localizable: false,
        unique: false,
      },
    ],
    options: {
      is_page: true,
      title: "title",
      sub_title: [],
      url_pattern: "/:title",
      _version: 1,
      url_prefix: "/tags/",
      description: "List of tags",
      singleton: false,
    },
    description: "Schema for Tags",
  };
  helper.writeFile(
    path.join(
      process.cwd(),
      "wordPressMigrationData",
      "content_types",
      tagsConfig.fileName
    ),
    JSON.stringify(tagsSchema, null, 4),
    (err) => {
      if (err) throw err;
    }
  );
}

ExtractTags.prototype = {
  start: function () {},
};

module.exports = ExtractTags;
