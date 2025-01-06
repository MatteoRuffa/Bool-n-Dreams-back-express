const utility = require("src/lib/global/utility")

const defaultRequest = function (app, req, res, next) {

    app.post("/uploadfiles", uploadFiles.multipleUpload);
    app.post("/uploadfile", uploadFile);

    next()
}