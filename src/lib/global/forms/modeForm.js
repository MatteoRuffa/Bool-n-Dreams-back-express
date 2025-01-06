"use strict";

function inizialize(req, res) {
  const generateFields = (name, type) => ({
    field: name,
    type: type,
    old: req.locals.oldRecord ? req.locals.oldRecord[name] : "",
    new: req.body.hasOwnProperty(name) ? req.body[name] : "",
    label: req.i18n.__(str + "." + name),
  });

  const generateObject = (fields, modelName) => {
    const id = req.params.id || (req.method === "POST" ? req.body.id : null);
    let action = "insert";
    let tilelog = req.i18n.__("global.cronology.action.insert");
    
    if (req.locals.record) {
      action = req.method === "DELETE" ? "delete" : "update";
      tilelog = req.i18n.__(`global.cronology.action.${action}`);
    }

    return {
      req,
      i18n: req.i18n,
      tilelog,
      action,
      id,
      oldRecord: req.method === "PUT" ? req.locals.record : null,
      fields,
      Model: req.locals.model,

      async runUpdateForm(conditions = {}) {
        try {
          const updateData = this.getMongoUpdate();
          const result = await this.Model.findOneAndUpdate(
            { _id: this.id, ...conditions },
            updateData,
            { new: true }
          );
          if (!result) {
            throw new Error("not_found");
          }
          return result;
        } catch (err) {
          handleError(req, res, err);
          return null;
        }
      },

      async runInsertForm() {
        try {
          const doc = this.getMongoDoc();
          const result = await this.Model.create(doc);
          return result;
        } catch (err) {
          handleError(req, res, err);
          return null;
        }
      },

      getMongoUpdate() {
        const update = {};
        for (const field of this.fields[modelName]) {
          if (typeof field === "object") {
            update[field.field] = formatFieldValue(field);
          }
        }
        return update;
      },

      getMongoDoc() {
        const doc = { _id: this.id };
        for (const field of this.fields[modelName]) {
          if (typeof field === "object") {
            doc[field.field] = formatFieldValue(field);
          }
        }
        return doc;
      },

      getFields() {
        return this.fields[modelName].reduce((acc, field) => {
          const key = typeof field === "object" ? field.field : field;
          acc[key] = this.req.locals.record[key];
          return acc;
        }, {});
      }
    };
  };

  return { generateFields, generateObject };
}

function formatFieldValue(field) {
  if (field.type === "date") {
    return (!field.new || field.new === "0000-00-00") ? null : new Date(field.new);
  }
  if (field.type === "number") {
    return field.new || 0;
  }
  return field.new;
}

function handleError(req, res, err) {
  const isNotFound = err.message === "not_found";
  req.logger[isNotFound ? "warning" : "error"](req, {
    id: req.locals.id,
    message: req.i18n.__(isNotFound ? "global.error.form.notfound" : "global.error.server")
  });
  res.status(isNotFound ? 400 : 500).json({
    msg: req.i18n.__(isNotFound ? "global.error.form.notfound" : "global.error.server")
  });
}

module.exports = { inizialize };