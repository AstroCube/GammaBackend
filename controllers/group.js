"use strict";

const AF = require("@auxiliar_functions");
const Group = require("@group");
const Promise = require("bluebird");
const User = require("@user");

module.exports = {

  group_add: function(req, res) {
    let params = req.body;
    if(params.group && params.user) {
      User.findOne({"_id": params.user, "group._id": params.group}).exec((err, user) => {
        if (!user) {
          return res.status(409).send({message: "El usuario no es parte del grupo seleccionado"});
        } else {
          User.findOneAndUpdate({"_id": params.user}, {$pull: {"group": {"_id": params.group}}}, (err, updated) => {
            if(err) return res.status(500).send({message: "Ha ocurrido un error al eliminar el usuario del grupo."});
            if(!updated) return res.status(500).send({message: "Ha ocurrido un error al eliminar el usuario del grupo."});
            return res.status(200).send({message: "Se ha eliminado el grupo del jugador."});
          });
        }
      });
    } else {
      return res.status(409).send({message: "No has seleccionado un grupo/usuario."});
    }
  },

  group_get: function(req, res) {
    let group = req.params.id;
    Group.findById(group, (err, group) => {
      if (err) return res.status(500).send({message: 'Error en la peticion'});
      if (!group) return res.status(404).send({message: 'El usuario no existe'});
      return res.status(200).send({group});
    });
  },

  group_list: function(req, res) {
    Group.find().select("_id name priority html_color staff").sort('priority').exec((err, groups) => {
      if (err) return res.status(500).send({message: 'Ha ocurrido un error al buscar la lista de grupos.'});
      if (!groups) return res.status(404).send({message: 'No se ha encontrado ningún grupo.'});
      return res.status(200).send({groups});
    });
  },

  group_update: function(req, res) {
    let update = req.body;
    let group = req.params.id;

    Group.findByIdAndUpdate(group, update, {new: true}, (err, updatedGroup) => {
      if (err) return res.status(500).send({message: 'Error en la peticion'});
      if (!updatedGroup) return res.status(404).send({message: 'El usuario no existe'});
      return res.status(200).send({updatedGroup});
    });
  },

  list_staff: function(req, res) {
    try {
      Group.find({staff: true}, async (err, staffs) => {
        let staff = await Promise.map(staffs, async (groups) => {
          return await AF.inside_group(groups._id);
        });
        return res.status(200).send({staff});
      });
    } catch(err) {
      console.log(err);
    }
  },

  minecraft_placeholder: async function(req, res) {
    try {
      return await Group.findOne({"name": req.body.name.toLowerCase()}).select({
        "name": 1,
        "priority": 1,
        "minecraft_flair": 1
      }).exec().then(async (group) => {
        let flair = await group.minecraft_flair.filter(flair => {
          return flair.realm === req.body.realm
        });

        if (!flair || flair.length <= 0) {
          return res.status(200).send({
            name: group.name,
            color: "",
            symbol: "",
            priority: group.priority
          });
        } else {
          return res.status(200).send({
            name: group.name,
            color: flair[0].color,
            symbol: flair[0].symbol,
            priority: group.priority
          });
        }
      }).catch((err) => {
        console.log(err);
      });
    } catch (err) {
      return res.status(500).send({message: "Ha ocurrido un error al recibir los datos del grupo."});
    }
  }

};