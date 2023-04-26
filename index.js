var path = require("path"),
  chalk = require("chalk"),
  fs = require("fs"),
  inquirer = require("inquirer"),
  sequence = require("when/sequence"),
  xml2js = require("xml2js"),
  mkdirp = require("mkdirp");

_ = require("lodash");
const Messages = require("./utils/message");
const messages = new Messages("wordpress").msgs;

config = require("./config");
global.errorLogger = require("./utils/logger")("error").error;
global.successLogger = require("./utils/logger")("success").log;
global.warnLogger = require("./utils/logger")("warn").log;

var modulesList = [
  "reference",
  "assets",
  "authors",
  "categories",
  "terms",
  "tags",
  "posts",
];
//to create entries
var contentList = ["authors", "categories", "posts", "terms", "tags"]; // to create content type for the entries
var _export = [];

const migFunction = () => {
  try {
    global.filePath = undefined;
    // Module List for Entries
    for (var i = 0, total = modulesList.length; i < total; i++) {
      var ModuleExport = require("./libs/" + modulesList[i] + ".js");
      var moduleExport = new ModuleExport();
      _export.push(
        (function (moduleExport) {
          return function () {
            return moduleExport.start();
          };
        })(moduleExport)
      );
    }

    // Content List
    //create schema for the entries we  have created
    for (var i = 0, total = contentList.length; i < total; i++) {
      var ContentExport = require("./content_types/" + contentList[i] + ".js");
      var contentExport = new ContentExport();
      _export.push(
        (function (contentExport) {
          return function () {
            return contentExport.start();
          };
        })(contentExport)
      );
    }
  } catch (error) {
    console.log(error.message);
  }

  var taskResults = sequence(_export);

  taskResults
    .then(async function (results) {
      console.log(chalk.green("\nWordPress Data exporting has been started"));
    })
    .catch(function (error) {
      errorLogger(error);
    });
};

// to check if file exist or not
const fileCheck = (csFilePath) => {
  const allowedExtension = ".xml";
  const extension = path.extname(csFilePath);
  if (allowedExtension === extension) {
    if (fs.existsSync(csFilePath)) {
      mkdirp.sync(config.data);
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
              migFunction();
            }
          });
        }
      });
    } else {
      console.log(
        chalk.red(`Please check if filepath `),
        chalk.yellow(`"${csFilePath}"`),
        chalk.red(`is valid or not and try again!`)
      );
      XMLMigration();
    }
  } else {
    console.log(chalk.red("use only .xml extension file"));
  }
};

const XMLMigration = async () => {
  console.log(chalk.hex("#6C5CE7")(messages.promptXMLDescription));

  const question = [
    {
      type: "input",
      name: "csFilePath",
      message: messages.promptFilePath,
      validate: (csFilePath) => {
        if (!csFilePath || csFilePath.trim() === "") {
          console.log(chalk.red("Please insert filepath!"));
          return false;
        }
        this.name = csFilePath;
        return true;
      },
    },
  ];

  inquirer.prompt(question).then(async (answer) => {
    try {
      const allowedExtension = ".xml";
      if (path.extname(answer.csFilePath)) {
        const extension = path.extname(answer.csFilePath);
        if (answer.csFilePath) {
          if (extension === allowedExtension) {
            global.config.xml_filename = answer.csFilePath;
            fileCheck(config.xml_filename);
          }
        }
      } else {
        global.config.xml_filename = `${answer.csFilePath}.xml`;
        fileCheck(`${answer.csFilePath}.xml`);
      }
    } catch (error) {
      console.log(chalk.red(error.message));
    }
  });
};

XMLMigration();
