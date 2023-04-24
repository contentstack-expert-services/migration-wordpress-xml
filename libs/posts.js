/**
 * External module Dependencies.
 */
var mkdirp = require("mkdirp"),
  path = require("path"),
  fs = require("fs"),
  when = require("when");
const { JSDOM } = require("jsdom");
const { htmlToJson } = require("@contentstack/json-rte-serializer");

const chalk = require("chalk");
/**
 * Internal module Dependencies.
 */
var helper = require("../utils/helper");

var postConfig = config.modules.posts,
  postFolderPath = path.resolve(
    config.data,
    config.entryfolder,
    postConfig.dirName
  ),
  folderpath = path.resolve(config.data, config.modules.asset.dirName);

const chunksDir = path.resolve(config.data, "chunks");
const chunksToCS = path.resolve(config.data, "chunksToCS");

//Creating a asset folder if we run this first
if (!fs.existsSync(folderpath)) {
  mkdirp.sync(folderpath);
}

if (!fs.existsSync(postFolderPath)) {
  mkdirp.sync(postFolderPath);
  helper.writeFile(path.join(postFolderPath, postConfig.fileName));
}
if (!fs.existsSync(chunksDir)) {
  mkdirp.sync(chunksDir);
}

if (!fs.existsSync(chunksToCS)) {
  mkdirp.sync(chunksToCS);
}

// var self = this;
function ExtractPosts() {}

async function featuredImageMapping(postid, post, postdata) {
  var assetsId = helper.readFile(
    path.join(process.cwd(), "wordPressMigrationData", "assets", "assets.json")
  );

  let assetsDetails = [];
  if (post["wp:postmeta"]) {
    var postmeta = post["wp:postmeta"];
    if (Array.isArray(postmeta)) {
      postmeta.map(function (meta, index) {
        if (meta["wp:meta_key"] == "_thumbnail_id") {
          var attachmentid = `assets_${meta["wp:meta_value"]}`;
          // to match the asset id from the asset json and the attachementid
          Object.keys(assetsId).forEach((key) => {
            if (attachmentid === assetsId[key].uid) {
              assetsDetails.push(assetsId[key]); // to push the key which we got from match
            }
          });

          postdata[postid]["featured_image"] = assetsDetails;
        }
      });
    } else {
      if (postmeta["wp:meta_key"]) {
        if (postmeta["wp:meta_key"] == "_thumbnail_id") {
          var attachmentid = postmeta["wp:meta_value"];
          // to match the asset id from the asset json and the attachementid
          Object.keys(assetsId).forEach((key) => {
            if (attachmentid === assetsId[key].uid) {
              assetsDetails.push(assetsId[key]); // to push the key which we got from match
            }
          });

          postdata[postid]["featured_image"] = assetsDetails;
        }
      }
    }
  }
}

async function processChunkData(
  chunkData,
  blog_base_url,
  authorId,
  referenceId,
  filename,
  isLastChunk
) {
  try {
    var postdata = helper.readFile(
      path.join(postFolderPath, postConfig.fileName)
    );
    const results = await Promise.all(
      chunkData.map(async function (data, index) {
        let typeArray = ["page", "wp_global_styles", "wp_block"];
        if (!typeArray.includes(data["wp:post_type"])) {
          let statusArray = ["publish", "inherit"];
          if (statusArray.includes(data["wp:status"])) {
            var postAuthor = [],
              postCategories = [],
              postTags = [],
              postTerms = [];
            var categories = data["category"];
            if (Array.isArray(categories)) {
              Object.keys(referenceId).forEach((key) => {
                if (
                  data["category"].find(
                    (el) => el["$"]?.["nicename"] === referenceId[key].slug
                  )
                ) {
                  if (referenceId[key].content_type === "terms") {
                    postTerms.push({
                      uid: key,
                      _content_type_uid: referenceId[key].content_type,
                    });
                  } else if (referenceId[key].content_type === "tag") {
                    postTags.push({
                      uid: key,
                      _content_type_uid: referenceId[key].content_type,
                    });
                  } else {
                    postCategories.push({
                      uid: key,
                      _content_type_uid: referenceId[key].content_type,
                    });
                  }
                }
              });
            } else {
              if (categories !== undefined)
                if (categories["$"]?.["domain"] !== "category") {
                  Object.keys(referenceId).forEach((key) => {
                    if (
                      categories["$"]?.["nicename"] === referenceId[key].slug
                    ) {
                      if (referenceId[key].content_type === "terms") {
                        postTerms.push({
                          uid: key,
                          _content_type_uid: referenceId[key].content_type,
                        });
                      } else if (referenceId[key].content_type === "tag") {
                        postTags.push({
                          uid: key,
                          _content_type_uid: referenceId[key].content_type,
                        });
                      } else {
                        postCategories.push({
                          uid: key,
                          _content_type_uid: referenceId[key].content_type,
                        });
                      }
                    }
                  });
                }
            }

            Object.keys(authorId).forEach((key) => {
              if (
                data["dc:creator"].split(",").join("") === authorId[key].title
              ) {
                postAuthor.push({
                  uid: key,
                  _content_type_uid: "authors",
                });
              }
            });

            const dom = new JSDOM(
              data["content:encoded"]
                .replace(/<!--.*?-->/g, "")
                .replace(/&lt;!--?\s+\/?wp:.*?--&gt;/g, "")
            );
            let htmlDoc = dom.window.document.querySelector("body");
            const jsonValue = htmlToJson(htmlDoc);
            var date = new Date(data["wp:post_date_gmt"]);
            var base = blog_base_url.split("/");
            var len = base.length;
            var blogname;

            if (base[len - 1] == "") {
              blogname = base[len - 2];
            } else {
              blogname = base[len - 1];
            }
            var url = data["link"];
            url = url.split(blogname);
            url = url[1];
            postdata[`posts_${data["wp:post_id"]}`] = {
              title: data["title"],
              uid: `posts_${data["wp:post_id"]}`,
              url: url,
              author: postAuthor,
              category: postCategories,
              date: date.toISOString(),
              full_description: jsonValue,
              excerpt: data["excerpt:encoded"]
                .replace(/<!--.*?-->/g, "")
                .replace(/&lt;!--?\s+\/?wp:.*?--&gt;/g, ""),
              tag: postTags,
              terms: postTerms,
            };
            featuredImageMapping(`posts_${data["wp:post_id"]}`, data, postdata);
          }
        }

        helper.writeFile(
          path.join(chunksToCS, filename),
          JSON.stringify(postdata, null, 4)
        );
        helper.writeFile(
          path.join(postFolderPath, postConfig.fileName),
          JSON.stringify(postdata, null, 4)
        );
        return data["wp:post_id"];
      })
    );

    // check if all promises resolved successfully
    const allSuccess = results.every(
      (result) => typeof result !== "object" || result.success
    );

    if (isLastChunk && allSuccess) {
      console.log("\nthe last batch of posts\n");
    }
  } catch (error) {
    console.log(chalk.red("Error saving posts", error));
    return { success: false, message: error.message };
  }
}

async function splitJsonIntoChunks(
  arrayData,
  blog_base_url,
  authorId,
  referenceId
) {
  let chunkData = [];
  let chunkIndex = 1;

  for (let i = 0; i < arrayData.length; i++) {
    chunkData.push(arrayData[i]);

    if (
      chunkData.length >= 100 ||
      (i === arrayData.length - 1 && chunkData.length > 0)
    ) {
      // Write chunk data to file
      const chunkFilePath = path.join(chunksDir, `post-${chunkIndex}.json`);
      fs.writeFileSync(chunkFilePath, JSON.stringify(chunkData, null, 4));

      // Reset chunk data
      chunkData = [];
      chunkIndex++;
    }
  }

  const chunkFiles = fs.readdirSync(chunksDir);
  const lastChunk = chunkFiles[chunkFiles.length - 1];

  // Read and process all files in the directory except the first one
  chunkFiles.forEach(async (filename) => {
    const filePath = path.join(chunksDir, filename);
    const data = fs.readFileSync(filePath);
    const chunkData = JSON.parse(data);

    // Check if the current chunk is the last chunk
    const isLastChunk = filename === lastChunk;

    // Perform custom processing on chunkData
    setTimeout(async () => {
      await processChunkData(
        chunkData,
        blog_base_url,
        authorId,
        referenceId,
        filename,
        isLastChunk
      );
      console.log(
        chalk.green(`${filename.split(".").slice(0, -1).join(".")}`),
        "getting migrated please wait"
      );
    }, 500);
  });
}

ExtractPosts.prototype = {
  start: function () {
    return when.promise(function (resolve, reject) {
      const alldata = helper.readFile(
        path.join(config.data, config.json_filename)
      );
      const posts =
        alldata?.rss?.channel["item"] ?? alldata?.channel["item"] ?? "";
      const blog_base_url =
        alldata?.rss?.channel["wp:base_blog_url"] ??
        alldata?.channel["wp:base_blog_url"] ??
        "";
      const authorId = helper.readFile(
        path.join(
          process.cwd(),
          "wordPressMigrationData",
          "entries",
          "authors",
          "en-us.json"
        )
      );

      const referenceId = helper.readFile(
        path.join(
          process.cwd(),
          "wordPressMigrationData",
          "entries",
          "reference",
          "en-us.json"
        )
      );
      if (posts) {
        if (posts.length > 0) {
          splitJsonIntoChunks(
            posts,
            blog_base_url,
            authorId,
            referenceId,
            alldata
          );
          resolve();
        } else {
          console.log(chalk.red("\nno posts found"));
          resolve();
        }
      } else {
        console.log(chalk.red("\nno posts found"));
        resolve();
      }
    });
  },
};
module.exports = ExtractPosts;
