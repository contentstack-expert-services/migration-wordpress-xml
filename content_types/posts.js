/**
 * External module Dependencies.
 */
var mkdirp = require("mkdirp"),
  path = require("path"),
  fs = require("fs"),
  _ = require("lodash");

/**
 * Internal module Dependencies .
 */
var helper = require("../utils/helper");
var postConfig = config.contentmodules.posts,
  postFolderPath = path.resolve(config.data, config.contenttypes) || {};

/**
 * Create folders and files if they are not created
 */

if (!fs.existsSync(postFolderPath)) {
  mkdirp.sync(postFolderPath);
  helper.writeFile(path.join(postFolderPath, postConfig.fileName));
}

function ExtractPosts() {
  let postSchema = {
    title: "Posts",
    uid: "posts",
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
        data_type: "reference",
        display_name: "Author",
        reference_to: ["authors"],
        field_metadata: {
          ref_multiple: true,
          ref_multiple_content_types: true,
        },
        uid: "author",
        unique: false,
        mandatory: false,
        multiple: false,
      },
      {
        data_type: "reference",
        display_name: "Categories",
        reference_to: ["categories"],
        field_metadata: {
          ref_multiple: true,
          ref_multiple_content_types: true,
        },
        uid: "category",
        unique: false,
        mandatory: false,
        multiple: false,
      },
      {
        data_type: "file",
        display_name: "Featured Image",
        uid: "featured_image",
        field_metadata: {
          description: "",
          rich_text_type: "standard",
        },
        unique: false,
        mandatory: false,
        multiple: true,
      },
      {
        data_type: "isodate",
        display_name: "Date",
        uid: "date",
        startDate: null,
        endDate: null,
        field_metadata: { description: "", default_value: {} },
        mandatory: false,
        multiple: false,
        non_localizable: false,
        unique: false,
      },
      {
        data_type: "json",
        display_name: "Body",
        uid: "full_description",
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
        data_type: "text",
        display_name: "Excerpt",
        uid: "excerpt",
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
      {
        data_type: "reference",
        display_name: "Terms",
        reference_to: ["terms"],
        field_metadata: {
          ref_multiple: true,
          ref_multiple_content_types: true,
        },
        uid: "terms",
        unique: false,
        mandatory: false,
        multiple: false,
      },
      {
        data_type: "reference",
        display_name: "Tags",
        reference_to: ["tag"],
        field_metadata: {
          ref_multiple: true,
          ref_multiple_content_types: true,
        },
        uid: "tag",
        unique: false,
        mandatory: false,
        multiple: false,
      },
      {
        data_type: "group",
        display_name: "SEO",
        uid: "seo",
        unique: false,
        mandatory: false,
        multiple: false,
        schema: [
          {
            data_type: "text",
            display_name: "Title",
            uid: "title",
            field_metadata: {
              description: "",
              default_value: "",
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
            unique: false,
            mandatory: false,
            multiple: false,
          },
          {
            data_type: "text",
            display_name: "Keywords",
            uid: "keywords",
            field_metadata: {
              description: "",
              default_value: "",
            },
            unique: false,
            mandatory: false,
            multiple: false,
          },
          {
            data_type: "boolean",
            display_name: "Robots Meta NOINDEX",
            uid: "robots_meta_noindex",
            field_metadata: {
              description: "",
              default_value: "",
            },
            unique: false,
            mandatory: false,
            multiple: false,
          },
          {
            data_type: "boolean",
            display_name: "Robots Meta NOFOLLOW",
            uid: "robots_meta_nofollow",
            field_metadata: {
              description: "",
              default_value: "",
            },
            unique: false,
            mandatory: false,
            multiple: false,
          },
          {
            data_type: "boolean",
            display_name: "Robots Meta NOODP",
            uid: "robots_meta_noodp",
            field_metadata: {
              description: "",
              default_value: "",
            },
            unique: false,
            mandatory: false,
            multiple: false,
          },
          {
            data_type: "boolean",
            display_name: "Robots Meta NOYDIR",
            uid: "robots_meta_noydir",
            field_metadata: {
              description: "",
              default_value: "",
            },
            unique: false,
            mandatory: false,
            multiple: false,
          },
        ],
      },
    ],
    options: {
      is_page: true,
      title: "title",
      sub_title: [],
      url_pattern: "/:year/:month/:title",
      _version: 1,
      url_prefix: "/blog/",
      description: "Schema for Posts",
      singleton: false,
    },
    description: "",
  };
  helper.writeFile(
    path.join(
      process.cwd(),
      "wordPressMigrationData",
      "content_types",
      postConfig.fileName
    ),
    JSON.stringify(postSchema, null, 4),
    (err) => {
      if (err) throw err;
    }
  );
}

ExtractPosts.prototype = {
  start: function () {},
};

module.exports = ExtractPosts;
