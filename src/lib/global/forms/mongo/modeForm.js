"use strict";

const updateForm = require("./updateForm");
const saveForm = require("./saveForm");

function inizializeMongo(req, res) {
  this.generateFields = function (name, type) {
    return {
      field: name,
      type: type,
      old: req.locals.oldRecord ? req.locals.oldRecord[name] : "",
      new: req.body[name] ? req.body[name] : "",
      label: req.i18n.__(this.str + "." + name),
    };
  };

  this.setI18n = function (str) {
    this.str = str;
  };

  this.generateObject = function (f, table) {
    let id = req.params.id;
    if (req.method === "POST") {
      id = req.body.id;
    }

    let tilelog = req.i18n.__("global.cronology.action.insert");
    let action = "insert";
    if (req.locals.record) {
      tilelog = req.i18n.__("global.cronology.action.update");
      action = "update";
    }
    if (req.method === "DELETE" && req.locals.record) {
      tilelog = req.i18n.__("global.cronology.action.delete");
      action = "delete";
    }
    let oldRecord;
    if (req.method === "PUT") {
      oldRecord = req.locals.record;
    }

    this.fields = f;

    return {
      req: req,
      i18n: req.i18n,
      tilelog: tilelog,
      action: action,
      id: id,
      oldRecord: oldRecord,
      fields: f,
      table: table,

      //TODO
      runUpdateForm: async function () {
        let updateObj = await this.getSqlUpd();

        let u = await updateForm(updateObj, req);

        if (u === null) {
          req.logger.warning(req, {
            id: req.locals.id,
            message: req.i18n.__("global.error.form.notfound"),
          });
          res.status(400).json({
            msg: req.i18n.__("global.error.form.notfound"),
          });
        }
        return u;
      },
      runSoftDeleteForm: async function () {
        let d = await req.locals.dbMongo
          .updateOne(
            { id: req.locals.id },
            { $set: { x: 1 } },
            { $currentDate: { lastModified: true } }
          )
          .catch((err) => {
            req.logger.error(req, err);
          });

        if (d === null) {
          req.logger.warning(req, {
            id: req.locals.id,
            message: req.i18n.__("global.error.form.notfound"),
          });
          res.status(400).json({
            msg: req.i18n.__("global.error.form.notfound"),
          });
        }
        return d;
      },
      runDeleteForm: async function () {
        let d = await req.locals.dbMongo
          .deleteOne({ id: req.locals.id })
          .catch((err) => {
            req.logger.error(req, err);
          });

        if (d === null) {
          req.logger.warning(req, {
            id: req.locals.id,
            message: req.i18n.__("global.error.form.notfound"),
          });
          res.status(400).json({
            msg: req.i18n.__("global.error.form.notfound"),
          });
        }
        return d;
      },
      runInsertForm: async function () {
        let insertObj = await this.getSqlIns();

        let s = await saveForm(insertObj, req);
        if (s === null) {
          req.logger.warning(req, {
            id: req.locals.id,
            message: req.i18n.__("global.error.form.notfound"),
          });
          res.status(400).json({
            msg: req.i18n.__("global.error.form.notfound"),
          });
        }
        return s;
      },

      getSqlUpd: function () {
        let insertObj = {},
          me = this;

        insertObj["lastUpdate"] = new Date();
        for (let field of me.fields[me.table]) {
          if (typeof field == "object") {
            switch (field.type) {
              case "boolean":
                insertObj[field.field] = field.new === true;
                break;
              case "date":
                //TODO gestire date
                if (!field.new || field.new === "0000-00-00") {
                  // values.push('')
                } else {
                  // values.push(dateformat(new Date(field.new), 'yyyy-mm-dd'))
                }
                break;

              default:
                insertObj[field.field] = field.new;
            }
          }
        }
        return insertObj;
      },
      getSqlIns: function () {
        let insertObj = {},
          me = this;

        insertObj["id"] = req.locals.id;
        insertObj["lastUpdate"] = new Date();
        insertObj["x"] = 0;
        for (let field of me.fields[me.table]) {
          if (typeof field == "object") {
            switch (field.type) {
              case "boolean":
                insertObj[field.field] = field.new === true;
                break;
              case "date":
                //TODO gestire date
                if (!field.new || field.new === "0000-00-00") {
                  // values.push('')
                } else {
                  // values.push(dateformat(new Date(field.new), 'yyyy-mm-dd'))
                }
                break;

              default:
                insertObj[field.field] = field.new;
            }
          }
        }
        return insertObj;
      },
      getFieldsSelect: async function () {
        try {
          let obj = this;
          let project = {};
          project["id"] = "$id";
          for (let field of obj.fields[obj.table]) {
            if (typeof field == "object") {
              project[field.field] = `$${field.field}`;
            }
            if (typeof field == "string") {
              project[field.field] = `$${field}`;
            }
          }

          let pipeline = [
            { $match: { id: this.id } },
            { $sort: { datelog: -1 } },
            { $project: project },
          ];

          let start = req.locals.dbMongo.aggregate(pipeline);
          let data = await start.toArray();
          if (data["length"] === null) {
            return;
          }

          if (data["length"] === 0) {
            req.logger.warning(req, {
              id: req.locals.id,
              message: req.i18n.__("global.error.form.notfound"),
            });
            res.status(400).json({
              msg: req.i18n.__("global.error.form.notfound"),
            });
            return null;
          }
          if (data["length"] > 1) {
            req.logger.warning(req, {
              id: req.locals.id,
              message: req.i18n.__("global.error.form.more"),
            });
            res.status(400).json({
              msg: req.i18n.__("global.error.form.more"),
            });
            return null;
          }
          return data[0];
        } catch (err) {
          console.log(err);
          res.status(500).json({
            msg: req.i18n.__("global.error.server"),
          });
          return null;
        }
      },
    };
  };
}

module.exports = {
  inizializeMongo,
};
