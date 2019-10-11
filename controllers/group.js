"use strict";

const Group = require("@group");
const User = require("@user");

module.exports = {

  getStaffList: function(req, res) {
    Group.find({staff: true}).select("_id").exec((err, groups) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener los grupos."});
      return res.status(200).send(groups);
    });
  },

  getStaffMembers: function(req, res) {
    Group.findOne({_id: req.params.id}, (err, group) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener el grupo."});
      if (!group) return res.status(404).send({message: "No se ha encontrado el grupo."});
      if (!group.staff) return res.status(403).send({message: "El grupo no es marcado como staff."});

      User.find({group: {_id: req.params.id}}).select({password: 0}).exec((err, users) => {
        if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener los grupos."});
        return res.status(200).send(users);
      });

    });
  }

};