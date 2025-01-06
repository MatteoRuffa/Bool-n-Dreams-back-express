"use strict";

const routerApp = require("src/lib/global/router/app");
const utility = require("src/lib/global/utility");

const apt = require("express").Router();
const main = require("./main/_router");
const forms = require("./forms/_router");
const grids = require("./grids/_router");

const getCronology = require("./main/getCronology");

//INIZIALIZE APP
apt.use(async function (req, res, next) {
    req["locals"].tag = "APT";
    await utility.intAppReq(req, res, next);
  });

//CALL GLOBAL ROUTER
apt.use(function (req, res, next) {
    routerApp.defaultRequest(apt, req, res, next);
  });
  
  //CALL SPECIFIC THIS APP
  apt.get("/getusers", utility.getUsers); //combo utenti
  apt.get("/cronology", getCronology);
  
  //CALL ROUTER CURRENT APP
  apt.use("/main", main);
  apt.use("/forms", forms);
  apt.use("/grids", grids);
  
  module.exports = apt;