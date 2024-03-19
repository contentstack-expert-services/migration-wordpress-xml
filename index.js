var path = require('path'),
  chalk = require('chalk'),
  fs = require('fs'),
  inquirer = require('inquirer'),
  xml2js = require('xml2js'),
  mkdirp = require('mkdirp');
const Messages = require('./utils/message');
const messages = new Messages('wordpress').msgs;

const config = require('./config');
const cliUpdate = require('./utils/cli_convert');
global.errorLogger = require('./utils/logger')('error').error;
global.successLogger = require('./utils/logger')('success').log;
global.warnLogger = require('./utils/logger')('warn').log;

// single xml file code
var modulesList = [
  'assets',
  'folders',
  'reference',
  'chunks',
  'authors',
  'content_types',
  'terms',
  'tags',
  'categories',
  'posts',
  'global_fields',
]; //to create entries

var promises = [];

// for single xml file
const migFunction = async () => {
  inquirer
    .prompt({
      type: 'input',
      name: 'csPrefix',
      message: 'Add a custom content-type name if you want (optional).',
      validate: (csPrefix) => {
        let format = /[!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?]+/;
        if (format.test(csPrefix)) {
          console.log(
            chalk.red(`\nSpecial characters are not allowed except "_"`)
          );
          return false;
        }
        this.name = csPrefix;
        return true;
      },
    })
    .then(async (answer) => {
      try {
        if (!fs.existsSync(path.join(process.cwd(), config.data))) {
          mkdirp.sync(path.join(process.cwd(), config.data));
        }
        if (!fs.existsSync(path.join(config.data, config.json_filename))) {
          var xml_data = helper.readXMLFile(config.xml_filename);
          parseString(
            xml_data,
            { explicitArray: false },
            function (err, result) {
              if (err) {
                console.log(err);
                errorLogger('failed to parse xml: ', err);
              } else {
                helper.writeFile(
                  path.join(config.data, config.json_filename),
                  JSON.stringify(result, null, 4)
                );
              }
            }
          );
        }
        global.filePath = undefined;
        global.wordPress_prefix = answer.csPrefix.replace(
          /[^a-zA-Z0-9]+/g,
          '_'
        );

        for (let i = 0; i < modulesList.length; i++) {
          const ModuleExport = require(`./libs/${modulesList[i]}.js`);
          const moduleExport = new ModuleExport();
          await moduleExport.start();
        }
      } catch (error) {
        console.log(error);
      }

      Promise.all(promises)
        .then(async function (results) {
          console.log(
            chalk.green('\n\nWordPress Data exporting has been started\n')
          );

          await cliUpdate();
        })
        .catch(function (error) {
          console.log(error);
          errorLogger(error);
        });
    });
};

// to check if file exist or not
const fileCheck = (csFilePath) => {
  const allowedExtension = '.xml';
  const extension = path.extname(csFilePath);
  if (allowedExtension === extension) {
    if (fs.existsSync(csFilePath)) {
      mkdirp.sync(path.join(process.cwd(), config.data));
      const xmlFilePath = global.xml_filename;
      const jsonFilePath = path.join(config.data, config.json_filename);
      const xml = fs.readFileSync(xmlFilePath, 'utf8');
      const parser = new xml2js.Parser({
        attrkey: 'attributes',
        charkey: 'text',
        explicitArray: false,
      });
      parser.parseString(xml, (err, result) => {
        if (err) {
          console.error(`Error parsing XML: ${err.message}`);
        } else {
          const json = JSON.stringify(result, null, 2);
          fs.writeFile(jsonFilePath, json, 'utf8', (err) => {
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
    console.log(chalk.red('use only .xml extension file'));
  }
};

const XMLMigration = async () => {
  console.log(chalk.hex('#6C5CE7')(messages.promptXMLDescription));

  const question = [
    {
      type: 'input',
      name: 'csFilePath',
      message: messages.promptFilePath,
      validate: (csFilePath) => {
        if (!csFilePath || csFilePath.trim() === '') {
          console.log(chalk.red('Please insert filepath!'));
          return false;
        }
        this.name = csFilePath;
        return true;
      },
    },
  ];

  inquirer.prompt(question).then(async (answer) => {
    try {
      const allowedExtension = '.xml';
      if (path.extname(answer.csFilePath)) {
        const extension = path.extname(answer.csFilePath);
        if (answer.csFilePath) {
          if (extension === allowedExtension) {
            global.xml_filename = answer.csFilePath;
            fileCheck(global.xml_filename);
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
