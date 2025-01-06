"use strict";

const upload = require("./uploadFiles");
const multipleUpload = async (req, res) => {
  try {
    await upload(req, res);

    if (req.files.length <= 0) {
      return res.status(402).json({
        msg: `You must select at least 1 file.`,
      });
    }
    const valori = req.files.map((file) => {
      return { file: file.originalname, fileTemp: file.filename };
    });

    return res.status(200).json({
      valori: valori,
    });
  } catch (error) {
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(402).json({
        msg: `Too many files to upload.`,
      });
    }

    return res.status(500).json({
      msg: `Error when trying upload many files: ${error}`,
    });
  }
};
module.exports = {
  multipleUpload: multipleUpload,
};