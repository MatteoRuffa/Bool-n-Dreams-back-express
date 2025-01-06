"use strict";

const util = require("util");
const path = require("path");
const makeid = require("../utility").makeid;
const multer = require("multer");
var storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, global.envApp.path[global.CLI].files + "temp/upload");
  },
  filename: (req, file, callback) => {
    var filename = `${makeid(32)}${path.extname(file.originalname)}`;
    callback(null, filename);
  },
});
var uploadFiles = multer({ storage: storage }).array("multi-files", 10);
var uploadFilesMiddleware = util.promisify(uploadFiles);
module.exports = uploadFilesMiddleware;
