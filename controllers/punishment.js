"use strict";

const Action = require("@action");
const AF = require("@auxiliar_functions");
const moment = require("moment");
const pagination = require("@pagination_service");
const Promise = require("bluebird");
const Punishment = require("@punishment");
const Report = require("@report");

module.exports = {

  punishment_create: function(req, res) {
    let params = req.body;
    if (params.type && params.punished && params.reason && params.evidence) {
      let punishment = new Punishment();
      punishment.type = params.type;
      punishment.punisher = req.user.sub;
      punishment.punished = params.punished;
      punishment.reason = params.reason;
      punishment.server = "Website Punishment";
      punishment.created_at = moment().unix();
      punishment.evidence = params.evidence;
      punishment.expires = params.expires;
      punishment.automatic = false;
      punishment.appealed = false;
      punishment.active = true;
      if (punishment.punished.toString() === punishment.punisher.toString()) return res.status(500).send({message: "No puedes sancionarte a ti mismo."});
      punishment.save((err, punishment_stored) => {
        if (err) return res.status(500).send({message: "Ha ocurrido un error al guardar la sanción."});
        if (req.params.report) {
          let action = new Action({type: "punish", username: req.user.sub, realm: "report", created_at: moment().unix()});
          action.save((err, action_saved) => {
            if (err || !action_saved) return res.status(500).send({message: "Ha ocurrido un error al actualizar el reporte."});
            Report.findOneAndUpdate({_id: req.params.report}, {closed: true, punishment: punishment_stored._id, $push: {actions: action_saved._id}}, (err, report_updated) => {
              if (err || !report_updated) return res.status(500).send({message: "Ha ocurrido un error al actualizar el reporte."});
              return res.status(200).send({punishment_stored});
            });
          });
        } else {
          return res.status(200).send({punishment_stored});
        }
      });
    } else {
      return res.status(500).send({message: "No se han enviado correctamente los parametros"});
    }
  },

  punishment_get: function(req, res) {
    Punishment.findOne({_id: req.params.id}, async (err, punishment) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener la sanción."});
      if (!punishment) return res.status(404).send({message: "No se ha econtrado la sanción."});
      let punished_placeholder = await AF.user_placeholder(punishment.punished).then((placeholder) => { return placeholder; }).catch((err) => console.log(err));
      let punisher_placeholder = await AF.user_placeholder(punishment.punisher).then((placeholder) => { return placeholder; }).catch((err) => console.log(err));
      let can_edit = await AF.local_permission(req.user.sub, "web_permissions.punishments.manage").then((permission) => {
        return permission;
      }).catch((err) => {
        console.log(err);
      });
      if (punishment.punisher.toString() === req.user.sub.toString()) can_edit = true;
      delete punishment.punished;
      delete punishment.punisher;
      return res.status(200).send({
        punished_placeholder: punished_placeholder,
        punisher_placeholder: punisher_placeholder,
        can_edit: can_edit,
        punishment_details: punishment
      });
    });
  },

  punishment_list: function(req, res) {
    try {
      let itemsPerPage = 18;
      Punishment.find(async (err, punishments_id) => {
        if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener la lista de sanciones."});
        let punishments = await Promise.map((punishments_id), async (punishments) => {
          return await AF.punishment_placeholder(punishments._id);
        });
        punishments.sort((a, b) => parseFloat(a.punishment_details.created_at) - parseFloat(b.punishment_details.created_at));
        let paginatedPunishments = await pagination.paginate(punishments, itemsPerPage, req.params.page).then((paginated) => {
          return paginated;
        }).catch((err) => {
          console.log(err);
        });
        return res.status(200).send({
          paginatedPunishments,
          page: req.params.page,
          pages: Math.ceil(punishments.length/itemsPerPage)
        });
      });
    } catch (err) {
      console.log(err);
    }
  },

  punishment_update: function(req, res) {
    let update = req.body;
    delete update.punisher;
    delete update.punished;
    delete update.automatic;
    delete update.server;
    delete update.type;
    delete update._id;
    let id = req.params.id;
    Punishment.findOneAndUpdate({"_id": id}, update, {new: true}, (err, punishment) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al actualizar la sanción."});
      return res.status(200).send({punishment});
    });
  },

  // -- Minecraft Functions -- //

  ingame_create: function(req, res) {
    try {
      let params = req.body;
      if (!params.username || !params.target || !params.type || !params.reason || !params.server || !params.last_ip || !params.realm) {
        return res.status(200).send({query_success: "false", message: "commons_admin_punishments_error"});
      } else {
        AF.real_player(params.target, req.user.sub, params.realm).then((target_data) => {
          if (!target_data.found) return res.status(200).send({query_success: "false", message: "commons_admin_punishments_not_found"});
          let punishment = new Punishment();
          punishment.type = params.type;
          punishment.punisher = req.user.sub;
          punishment.punished = target_data._id;
          punishment.reason = params.reason;
          punishment.last_ip = params.last_ip;
          punishment.server = params.server;
          punishment.created_at = moment().unix();
          punishment.evidence = null;
          if (params.expires) punishment.expires = params.expires;
          punishment.automatic = false;
          punishment.appealed = false;
          punishment.active = true;
          punishment.save((err, punishment) => {
            if (err || !punishment) return res.status(200).send({query_success: "false", message: "commons_admin_punishments_error"});
            return res.status(200).send({
              query_success: "true",
              query_user: target_data.sender,
              query_target: target_data,
              punishment_info: punishment
            });
          });
        }).catch((err) => {
          console.log(err);
          return res.status(200).send({query_success: "false", message: "commons_admin_punishments_error"});
        });
      }
    } catch(err) {
      return res.status(200).send({query_success: "false", message: "commons_admin_punishments_error"});
    }
  },

  ingame_list: function(req, res) {
    try {
      let page;
      let params = req.body;
      if (!req.params.page) {
        page = 1;
      } else {
        page = req.params.page;
      }
      if (!params.username || !params.ipp || !params.target || !params.realm) {
        return res.status(200).send({query_success: "false", message: "commons_admin_punishments_error"});
      } else {
        AF.real_player(params.target, params.realm).then((target_data) => {
          Punishment.find(async (err, punishments_id) => {
            let punishments;
            if (!params.type) {
              punishments = await Promise.map((punishments_id), async (punishments) => {
                return await Punishment.findOne({"_id": punishments._id}).exec().then(async (punishment) => {
                  return punishment;
                }).catch((err) => {
                  console.log(err);
                });
              });
            } else {
              punishments = await Promise.map((punishments_id), async (punishments) => {
                return await Punishment.findOne({"_id": punishments._id, type: params.type.toLowerCase()}).exec().then(async (punishment) => {
                  return punishment;
                }).catch((err) => {
                  console.log(err);
                });
              });
            }
            punishments.sort((a, b) => parseFloat(a.created_at) - parseFloat(b.created_at));
            let paginatedPunishments = await pagination.paginate(punishments, params.ipp, page).then((paginated) => {
              return paginated;
            }).catch((err) => {
              console.log(err);
            });
            let found_register;
            if (punishments.length <= 0) {
              found_register = "false";
            } else {
              found_register = "true";
            }
            return res.status(200).send({
              query_success: "true",
              found_register: found_register,
              query_user: target_data.sender,
              query_target: target_data,
              punishments: paginatedPunishments,
              page,
              pages: Math.ceil(punishments.length/params.ipp)
            });
          });
        }).catch((err) => {
          console.log(err);
          return res.status(200).send({query_success: "false", message: "commons_admin_punishments_error"});
        });
      }
    } catch(err) {
      console.log(err);
      return res.status(200).send({query_success: "false", message: "commons_admin_punishments_error"});
    }
  }

};

/*async function profilePunishments(id) {
  try {
    getUserPunishmentsIds(id).then(async (punishments_id) => {
      let punishments = await Promise.map((punishments_id), async (punishments) => {
        return await AF.punishment_placeholder(punishments._id).then((punishment_placeholder) => { return punishment_placeholder; }).catch((err) => { console.log(err) });
      });
      punishments.sort((a, b) => parseFloat(a.punishment_details.created_at) - parseFloat(b.punishment_details.created_at));
      return punishments;
    }).catch((err) => {
      console.log(err);
    });
  } catch(err) {
    console.log(err);
  }
}*/