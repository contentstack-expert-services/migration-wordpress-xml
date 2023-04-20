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

var authorConfig = config.contentmodules.authors,
  authorsFolderPath = path.resolve(config.data, config.contenttypes) || {};

/**
 * Create folders and files if they are not created
 */

if (!fs.existsSync(authorsFolderPath)) {
  mkdirp.sync(authorsFolderPath);
  helper.writeFile(path.join(authorsFolderPath, authorConfig.fileName));
}

function ExtractAuthors() {
  var authorsSchema = {
    title: "Authors",
    uid: "authors",
    schema: [
      {
        display_name: "Title",
        uid: "title",
        data_type: "text",
        field_metadata: {
          _default: true,
        },
        unique: false,
        mandatory: true,
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
        data_type: "text",
        display_name: "Email",
        uid: "email",
        field_metadata: {
          description: "",
          default_value: "",
        },
        format: "",
        multiple: false,
        mandatory: false,
        unique: false,
      },
      {
        data_type: "text",
        display_name: "First Name",
        uid: "first_name",
        field_metadata: {
          description: "",
          default_value: "",
        },
        format: "",
        multiple: false,
        mandatory: false,
        unique: false,
      },
      {
        data_type: "text",
        display_name: "Last Name",
        uid: "last_name",
        field_metadata: {
          description: "",
          default_value: "",
        },
        format: "",
        multiple: false,
        mandatory: false,
        unique: false,
      },
      {
        data_type: "json",
        display_name: "Biographical Info",
        uid: "biographical_info",
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
    ],
    options: {
      is_page: true,
      title: "title",
      sub_title: [],
      description: "list of authors",
      _version: 1,
      url_prefix: "/author/",
      url_pattern: "/:title",
      singleton: false,
    },
    description: "Schema for Authors",
  };

  helper.writeFile(
    path.join(
      process.cwd(),
      "wordPressMigrationData",
      "content_types",
      authorConfig.fileName
    ),
    JSON.stringify(authorsSchema, null, 4),
    (err) => {
      if (err) throw err;
    }
  );
}

ExtractAuthors.prototype = {
  start: function () {},
};

module.exports = ExtractAuthors;
