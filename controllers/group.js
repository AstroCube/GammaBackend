"use strict";

const Group = require("@group");
const moment = require("moment");
const User = require("@user");

module.exports = {

  userGroupAdd: function(req, res) {

    let params = req.body;

    if (params.group) {
      User.findOne({_id: req.params.id}, (err, user) => {
        if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener al usuario."});
        if (!user) return res.status(404).send({message: "No se ha encontrado el usuario a actualizar."});

        if (user.groups.some(e => e._id.toString() === params.group.toString())) return res.status(400).send({message: "El usuario ya se encuentra en el grupo"});

        user.groups.push(
            {
              group: params.group,
              joined: moment().unix(),
              comment: params.comment
            }
        );

        user.save((err, updatedUser) => {
          if (err || !updatedUser) return res.status(500).send({message: "Ha ocurrido un error al actualizar el usuario."});
          return res.status(200).send(updatedUser);
        });
      });
    } else {
      return res.status(400).send({message: "No se ha enviado la petición correctamente."});
    }
  },

  userGroupRemove: function(req, res) {

    let params = req.body;

    if (params.groups) {
      User.findOne({_id: req.params.id}, (err, user) => {
        if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener al usuario."});
        if (!user) return res.status(404).send({message: "No se ha encontrado el usuario a actualizar."});

        if (!user.groups.some(e => e.group.toString() === params.group.toString())) return res.status(400).send({message: "El usuario no se encuentra dentro del grupo."});

        user.groups = user.groups.filter((group) => group.group.toString() !== params.group.toString());
        user.save((err, updatedUser) => {
          if (err || !updatedUser) return res.status(500).send({message: "Ha ocurrido un error al actualizar el usuario."});
          return res.status(200).send(updatedUser);
        });
      });
    } else {
      return res.status(400).send({message: "No se ha enviado la petición correctamente."});
    }
  },

  getStaffList: function(req, res) {
    Group.find({staff: true}).select("_id name html_color staff discord_role badge_color badge_link priority").exec((err, groups) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener los grupos."});
      return res.status(200).send(groups);
    });
  },

  getGroupList: function(req, res) {
    Group.find().select({minecraft_permissions: 0, minecraft_flair: 0, web_permissions: 0}).sort("priority").exec((err, groups) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener los grupos."});
      return res.status(200).send(groups);
    });
  },

  updateGroup: function(req, res) {

    let params = req.body;
    delete params.minecraft_flair;
    delete params.minecraft_permissions;
    delete params.web_permissions;
    delete params.staff;

    Group.findOneAndUpdate({_id: req.params.id}, params, (err, updatedGroup) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al actualizar el grupo."});
      if (!updatedGroup) return res.status(404).send({message: "No se ha encontrado el grupo."});
      return res.status(200).send(updatedGroup);
    });
  },

  getGroup: function(req, res) {
    Group.findOne({_id: req.params.id}).select({minecraft_permissions: 0, minecraft_flair: 0, web_permissions: 0}).exec((err, group) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener el grupo."});
      if (!group) return res.status(404).send({message: "No se ha encontrado el grupo."});
      return res.status(200).send(group);
    });
  },

  getStaffMembers: function(req, res) {
    Group.findOne({_id: req.params.id}, (err, group) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener el grupo."});
      if (!group) return res.status(404).send({message: "No se ha encontrado el grupo."});
      if (!group.staff) return res.status(403).send({message: "El grupo no es marcado como staff."});

      User.find({"groups.group": req.params.id}).select("_id username group last_seen twitter public_email").exec((err, users) => {
        if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener los grupos."});
        return res.status(200).send(users);
      });

    });
  },

};
