"use strict";

const jwt = require("jwt-simple");
const config = require("../config");

exports.ensureAuth = function(req, res, next) {

  if (!req.headers.game_authorization) {
    return res.status(403).send({message: "No se ha dado ningun Token de autenticación."});
  }

  let token = req.headers.game_authorization.replace(/['"]+/g, '');

  try {
    var payload = jwt.decode(token, config.TOKENIZATION_SECRET);
  } catch(ex){
    return res.status(404).send({message: "El token de autenticación no es valido."});
  }

  req.user = payload;
  next();

};
