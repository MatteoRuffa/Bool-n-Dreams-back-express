"use strict";

const fs = require("fs");

module.exports = (req, res) => {
  try {
    const fileName =
      global.envApp.path[global.CLI].files + "temp/upload/thumb_" + req.params.img;
    if (fs.existsSync(fileName)) {
      res.sendFile(fileName);
    } else {
      res.sendFile(
        global.envApp.path.backend + global.path_wallpaper + "no-image_picture.png"
      );
    }
  } catch (err) {
    res.sendFile(
      global.envApp.path.backend + global.path_wallpaper + "no-image_picture.png"
    );
  }
};