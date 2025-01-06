"use strict";

module.exports = async (insertObj, req) => {
  return await req.locals.dbMongo.insertOne(insertObj).catch((err) => {
    req.logger.error(req, err);
  });
};
