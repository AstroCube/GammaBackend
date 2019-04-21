"use strict";

const AF = require("@auxiliar_functions");
const Appeal = require("@appeal");
const Action = require("@action");
const moment = require("moment");
const Pagination = require("@pagination_service");
const Promise = require("bluebird");
const Punishment = require("@punishment");

module.exports = {

  appeal_can: async function(req, res) {
    Punishment.find({punished: req.user.sub}, (err, punishments) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al detectar si puedes apelar."});
      if (!punishments || punishments.length <= 0) return res.status(200).send({can_appeal: false});
      return res.status(200).send({can_appeal: true});
    });
  },

  appeal_main: async function(req, res) {
    try {
      let user = await AF.user_placeholder(req.user.sub).then((placeholder) => { return placeholder; }).catch((err) => console.log(err));
      let appeals = await Punishment.find({punished: req.user.sub}).select("_id").exec().then(async (punishments) => {
        if (punishments <= 0) return;
        return await Appeal.find({punishment: {$in: punishments}}).exec().then(async (appeals) => {
          console.log(appeals);
          if (appeals <= 0) return;
          let raw_appeals = await Promise.map(appeals, async (appeal) => {
            return await Punishment.findOne({_id: appeal.punishment}).exec().then(async (punishment) => {
              let status, staff;
              if (!punishment) return;
              // --- Status validator --- //
              status = "appealing";
              if (!punishment.active) status = "appealed";
              if (appeal.closed) status = "closed";
              if (appeal.locked) status = "locked";
              if (punishment.active && appeal.escalated) status = "escalated";
              // --- Staff validator --- //
              staff = punishment.punisher;
              if (appeal.escalated_assigned) staff = appeal.escalated_assigned;
              // --- Last action --- //
              let last_action = await Action.find({_id: {$in: appeal.actions}}).sort("created_at").exec().then(async (actions) => {
                return {
                  action: actions.reverse()[0].type,
                  user: await AF.user_placeholder(actions.reverse()[0].username).then((placeholder) => { return placeholder; }).catch((err) => console.log(err)),
                  created_at: actions.reverse()[0].created_at
                };
              }).catch((err) => {
                console.log(err);
              });
              return {
                id: appeal._id,
                status: status,
                staff: await AF.user_placeholder(staff).then((placeholder) => { return placeholder; }).catch((err) => console.log(err)),
                last_action: last_action
              };
            }).catch((err) => {
              console.log(err);
            });
          });
          return raw_appeals.sort((a, b) => { return a.last_action.created_at - b.last_action.created_at;});
        }).catch((err) => {
          console.log(err);
        });
      }).catch((err) => {
        console.log(err);
      });
      let not_appealed = await Punishment.find({punished: req.user.sub, appealed: false, automatic: false, active: true}).sort("created_at").exec().then(async (punishments) => {
        return await Promise.map(punishments, async (punishment) => {
          return {
            id: punishment._id,
            punisher: await AF.user_placeholder(punishment.punisher).then((placeholder) => { return placeholder; }).catch((err) => console.log(err)),
            punished: await AF.user_placeholder(punishment.punished).then((placeholder) => { return placeholder; }).catch((err) => console.log(err)),
            reason: punishment.reason,
            expires: punishment.expires,
            type: punishment.type
          };
        });
      }).catch((err) => {
        console.log(err);
      });
      return res.status(200).send({appeals: appeals, not_appealed: not_appealed, info: user});
    } catch(err) {
      return res.status(500).send({message: "Ha ocurrido un error al obtener las apelaciones y sanciones."});
    }

  },

  appeal_create: function(req, res) {
    let params = req.body;
    if (params.punishment && params.explanation && params.creator_ip) {
      let appeal = new Appeal();
      appeal.punishment = params.punishment;
      appeal.created_at = moment().unix();
      appeal.creator_ip = params.creator_ip;
      appeal.escalated = false;
      appeal.closed = false;
      appeal.locked = false;
      let create_action = new Action({type: "create", username: req.user.sub, content: params.explanation, realm: "appeal", created_at: moment().unix()});
      create_action.save((err, action) => {
        if (err) return res.status(500).send({message: "Ha ocurrido un error al crear la apelación."});
        appeal.actions.push(action._id);
        appeal.save((err, appeal) => {
          if (err || !appeal) return res.status(500).send({message: "Ha ocurrido un error al crear la apelación."});
          Punishment.findOneAndUpdate({_id: params.punishment}, {appealed: true}, {new: true}, (err, punishment) => {
            if (err || !punishment) return res.status(500).send({message: "Ha ocurrido un error al crear la apelación."});
            return res.status(200).send({appeal});
          });
        });
      });
    } else {
      return res.status(500).send({message: "No se han enviado todos los parametros para crear la apelación."});
    }
  },

  appeal_get: async function(req, res) {
    try {
      Appeal.findOne({_id: req.params.id}, (err, appeal) => {
        if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener la apelación."});
        if (!appeal) return res.status(404).send({message: "No se ha encontrado la apelación."});
        Punishment.findOne({_id: appeal.punishment}, async (err, punishment) => {
          if (err || !punishment) return res.status(500).send({message: "Ha ocurrido un error al obtener la apelación."});
          let actions = await Promise.map(appeal.actions, async (actions) => {
            return await Action.findOne({_id: actions}).exec().then(async (action_found) => {
              return {
                type: action_found.type,
                user: await AF.user_placeholder(action_found.username).then((placeholder) => { return placeholder; }).catch((err) => console.log(err)),
                content: action_found.content,
                created_at: action_found.created_at
              };
            }).catch((err) => {
              console.log(err);
            });
          });

          let actions_fixed = actions.sort((a, b) => { return a.created_at - b.created_at; });
          let punishment_fixed = {
            id: punishment._id,
            punisher_placeholder: await AF.user_placeholder(punishment.punisher).then((placeholder) => { return placeholder; }).catch((err) => console.log(err)),
            punished_placeholder: await AF.user_placeholder(punishment.punished).then((placeholder) => { return placeholder; }).catch((err) => console.log(err)),
            reason: punishment.reason,
            active: punishment.active,
            expires: punishment.expires,
            type: punishment.type
          };
          delete appeal.actions;
          return res.status(200).send({actions: actions_fixed, punishment: punishment_fixed, appeal: appeal});
        });
      });
    } catch(err) {
      console.log(err);
      return res.status(500).send({message: "Ha ocurrido un error al obtener la apelacion."});
    }
  },

  appeal_permissions: function(req, res) {
    try {
      Appeal.findOne({_id: req.params.id}, (err, appeal) => {
        if (err || !appeal) return res.status(500).send({message: "Ha ocurrido un error al obtener el pre_fecth de permissions."});
        let escalated_staff = "";
        if (appeal.escalated_assigned) escalated_staff = appeal.escalated_assigned;
        Punishment.findOne({_id: appeal.punishment}, async (err, punishment) => {

          if (err || !punishment) return res.status(500).send({message: "Ha ocurrido un error al obtener el pre_fecth de permissions."});

          let permissions = {
            comment: false,
            close: false,
            lock: false,
            escalate: false,
            view: false,
            appeal: false
          };

          // -- Comment permission -- //

          await AF.dynamic_permission(req.user.sub, "web_permissions.appeals.transitional.comment", "all").then((permission) => {
            if (permission) permissions.comment = true;
          }).catch((err) => {
            console.log(err);
          });

          await AF.dynamic_permission(req.user.sub, "web_permissions.appeals.transitional.comment", "involved").then((permission) => {
            if (permission) {
              if ((req.user.sub.toString() === punishment.punished.toString())
                || (req.user.sub.toString() === punishment.punisher.toString())
                || (req.user.sub.toString() === escalated_staff.toString())) permissions.comment = true;
            }
          }).catch((err) => {
            console.log(err);
          });

          // -- Close permission -- //

          await AF.dynamic_permission(req.user.sub, "web_permissions.appeals.transitional.close", "all").then((permission) => {
            if (permission) permissions.close = true;
          }).catch((err) => {
            console.log(err);
          });

          await AF.dynamic_permission(req.user.sub, "web_permissions.appeals.transitional.comment", "involved").then((permission) => {
            if (permission) {
              if ((req.user.sub.toString() === punishment.punisher.toString())
                || (req.user.sub.toString() === escalated_staff.toString())) permissions.close = true;
            }
          }).catch((err) => {
            console.log(err);
          });

          // -- Lock permission -- //

          await AF.local_permission(req.user.sub, "web_permissions.appeals.transitional.lock").then((permission) => {
            if (permission) permissions.lock = true;
          }).catch((err) => {
            console.log(err);
          });

          // --- Escalate --- //

          await AF.dynamic_permission(req.user.sub, "web_permissions.appeals.transitional.escalate", "all").then((permission) => {
            if (permission) permissions.escalate = true;
          }).catch((err) => {
            console.log(err);
          });

          await AF.dynamic_permission(req.user.sub, "web_permissions.appeals.transitional.escalate", "involved").then((permission) => {
            if (permission) {
              if ((req.user.sub.toString() === punishment.punisher.toString())
                || (req.user.sub.toString() === punishment.punished.toString())) permissions.escalate = true;
            }
          }).catch((err) => {
            console.log(err);
          });

          // --- Appeal --- //

          await AF.dynamic_permission(req.user.sub, "web_permissions.appeals.transitional.escalate", "all").then((permission) => {
            if (permission) permissions.appeal = true;
          }).catch((err) => {
            console.log(err);
          });

          await AF.dynamic_permission(req.user.sub, "web_permissions.appeals.transitional.escalate", "involved").then((permission) => {
            if (permission) {
              if ((req.user.sub.toString() === punishment.punisher.toString())
                || (req.user.sub.toString() === escalated_staff.toString())) permissions.appeal = true;
            }
          }).catch((err) => {
            console.log(err);
          });

          // --- View --- //

          await AF.dynamic_permission(req.user.sub, "web_permissions.appeals.view", "all").then((permission) => {
            if (permission) permissions.view = true;
          }).catch((err) => {
            console.log(err);
          });

          await AF.dynamic_permission(req.user.sub, "web_permissions.appeals.view", "involved").then((permission) => {
            if (permission) {
              if ((req.user.sub.toString() === punishment.punished.toString())
                || (req.user.sub.toString() === punishment.punisher.toString())
                || (req.user.sub.toString() === escalated_staff.toString())) permissions.view = true;
            }
          }).catch((err) => {
            console.log(err);
          });

          // --- Global --- //

          await AF.local_permission(req.user.sub, "web_permissions.appeals.manage").then((permission) => {
            if (permission) {
              permissions = {
                comment: true,
                close: true,
                lock: true,
                escalate: true,
                view: true,
                appeal: true
              };
            }
          }).catch((err) => {
            console.log(err);
          });

          return res.status(200).send({permissions: permissions});

        });
      });
    } catch(err) {
      console.log(err);
      return res.status(500).send({message: "Ha ocurrido un error al obtener el pre_fecth de permissions."});
    }
  },

  appeal_comment: function(req, res) {
    if (req.body.comment) {
      let create_action = new Action({type: "comment", username: req.user.sub, realm: "appeal", content: req.body.comment, created_at: moment().unix()});
      create_action.save((err, action) => {
        if (err) return res.status(500).send({message: "Ha ocurrido un error al crear el comentario."});
        Appeal.findOneAndUpdate({_id: req.params.id}, {$push: {actions: action._id}}, {new: true}, (err, appeal_updated) => {
          if (err || !appeal_updated) return res.status(500).send({message: "Ha ocurrido un error al crear el comentario."});
          return res.status(200).send({updated: true});
        });
      });
    } else {
      return res.status(500).send({message: "No se ha enviado un contenido para actualizar la apelación."})
    }
  },

  appeal_status: function(req, res) {
    Appeal.findOne({_id: req.params.id}, (err, appeal) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al actualizar la apelación."});
      if (!appeal) return res.status(404).send({message: "No se ha encontrado la apelación"});
      Punishment.findOne({_id: appeal.punishment}, (err, punishment) => {
        if (err || !punishment) return res.status(500).send({message: "Ha ocurrido un error al actualizar la apelación."});
        if (punishment.active) {
          punishment.active = !punishment.active;
          let create_action = new Action({type: "appeal", username: req.user.sub, realm: "appeal", content: req.body.comment, created_at: moment().unix()});
          punishment.save((err, punishment) => {
            if (err || !punishment) return res.status(500).send({message: "Ha ocurrido un error al actualizar la apelación."});
            create_action.save((err, action) => {
              if (err || !action) return res.status(500).send({message: "Ha ocurrido un error al actualizar la apelación."});
              appeal.actions.push(action._id);
              appeal.save((err, appeal_updated) => {
                if (err || !appeal_updated) return res.status(500).send({message: "Ha ocurrido un error al actualizar la apelación."});
                return res.status(200).send({updated: true});
              });
            });
          });
        } else {
          punishment.active = !punishment.active;
          let create_action = new Action({type: "un-appeal", realm: "appeal", username: req.user.sub, content: req.body.comment, created_at: moment().unix()});
          punishment.save((err, punishment) => {
            if (err || !punishment) return res.status(500).send({message: "Ha ocurrido un error al actualizar la apelación."});
            create_action.save((err, action) => {
              if (err || !action) return res.status(500).send({message: "Ha ocurrido un error al actualizar la apelación."});
              appeal.actions.push(action._id);
              appeal.save((err, appeal_updated) => {
                if (err || !appeal_updated) return res.status(500).send({message: "Ha ocurrido un error al actualizar la apelación."});
                return res.status(200).send({updated: true});
              });
            });
          });
        }
      });
    });
  },

  appeal_close: function(req, res) {
    Appeal.findOne({_id: req.params.id}, (err, appeal) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al actualizar la apelación."});
      if (!appeal) return res.status(404).send({message: "No se ha encontrado la apelación."});
      if (appeal.closed) {
        appeal.closed = !appeal.closed;
        let create_action = new Action({type: "open", realm: "appeal", content: req.body.comment, username: req.user.sub, created_at: moment().unix()});
        appeal.save((err, appeal) => {
          if (err || !appeal) return res.status(500).send({message: "Ha ocurrido un error al actualizar la apelación."});
          create_action.save((err, action) => {
            if (err || !action) return res.status(500).send({message: "Ha ocurrido un error al actualizar la apelación."});
            appeal.actions.push(action._id);
            appeal.save((err, appeal_updated) => {
              if (err || !appeal_updated) return res.status(500).send({message: "Ha ocurrido un error al actualizar la apelación."});
              return res.status(200).send({updated: true});
            });
          });
        });
      } else {
        appeal.closed = !appeal.closed;
        let create_action = new Action({type: "close", realm: "appeal", content: req.body.comment, username: req.user.sub, created_at: moment().unix()});
        appeal.save((err, appeal) => {
          if (err || !appeal) return res.status(500).send({message: "Ha ocurrido un error al actualizar la apelación."});
          create_action.save((err, action) => {
            if (err || !action) return res.status(500).send({message: "Ha ocurrido un error al actualizar la apelación."});
            appeal.actions.push(action._id);
            appeal.save((err, appeal_updated) => {
              if (err || !appeal_updated) return res.status(500).send({message: "Ha ocurrido un error al actualizar la apelación."});
              return res.status(200).send({updated: true});
            });
          });
        });
      }
    });
  },

  appeal_lock: function(req, res) {
    Appeal.findOne({_id: req.params.id}, (err, appeal) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al actualizar la apelación."});
      if (!appeal) return res.status(404).send({message: "No se ha encontrado la apelación"});
      if (appeal.locked) {
        appeal.locked = !appeal.locked;
        let create_action = new Action({type: "unlock", realm: "appeal", username: req.user.sub, created_at: moment().unix()});
        appeal.save((err, appeal) => {
          if (err || !appeal) return res.status(500).send({message: "Ha ocurrido un error al actualizar la apelación."});
          create_action.save((err, action) => {
            if (err || !action) return res.status(500).send({message: "Ha ocurrido un error al actualizar la apelación."});
            appeal.actions.push(action._id);
            appeal.save((err, appeal_updated) => {
              if (err || !appeal_updated) return res.status(500).send({message: "Ha ocurrido un error al actualizar la apelación."});
              return res.status(200).send({updated: true});
            });
          });
        });
      } else {
        appeal.locked = !appeal.locked;
        let create_action = new Action({type: "lock", realm: "appeal", username: req.user.sub, created_at: moment().unix()});
        appeal.save((err, appeal) => {
          if (err || !appeal) return res.status(500).send({message: "Ha ocurrido un error al actualizar la apelación."});
          create_action.save((err, action) => {
            if (err || !action) return res.status(500).send({message: "Ha ocurrido un error al actualizar la apelación."});
            appeal.actions.push(action._id);
            appeal.save((err, appeal_updated) => {
              if (err || !appeal_updated) return res.status(500).send({message: "Ha ocurrido un error al actualizar la apelación."});
              return res.status(200).send({updated: true});
            });
          });
        });
      }
    });
  },

  appeal_escalate: function(req, res) {
    if (req.body.comment) {
      Appeal.findOne({_id: req.params.id}, (err, appeal) => {
        if (err || !appeal) return res.status(500).send({message: "Ha ocurrido un error al actualizar la apelación."});
        let create_action = new Action({type: "escalate", realm: "appeal", username: req.user.sub, content: req.body.comment, created_at: moment().unix()});
        create_action.save((err, action) => {
          if (err || !action) return res.status(500).send({message: "Ha ocurrido un error al actualizar la apelación."});
          appeal.actions.push(action._id);
          appeal.escalated = true;
          appeal.save((err, appeal_updated) => {
            if (err || !appeal_updated) return res.status(500).send({message: "Ha ocurrido un error al actualizar la apelación."});
            return res.status(200).send({updated: true});
          });
        });
      });
    } else {
      return res.status(400).send({message: "No se han enviado los parámetros correctos para actualizar la apelación."});
    }
  },

  appeal_list: async function(req, res) {
    let page = 1; if (req.params.page) page = req.params.page;
    let can_assign = await AF.local_permission(req.user.sub, "web_permissions.appeals.assign_escalated").then((permission) => {
      if (permission) return true;
    }).catch((err) => {
      console.log(err);
      return false;
    });
    if (req.params.type === "open" || req.params.type === "closed" || req.params.type === "escalated") {
      Punishment.find({punished: req.user.sub}).select("_id").exec((err, punishments) => {
        if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener las apelaciones."});
        if (punishments <= 0) return res.status(200).send({no_appeals: true, page: 1, pages: 1, type: req.params.type});
        let query = {};
        if (req.params.type === "open") query = {punishment: {$in: punishments}, closed: false};
        if (req.params.type === "closed") query = {punishment: {$in: punishments}, closed: true};
        if (req.params.type === "escalated") query = {punishment: {$in: punishments}, escalated: true};
        Appeal.find(query, async (err, appeals) => {
          if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener las apelaciones."});
          if (appeals <= 0) return res.status(200).send({no_appeals: true, page: 1, pages: 1, type: req.params.type});
          let raw_appeals = await Promise.map(appeals, async (appeal) => {
            return await Punishment.findOne({_id: appeal.punishment}).exec().then(async (punishment) => {
              let status, staff;
              if (!punishment) return;
              // --- Status validator --- //
              status = "appealing";
              if (appeal.closed) status = "closed";
              if (appeal.locked) status = "locked";
              if (punishment.active && appeal.escalated) status = "escalated";
              if (!punishment.active) status = "appealed";
              // --- Staff validator --- //
              staff = punishment.punisher;
              if (appeal.escalated_assigned) staff = appeal.escalated_assigned;
              // --- Last action --- //
              let last_action = await Action.find({_id: {$in: appeal.actions}}).sort("created_at").exec().then(async (actions) => {
                return {
                  action: actions.reverse()[0].type,
                  user: await AF.user_placeholder(actions.reverse()[0].username).then((placeholder) => { return placeholder; }).catch((err) => console.log(err)),
                  created_at: actions.reverse()[0].created_at
                };
              }).catch((err) => {
                console.log(err);
              });
              let involved = false;
              if (req.user.sub.toString() === punishment.punisher.toString()) involved = true;
              if (req.user.sub.toString() === punishment.punished.toString()) involved = true;
              if (appeal.escalated_assigned) {
                if (req.user.sub.toString() === appeal.escalated_assigned.toString()) involved = true;
              }
              return {
                id: appeal._id,
                status: status,
                staff: await AF.user_placeholder(staff).then((placeholder) => { return placeholder; }).catch((err) => console.log(err)),
                last_action: last_action,
                involved: involved
              };
            }).catch((err) => {
              console.log(err);
            });
          });
          let sort_appeals = raw_appeals.sort((a, b) => { return a.last_action.created_at - b.last_action.created_at;});
          let fixed_appeals = await Pagination.paginate(sort_appeals, 20, page).then((posts) => {
            return posts;
          }).catch((err) => {
            console.log(err);
          });
          return res.status(200).send({appeals: fixed_appeals, type: req.params.type, can_assign: can_assign, page: req.params.page, pages: Math.ceil(sort_appeals.length/20)});
        });
      });
    } else if (req.params.type === "involved") {
      Punishment.find({$or: [{punished: req.user.sub}, {punisher: req.user.sub}]}, (err, punishments) => {
        if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener las apelaciones."});
        Appeal.find({$or: [{punishment: {$in: punishments}}, {escalated_assigned: req.user.sub}]}, async (err, appeals) => {
          if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener las apelaciones."});
          if (appeals <= 0) return res.status(200).send({no_appeals: true, page: 1, pages: 1, type: req.params.type});
          let raw_appeals = await Promise.map(appeals, async (appeal) => {
            return await Punishment.findOne({_id: appeal.punishment}).exec().then(async (punishment) => {
              let status, staff;
              if (!punishment) return;
              // --- Status validator --- //
              status = "appealing";
              if (appeal.closed) status = "closed";
              if (appeal.locked) status = "locked";
              if (punishment.active && appeal.escalated) status = "escalated";
              if (!punishment.active) status = "appealed";
              // --- Staff validator --- //
              staff = punishment.punisher;
              if (appeal.escalated_assigned) staff = appeal.escalated_assigned;
              // --- Last action --- //
              let last_action = await Action.find({_id: {$in: appeal.actions}}).sort("created_at").exec().then(async (actions) => {
                return {
                  action: actions.reverse()[0].type,
                  user: await AF.user_placeholder(actions.reverse()[0].username).then((placeholder) => { return placeholder; }).catch((err) => console.log(err)),
                  created_at: actions.reverse()[0].created_at
                };
              }).catch((err) => {
                console.log(err);
              });
              let involved = false;
              if (req.user.sub.toString() === punishment.punisher.toString()) involved = true;
              if (req.user.sub.toString() === punishment.punished.toString()) involved = true;
              if (appeal.escalated_assigned) {
                if (req.user.sub.toString() === appeal.escalated_assigned.toString()) involved = true;
              }
              return {
                id: appeal._id,
                status: status,
                staff: await AF.user_placeholder(staff).then((placeholder) => {
                  return placeholder;
                }).catch((err) => console.log(err)),
                last_action: last_action,
                involved: involved
              };
            }).catch((err) => {
              console.log(err);
            });
          });
          let sort_appeals = raw_appeals.sort((a, b) => { return a.last_action.created_at - b.last_action.created_at;});
          let fixed_appeals = await Pagination.paginate(sort_appeals, 20, page).then((posts) => {
            return posts;
          }).catch((err) => {
            console.log(err);
          });
          return res.status(200).send({appeals: fixed_appeals, type: req.params.type, can_assign: can_assign, page: req.params.page, pages: Math.ceil(sort_appeals.length/20)});
        });
      });
    } else if (req.params.type === "waiting") {
      Appeal.find({escalated: true, escalated_assigned: null}, async (err, appeals) => {
        if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener las apelaciones."});
        if (appeals <= 0) return res.status(200).send({no_appeals: true, page: 1, pages: 1, type: req.params.type});
        let raw_appeals = await Promise.map(appeals, async (appeal) => {
          return await Punishment.findOne({_id: appeal.punishment}).exec().then(async (punishment) => {
            let status, staff;
            if (!punishment) return;
            // --- Status validator --- //
            status = "appealing";
            if (appeal.closed) status = "closed";
            if (appeal.locked) status = "locked";
            if (punishment.active && appeal.escalated) status = "escalated";
            if (!punishment.active) status = "appealed";
            // --- Staff validator --- //
            staff = punishment.punisher;
            if (appeal.escalated_assigned) staff = appeal.escalated_assigned;
            // --- Last action --- //
            let last_action = await Action.find({_id: {$in: appeal.actions}}).sort("created_at").exec().then(async (actions) => {
              return {
                action: actions.reverse()[0].type,
                user: await AF.user_placeholder(actions.reverse()[0].username).then((placeholder) => { return placeholder; }).catch((err) => console.log(err)),
                created_at: actions.reverse()[0].created_at
              };
            }).catch((err) => {
              console.log(err);
            });
            let involved = false;
            if (req.user.sub.toString() === punishment.punisher.toString()) involved = true;
            if (req.user.sub.toString() === punishment.punished.toString()) involved = true;
            if (appeal.escalated_assigned) {
              if (req.user.sub.toString() === appeal.escalated_assigned.toString()) involved = true;
            }
            return {
              id: appeal._id,
              status: status,
              staff: await AF.user_placeholder(staff).then((placeholder) => { return placeholder; }).catch((err) => console.log(err)),
              last_action: last_action,
              involved: involved
            };
          }).catch((err) => {
            console.log(err);
          });
        });
        let sort_appeals = raw_appeals.sort((a, b) => { return a.last_action.created_at - b.last_action.created_at;});
        let fixed_appeals = await Pagination.paginate(sort_appeals, 20, page).then((posts) => {
          return posts;
        }).catch((err) => {
          console.log(err);
        });
        return res.status(200).send({appeals: fixed_appeals, type: req.params.type, can_assign: can_assign, page: req.params.page, pages: Math.ceil(sort_appeals.length/20)});
      });
    } else {
      Punishment.find({$or: [{punished: req.user.sub}, {punisher: req.user.sub}]}).select("_id").exec((err, punishments) => {
        if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener las apelaciones."});
        Appeal.find({$or: [{punishment: {$in: punishments}}, {escalated_assigned: req.user.sub}]}, async (err, appeals) => {
          if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener las apelaciones."});
          if (appeals <= 0) return res.status(200).send({no_appeals: true, page: 1, pages: 1, type: req.params.type});
          let raw_appeals = await Promise.map(appeals, async (appeal) => {
            return await Punishment.findOne({_id: appeal.punishment}).exec().then(async (punishment) => {
              let status, staff;
              if (!punishment) return;
              // --- Status validator --- //
              status = "appealing";
              if (appeal.closed) status = "closed";
              if (appeal.locked) status = "locked";
              if (punishment.active && appeal.escalated) status = "escalated";
              if (!punishment.active) status = "appealed";
              // --- Staff validator --- //
              staff = punishment.punisher;
              if (appeal.escalated_assigned) staff = appeal.escalated_assigned;
              // --- Last action --- //
              let last_action = await Action.find({_id: {$in: appeal.actions}}).sort("created_at").exec().then(async (actions) => {
                return {
                  action: actions.reverse()[0].type,
                  user: await AF.user_placeholder(actions.reverse()[0].username).then((placeholder) => { return placeholder; }).catch((err) => console.log(err)),
                  created_at: actions.reverse()[0].created_at
                };
              }).catch((err) => {
                console.log(err);
              });
              let involved = false;
              if (req.user.sub.toString() === punishment.punisher.toString()) involved = true;
              if (req.user.sub.toString() === punishment.punished.toString()) involved = true;
              if (appeal.escalated_assigned) {
                if (req.user.sub.toString() === appeal.escalated_assigned.toString()) involved = true;
              }
              return {
                id: appeal._id,
                status: status,
                staff: await AF.user_placeholder(staff).then((placeholder) => { return placeholder; }).catch((err) => console.log(err)),
                last_action: last_action,
                involved: involved
              };
            }).catch((err) => {
              console.log(err);
            });
          });
          let sort_appeals = raw_appeals.sort((a, b) => { return a.last_action.created_at - b.last_action.created_at;});
          let fixed_appeals = await Pagination.paginate(sort_appeals, 20, page).then((posts) => {
            return posts;
          }).catch((err) => {
            console.log(err);
          });
          return res.status(200).send({appeals: fixed_appeals, type: req.params.type, can_assign: can_assign, page: req.params.page, pages: Math.ceil(sort_appeals.length/20)});
        });
      });
    }
  },

  appeal_assign: function(req, res) {
    Appeal.findOne({_id: req.params.id}, (err, appeal) => {
      if (appeal.escalated_assigned) return res.status(403).send({message: "Esa apelación ya ha sido asignada a otro staff."});
      if (err) return res.status(500).send({message: "Ha ocurrido un error al actualizar la apelación."});
      let create_action = new Action({type: "assign-escalate", username: req.user.sub});
      create_action.save((err, action) => {
        if (err) return res.status(500).send({message: "Ha ocurrido un error al actualizar la apelación."});
        appeal.actions.push(action._id);
        appeal.escalated_assigned = req.user.sub;
        appeal.save((err, appeal_updated) => {
          if (err || !appeal_updated) return res.status(500).send({message: "Ha ocurrido un error al actualizar la apelación."});
          return res.status(200).send({assigned: true});
        });
      });
    });
  },

  appeal_permission_list: async function(req, res) {
    let permissions = {
      open: true,
      closed: true,
      escalated: true,
      involved: false,
      waiting: false,
      assign: false
    };

    await AF.dynamic_permission(req.user.sub, "web_permissions.appeals.view", "involved").then((permission) => {
      if (permission) permissions.involved = true;
    }).catch((err) => {
      console.log(err);
    });

    await AF.dynamic_permission(req.user.sub, "web_permissions.appeals.view", "all").then((permission) => {
      if (permission) {
        permissions.waiting = true;
        permissions.involved = true;
      }
    }).catch((err) => {
      console.log(err);
    });

    await AF.local_permission(req.user.sub, "web_permissions.appeals.assign_escalated").then((permission) => {
      if (permission) {
        permissions.assign = true;
        permissions.waiting = true;
      }
    }).catch((err) => {
      console.log(err);
    });

    await AF.local_permission(req.user.sub, "web_permissions.appeals.manage").then((permission) => {
      if (permission) {
        permissions.involved = true;
        permissions.assign = true;
        permissions.waiting = true;
      }
    }).catch((err) => {
      console.log(err);
    });

    return res.status(200).send({permissions: permissions});

  }

};