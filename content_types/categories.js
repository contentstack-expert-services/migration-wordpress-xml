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

var categoriesConfig = config.contentmodules.categories,
  categoriesFolderPath = path.resolve(config.data, config.contenttypes) || {};

/**
 * Create folders and files if they are not created
 */

if (!fs.existsSync(categoriesFolderPath)) {
  mkdirp.sync(categoriesFolderPath);
  helper.writeFile(path.join(categoriesFolderPath, categoriesConfig.fileName));
}

function ExtractCategories() {
  let categoriesSchema = {
    title: "Categories",
    uid: "categories",
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
        display_name: "Nicename",
        uid: "nicename",
        data_type: "text",
        field_metadata: {
          _default: true,
        },
        unique: false,
        mandatory: false,
        multiple: false,
      },
      {
        data_type: "json",
        display_name: "Description",
        uid: "description",
        field_metadata: {
          allow_json_rte: true,
          embed_entry: true,
          description: "",
          default_value: "",
          multiline: false,
          rich_text_type: "advanced",
          options: [],
          ref_multiple_content_types: true,
        },
        format: "",
        error_messages: { format: "" },
        reference_to: ["sys_assets"],
        multiple: false,
        non_localizable: false,
        unique: false,
        mandatory: false,
      },
      {
        data_type: "reference",
        display_name: "Parent",
        reference_to: "categories",
        field_metadata: {
          ref_multiple: false,
        },
        uid: "parent",
        multiple: false,
        mandatory: false,
        unique: false,
      },
    ],
    options: {
      is_page: true,
      title: "title",
      sub_title: [],
      url_pattern: "/:title",
      _version: 1,
      url_prefix: "/category/",
      description: "List of categories",
      singleton: false,
    },
    description: "Schema for Categories",
  };
  helper.writeFile(
    path.join(
      process.cwd(),
      "wordPressMigrationData",
      "content_types",
      categoriesConfig.fileName
    ),
    JSON.stringify(categoriesSchema, null, 4),
    (err) => {
      if (err) throw err;
    }
  );
}

ExtractCategories.prototype = {
  start: function () {},
};

module.exports = ExtractCategories;
