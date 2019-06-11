"use strict";

const AF = require("@auxiliar_functions");
const Friend = require("@friend");
const Promise = require("bluebird");
const User = require("@user");
const Pagination = require("@pagination_service");

module.exports = {

  createFriendship: function(req, res) {
    let params = req.body;
    if (params.sender && params.receiver) {
      let friend = new Friend();
      friend.sender = params.sender;
      friend.receiver = params.receiver;
      friend.save((err, savedFriendship) => {
        if (err || !savedFriendship) return res.status(500).send({message: "Ha ocurrido un error al crear la sanción."});
        return res.status(200).send({created: true});
      });
    } else {
      return res.status(400).send({message: "No se ha enviado correctamente la petición."});
    }
  }

};
