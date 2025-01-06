"use strict";

const main = require("express").Router();

const getMenu = require("./getMenu");

main.get("/getmenu", getMenu);

main.use("*", function (req, res) {
  res.status(417).send("No route found");
});
module.exports = main;
