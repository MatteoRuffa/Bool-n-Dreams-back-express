"use strict";

/* ----------------------------------------------
Esistenza del record per operazioni PUT/GET/DELETE
Non esistenza per operazioni POST
Validità del metodo HTTP
Gestisce errori del database
-------------------------------------------------*/

async function inizialize(req, res) {
  req.locals.id = req.params.id || (req.method === "POST" ? req.body.id : null);
  
  const check = async function() {
    if (req.method === "GET" && req.query.isnew === "1") return true;

    try {
      const Model = req.locals.model; // Mongoose model reference
      const record = await Model.findById(req.locals.id).lean();

      switch (req.method) {
        case "POST":
          if (record) {
            req.logger.warning(req, {
              id: req.locals.id,
              message: req.i18n.__("global.error.form.exist")
            });
            res.status(400).json({
              msg: req.i18n.__("global.error.form.exist")
            });
            return false;
          }
          return true;

        case "PUT":
        case "GET":
        case "DELETE":
          if (!record) {
            req.logger.warning(req, {
              id: req.locals.id,
              message: req.i18n.__("global.error.form.notfound")
            });
            res.status(400).json({
              msg: req.i18n.__("global.error.form.notfound") 
            });
            return false;
          }
          req.locals.record = record;
          req.locals.oldRecord = record;
          return true;

        default:
          req.logger.warning(req, {
            id: req.locals.id,
            message: req.i18n.__("global.error.method")
          });
          res.status(400).json({
            msg: req.i18n.__("global.error.method")
          });
          return false;
      }

    } catch (err) {
      req.logger.error(req, err);
      res.status(500).json({
        msg: req.i18n.__("global.error.server")
      });
      return false;
    }
  };

  return { check };
}

module.exports = { inizialize };