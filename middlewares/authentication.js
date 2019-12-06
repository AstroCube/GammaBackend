"use strict";

const jwt = require('jwt-simple');
const config = require("../config");

exports.ensureAuth = function(req, res, next) {

  if (req.headers.authorization === "none") {
    req.user = {};
    req.user.sub = config.GUEST_USER;
    next();
  } else if (req.headers.authorization) {
    let payload;
    let token = req.headers.authorization.replace (/['"]+/g, '');
    try {
      payload = jwt.decode(token, config.TOKENIZATION_SECRET);
    } catch(ex){
      return res.status(404).send({message: "El token de autenticación no es válido."});
    }
    req.user = payload;
    next();
  } else {
    return res.status(403).send({message: "No se ha dado un token de autenticación."});
  }
};
