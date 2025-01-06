"use strict";

function inizializeMongo(req, res) {
  this.req = req;
  this.res = res;

  req.locals.id = req.params.id;
  if (req.method === "POST") {
    req.locals.id = req.body.id;
  }

  this.check = async function () {
    try {
      if (req.method === "GET" && req.query.isnew === "1") {
        return true;
      }

      let db = req.locals.dbMongo;
      let pipeline = [{ $match: { id: req.locals.id } }];

      let start = db.aggregate(pipeline);
      let data = await start.toArray();
      if (req.method === "POST") {
        //insert
        if (data["length"] > 0) {
          req.logger.warning(req, {
            id: req.locals.id,
            message: req.i18n.__("global.error.form.exist"),
          });
          res.status(400).json({
            msg: req.i18n.__("global.error.form.exist"),
          });
          return false;
        }
        return true;
      }
      if (req.method === "PUT") {
        //update
        if (data["length"] === 1) {
          req.locals.record = data[0];
          req.locals.oldRecord = data[0];
          return true;
        }
        if (data["length"] === 0) {
          req.logger.warning(req, {
            id: req.locals.id,
            message: req.i18n.__("global.error.form.notfound"),
          });
          res.status(400).json({
            msg: req.i18n.__("global.error.form.notfound"),
          });
        }
        if (data["length"] > 1) {
          req.logger.warning(req, {
            id: req.locals.id,
            message: req.i18n.__("global.error.form.more"),
          });
          res.status(400).json({
            msg: req.i18n.__("global.error.form.more"),
          });
        }
        return true;
      }

      if (req.method === "DELETE") {
        //delete
        if (data["length"] === 0) {
          req.logger.warning(req, {
            id: req.locals.id,
            message: req.i18n.__("global.error.form.notfound"),
          });
          res.status(400).json({
            msg: req.i18n.__("global.error.form.notfound"),
          });
          return false;
        } else {
          req.locals.record = data[0];
          req.locals.oldRecord = data[0];
          return true;
        }
      }

      if (req.method === "GET") {
        //select
        if (data["length"] === 0) {
          req.logger.warning(req, {
            id: req.locals.id,
            message: req.i18n.__("global.error.form.notfound"),
          });
          res.status(400).json({
            msg: req.i18n.__("global.error.form.notfound"),
          });
          return false;
        } else {
          req.locals.record = data[0];
          req.locals.oldRecord = data[0];
          return true;
        }
      }

      req.logger.warning(req, {
        id: req.locals.id,
        message: req.i18n.__("global.error.method"),
      });
      res.status(400).json({
        msg: req.i18n.__("global.error.method"),
      });
      return false;
    } catch (err) {
      req.logger.error(req, err);
      res.status(500).json({
        msg: req.i18n.__("global.error.server"),
      });
      return false;
    }
  };
}

module.exports = {
  inizializeMongo,
};
