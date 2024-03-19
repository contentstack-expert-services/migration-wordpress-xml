const cliUpdate = async () => {
  let modulesList = ["assets", "entries"];
  console.log("Converting to support version2...");
  try {
    for (var i = 0, total = modulesList.length; i < total; i++) {
      var ModuleExport = require("./libs/" + modulesList[i] + ".js");
      await ModuleExport();
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = cliUpdate;
