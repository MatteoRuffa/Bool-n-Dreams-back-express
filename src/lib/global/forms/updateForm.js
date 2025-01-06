"use strict";

module.exports = async (obj, req) => {
  try {
    const result = await req.locals.model.updateOne(
      { _id: obj.id },    
      obj.data            
    );
    return result;
  } catch (err) {
    console.log(err);
    req.logger.error(req, err.message);
    return null;
  }
};
