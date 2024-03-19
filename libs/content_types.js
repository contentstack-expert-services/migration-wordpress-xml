'use strict';
/**
 * External module Dependencies.
 */
const fs = require('fs');
const path = require('path');
const when = require('when');
var mkdirp = require('mkdirp');
/**
 * Internal module Dependencies .
 */

var helper = require('../utils/helper');
const config = require('../config');
var contentTypeFolderPath = path.resolve(config.data, 'content_types');

/**
 * Create folders and files
 */
if (!fs.existsSync(contentTypeFolderPath)) {
  mkdirp.sync(contentTypeFolderPath);
  helper.writeFile(path.join(contentTypeFolderPath, 'schema.json'));
}

function ExtractContentTypes() {}

ExtractContentTypes.prototype = {
  start: function () {
    return when.promise(function (resolve, reject) {
      try {
        // For Authors
        var authorsTitle = global.wordPress_prefix
          ? `${global.wordPress_prefix} - Authors`
          : 'Authors';
        var authorsUid = global.wordPress_prefix
          ? `${global.wordPress_prefix
              .replace(/^\d+/, '')
              .replace(/[^a-zA-Z0-9]+/g, '_')
              .replace(/(^_+)|(_+$)/g, '')
              .toLowerCase()}_authors`
          : 'authors';

        // For Categories
        var categoriesTitle = global.wordPress_prefix
          ? `${global.wordPress_prefix} - Categories`
          : 'Categories';
        var categoriesUid = global.wordPress_prefix
          ? `${global.wordPress_prefix
              .replace(/^\d+/, '')
              .replace(/[^a-zA-Z0-9]+/g, '_')
              .replace(/(^_+)|(_+$)/g, '')
              .toLowerCase()}_categories`
          : 'categories';

        // For Terms
        var termsTitle = global.wordPress_prefix
          ? `${global.wordPress_prefix} - Terms`
          : 'Terms';
        var termsUid = global.wordPress_prefix
          ? `${global.wordPress_prefix
              .replace(/^\d+/, '')
              .replace(/[^a-zA-Z0-9]+/g, '_')
              .replace(/(^_+)|(_+$)/g, '')
              .toLowerCase()}_terms`
          : 'terms';

        // For Tags
        var tagsTitle = global.wordPress_prefix
          ? `${global.wordPress_prefix} - Tags`
          : 'Tags';
        var tagsUid = global.wordPress_prefix
          ? `${global.wordPress_prefix
              .replace(/^\d+/, '')
              .replace(/[^a-zA-Z0-9]+/g, '_')
              .replace(/(^_+)|(_+$)/g, '')
              .toLowerCase()}_tag`
          : 'tag';

        // For Posts
        var postsTitle = global.wordPress_prefix
          ? `${global.wordPress_prefix} - Posts`
          : 'Posts';
        var postsUid = global.wordPress_prefix
          ? `${global.wordPress_prefix
              .replace(/^\d+/, '')
              .replace(/[^a-zA-Z0-9]+/g, '_')
              .replace(/(^_+)|(_+$)/g, '')
              .toLowerCase()}_posts`
          : 'posts';
        var schemaJson = [
          {
            title: authorsTitle,
            uid: authorsUid,
            schema: [
              {
                display_name: 'Title',
                uid: 'title',
                data_type: 'text',
                field_metadata: { _default: true, version: 1 },
                unique: false,
                mandatory: true,
                multiple: false,
                non_localizable: false,
              },
              {
                display_name: 'URL',
                uid: 'url',
                data_type: 'text',
                field_metadata: { _default: true, version: 1 },
                unique: true,
                mandatory: false,
                multiple: false,
                non_localizable: false,
              },
              {
                data_type: 'text',
                display_name: 'Email',
                uid: 'email',
                field_metadata: {
                  description: '',
                  default_value: '',
                  version: 1,
                },
                format: '',
                multiple: false,
                mandatory: false,
                unique: false,
                non_localizable: false,
              },
              {
                data_type: 'text',
                display_name: 'First Name',
                uid: 'first_name',
                field_metadata: {
                  description: '',
                  default_value: '',
                  version: 1,
                },
                format: '',
                multiple: false,
                mandatory: false,
                unique: false,
                non_localizable: false,
              },
              {
                data_type: 'text',
                display_name: 'Last Name',
                uid: 'last_name',
                field_metadata: {
                  description: '',
                  default_value: '',
                  version: 1,
                },
                format: '',
                multiple: false,
                mandatory: false,
                unique: false,
                non_localizable: false,
              },
              {
                data_type: 'json',
                display_name: 'Biographical Info',
                uid: 'biographical_info',
                field_metadata: {
                  allow_json_rte: true,
                  embed_entry: true,
                  description: '',
                  default_value: '',
                  multiline: false,
                  rich_text_type: 'advanced',
                  options: [],
                  ref_multiple_content_types: true,
                },
                format: '',
                error_messages: { format: '' },
                reference_to: ['sys_assets'],
                multiple: false,
                non_localizable: false,
                unique: false,
                mandatory: false,
              },
            ],
            description: `Schema for ${authorsTitle}`,
            options: {
              is_page: true,
              title: 'title',
              sub_title: [],
              description: 'list of authors',
              _version: 1,
              url_prefix: '/author/',
              url_pattern: '/:title',
              singleton: false,
            },
          },
          {
            title: categoriesTitle,
            uid: categoriesUid,
            schema: [
              {
                display_name: 'Title',
                uid: 'title',
                data_type: 'text',
                field_metadata: { _default: true, version: 1 },
                unique: false,
                mandatory: false,
                multiple: false,
                non_localizable: false,
              },
              {
                display_name: 'URL',
                uid: 'url',
                data_type: 'text',
                field_metadata: { _default: true, version: 1 },
                unique: true,
                mandatory: false,
                multiple: false,
                non_localizable: false,
              },
              {
                display_name: 'Nicename',
                uid: 'nicename',
                data_type: 'text',
                field_metadata: { _default: true, version: 1 },
                unique: false,
                mandatory: false,
                multiple: false,
                non_localizable: false,
              },
              {
                data_type: 'json',
                display_name: 'Description',
                uid: 'description',
                field_metadata: {
                  allow_json_rte: true,
                  embed_entry: true,
                  description: '',
                  default_value: '',
                  multiline: false,
                  rich_text_type: 'advanced',
                  options: [],
                  ref_multiple_content_types: true,
                },
                format: '',
                error_messages: { format: '' },
                reference_to: ['sys_assets'],
                multiple: false,
                non_localizable: false,
                unique: false,
                mandatory: false,
              },
              {
                data_type: 'reference',
                display_name: 'Parent',
                reference_to: [categoriesUid],
                field_metadata: {
                  ref_multiple: false,
                  ref_multiple_content_types: true,
                },
                uid: 'parent',
                multiple: false,
                mandatory: false,
                unique: false,
                non_localizable: false,
              },
            ],
            description: `Schema for ${categoriesTitle}`,
            options: {
              is_page: true,
              title: 'title',
              sub_title: [],
              url_pattern: '/:title',
              _version: 1,
              url_prefix: '/category/',
              description: 'List of categories',
              singleton: false,
            },
          },
          {
            title: tagsTitle,
            uid: tagsUid,
            schema: [
              {
                display_name: 'Title',
                uid: 'title',
                data_type: 'text',
                field_metadata: { _default: true, version: 1 },
                unique: false,
                mandatory: false,
                multiple: false,
                non_localizable: false,
              },
              {
                display_name: 'URL',
                uid: 'url',
                data_type: 'text',
                field_metadata: { _default: true, version: 1 },
                unique: true,
                mandatory: false,
                multiple: false,
                non_localizable: false,
              },
              {
                display_name: 'Slug',
                uid: 'slug',
                data_type: 'text',
                field_metadata: { _default: true, version: 1 },
                unique: false,
                mandatory: false,
                multiple: false,
                non_localizable: false,
              },
              {
                data_type: 'text',
                display_name: 'Description',
                uid: 'description',
                field_metadata: {
                  description: '',
                  default_value: '',
                  multiline: true,
                  version: 1,
                },
                format: '',
                error_messages: { format: '' },
                mandatory: false,
                multiple: false,
                non_localizable: false,
                unique: false,
              },
            ],
            description: `Schema for ${tagsTitle}`,
            options: {
              is_page: true,
              title: 'title',
              sub_title: [],
              url_pattern: '/:title',
              _version: 1,
              url_prefix: '/tags/',
              description: 'List of tags',
              singleton: false,
            },
          },
          {
            title: termsTitle,
            uid: termsUid,
            schema: [
              {
                display_name: 'Title',
                uid: 'title',
                data_type: 'text',
                field_metadata: { _default: true, version: 1 },
                unique: false,
                mandatory: false,
                multiple: false,
                non_localizable: false,
              },
              {
                display_name: 'URL',
                uid: 'url',
                data_type: 'text',
                field_metadata: { _default: true, version: 1 },
                unique: true,
                mandatory: false,
                multiple: false,
                non_localizable: false,
              },
              {
                display_name: 'Taxonomy',
                uid: 'taxonomy',
                data_type: 'text',
                field_metadata: { _default: true, version: 1 },
                unique: false,
                mandatory: false,
                multiple: false,
                non_localizable: false,
              },
              {
                display_name: 'Slug',
                uid: 'slug',
                data_type: 'text',
                field_metadata: { _default: true, version: 1 },
                unique: false,
                mandatory: false,
                multiple: false,
                non_localizable: false,
              },
            ],
            description: `Schema for ${termsTitle}`,
            options: {
              is_page: true,
              title: 'title',
              sub_title: [],
              url_pattern: '/:title',
              _version: 1,
              url_prefix: '/terms/',
              description: 'Schema for Terms',
              singleton: false,
            },
          },
          {
            title: postsTitle,
            uid: postsUid,
            schema: [
              {
                display_name: 'Title',
                uid: 'title',
                data_type: 'text',
                field_metadata: { _default: true, version: 1 },
                unique: false,
                mandatory: false,
                multiple: false,
                non_localizable: false,
              },
              {
                display_name: 'URL',
                uid: 'url',
                data_type: 'text',
                field_metadata: { _default: true, version: 1 },
                unique: true,
                mandatory: false,
                multiple: false,
                non_localizable: false,
              },
              {
                data_type: 'json',
                display_name: 'Body',
                uid: 'full_description',
                field_metadata: {
                  allow_json_rte: true,
                  embed_entry: true,
                  description: '',
                  default_value: '',
                  multiline: false,
                  rich_text_type: 'advanced',
                  options: [],
                  ref_multiple_content_types: true,
                },
                format: '',
                error_messages: { format: '' },
                reference_to: ['sys_assets'],
                multiple: false,
                non_localizable: false,
                unique: false,
                mandatory: false,
              },
              {
                data_type: 'text',
                display_name: 'Excerpt',
                uid: 'excerpt',
                field_metadata: {
                  description: '',
                  default_value: '',
                  multiline: true,
                  version: 1,
                },
                format: '',
                error_messages: { format: '' },
                mandatory: false,
                multiple: false,
                non_localizable: false,
                unique: false,
              },
              {
                data_type: 'file',
                display_name: 'Featured Image',
                uid: 'featured_image',
                field_metadata: { description: '', rich_text_type: 'standard' },
                unique: false,
                mandatory: false,
                multiple: true,
                non_localizable: false,
              },
              {
                data_type: 'isodate',
                display_name: 'Date',
                uid: 'date',
                startDate: null,
                endDate: null,
                field_metadata: { description: '', default_value: {} },
                mandatory: false,
                multiple: false,
                non_localizable: false,
                unique: false,
              },
              {
                data_type: 'reference',
                display_name: 'Author',
                reference_to: [authorsUid],
                field_metadata: {
                  ref_multiple: true,
                  ref_multiple_content_types: true,
                },
                uid: 'author',
                unique: false,
                mandatory: false,
                multiple: false,
                non_localizable: false,
              },
              {
                data_type: 'reference',
                display_name: 'Categories',
                reference_to: [categoriesUid],
                field_metadata: {
                  ref_multiple: true,
                  ref_multiple_content_types: true,
                },
                uid: 'category',
                unique: false,
                mandatory: false,
                multiple: false,
                non_localizable: false,
              },
              {
                data_type: 'reference',
                display_name: 'Terms',
                reference_to: [termsUid],
                field_metadata: {
                  ref_multiple: true,
                  ref_multiple_content_types: true,
                },
                uid: 'terms',
                unique: false,
                mandatory: false,
                multiple: false,
                non_localizable: false,
              },
              {
                data_type: 'reference',
                display_name: 'Tags',
                reference_to: [tagsUid],
                field_metadata: {
                  ref_multiple: true,
                  ref_multiple_content_types: true,
                },
                uid: 'tag',
                unique: false,
                mandatory: false,
                multiple: false,
                non_localizable: false,
              },
            ],
            description: `Schema for ${postsTitle}`,
            options: {
              is_page: true,
              title: 'title',
              sub_title: [],
              url_pattern: '/:year/:month/:title',
              _version: 1,
              url_prefix: '/blog/',
              description: 'Schema for Posts',
              singleton: false,
            },
          },
        ];
        helper.writeFile(
          path.join(process.cwd(), config.data, 'content_types', 'schema.json'),
          JSON.stringify(schemaJson, null, 4)
        );
        resolve();
      } catch (error) {
        console.log(error);
        reject();
      }
    });
  },
};

module.exports = ExtractContentTypes;
