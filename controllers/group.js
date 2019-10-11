"use strict";

const Group = require("@group");
const User = require("@user");

module.exports = {

  getStaffList: function(req, res) {
    Group.find({staff: true}, (err, groups) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener los grupos."});
      return res.status(200).send(groups);
    });
  },

  getGroupMembers: function(req, res) {
    User.find({group: {_id: req.params.id}}, (err, users) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener los grupos."});
      return res.status(200).send(users);
    });
  }

};