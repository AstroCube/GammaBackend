"use strict";

const Group = require("@group");
const User = require("@user");

module.exports = {

  getStaffList: function(req, res) {
    Group.find({staff: true}).select("_id name html_color").exec((err, groups) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener los grupos."});
      return res.status(200).send(groups);
    });
  },

  getGroupList: function(req, res) {
    Group.find().select({minecraft_permissions: 0, minecraft_flair: 0, web_permissions: 0}).exec((err, groups) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener los grupos."});
      return res.status(200).send(groups);
    });
  },

  getGroup: function(req, res) {
    Group.findOne({_id: req.params.id}).select({minecraft_permissions: 0, minecraft_flair: 0, web_permissions: 0}).exec((err, group) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener los grupos."});
      if (!group) return res.status(404).send({message: "No se ha encontrado el grupo."});
      return res.status(200).send(group);
    });
  },

  getStaffMembers: function(req, res) {
    Group.findOne({_id: req.params.id}, (err, group) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener el grupo."});
      if (!group) return res.status(404).send({message: "No se ha encontrado el grupo."});
      if (!group.staff) return res.status(403).send({message: "El grupo no es marcado como staff."});

      User.find({"group._id": req.params.id}).select("_id username group last_seen twitter public_email").exec((err, users) => {
        if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener los grupos."});
        return res.status(200).send(users);
      });

    });
  },

};
