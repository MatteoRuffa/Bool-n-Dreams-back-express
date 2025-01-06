"use strict";

module.exports = async (insertObj, req) => {
  try {
    return await req.locals.dbMongo
      .updateOne(
        { id: req.locals.id },
        { $set: insertObj },
        { $currentDate: { lastModified: true } }
      )
      .catch((err) => {
        req.logger.error(req, err);
      });
  } catch (err) {
    req.logger.error(req, err);
  }
};
