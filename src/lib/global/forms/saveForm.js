"use strict";

module.exports = async (obj, req) => {
  try {
    const result = await req.locals.model.create(obj.values);  
    return result;
  } catch (err) {
    req.logger.error(req, err.message);
    return null;
  }
};