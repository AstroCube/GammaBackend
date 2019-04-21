"use strict";

const Action = require("@action");
const AF = require("@auxiliar_functions");
const moment = require("moment");
const User = require("@user");
const Pagination = require("@pagination_service");
const Promise = require("bluebird");
const Report = require("@report");

module.exports = {

  report_pre_create: function(req, res) {
    try {
      User.findOne({username_lowercase: req.body.username.toLowerCase()}, async (err, username) => {
        if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener el usuario."});
        if (!username) return res.status(200).send({found: false});
        let placeholder = await AF.user_placeholder(username._id).then((placeholder) => { return placeholder; }).catch((err) => console.log(err));
        return res.status(200).send({found: true, user: placeholder});
      });
    } catch(err) {
      console.log(err);
      return res.status(500).send({message: "Ha ocurrido un error al obtener el usuario."});
    }
  },

  report_create: function(req, res) {
    let params = req.body;
    if (params.rule && params.evidence && params.involved && params.creator_ip) {
      let report = new Report();
      report.created_at = moment().unix();
      report.creator_ip = params.creator_ip;
      report.creator = req.user.sub;
      report.involved = params.involved;
      report.rule = params.rule;
      report.evidence = params.evidence;
      if (params.miscellaneous) report.miscellaneous = params.miscellaneous;
      let create_action = new Action({type: "create", username: req.user.sub, realm: "report", created_at: report.created_at});
      create_action.save((err, action) => {
        if (err || !action) return res.status(500).send({message: "Ha ocurrido un error al crear el reporte."});
        report.actions.push(action._id);
        report.save((err, saved_report) => {
          if (err || !saved_report) return res.status(500).send({message: "Ha ocurrido un error al crear el reporte."});
          return res.status(200).send({report: saved_report._id});
        });
      });
    } else {
      return res.status(400).send({message: "No se han indicado los parametros correctos para reportar."});
    }
  },

  report_permissions: function(req, res) {
    try {
      Report.findOne({_id: req.params.id}, async (err, report) => {
        if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener el reporte."});
        if (!report) return res.status(404).send({message: "No se ha encontrado el reporte."});

        let permissions = {
          view: false,
          comment: false,
          close: false,
          punish: false
        };

        // -- View permission -- //

        await AF.dynamic_permission(req.user.sub, "web_permissions.reports.transitional.view", "all").then((permission) => {
          if (permission) permissions.view = true;
        }).catch((err) => {
          console.log(err);
        });

        await AF.dynamic_permission(req.user.sub, "web_permissions.reports.transitional.view", "involved").then((permission) => {
          if (permission) {
            if ((req.user.sub.toString() === report.creator.toString())
              || (req.user.sub.toString() === report.assigned.toString())) permissions.view = true;
          }
        }).catch((err) => {
          console.log(err);
        });

        if (report.assigned) {
          if (req.user.sub.toString() === report.assigned.toString()) permissions.close = true;
          if (req.user.sub.toString() === report.assigned.toString()) permissions.punish = true;
          if ((req.user.sub.toString() === report.creator.toString()) || (req.user.sub.toString() === report.assigned.toString())) permissions.comment = true;
        }

        await AF.local_permission(req.user.sub, "web_permissions.reports.manage").then((permission) => {
          if (permission) {
            permissions = {
              view: true,
              comment: true,
              close: true,
              punish: true
            };
          }
        }).catch((err) => {
          console.log(err);
        });

        return res.status(200).send({permissions});

      });
    } catch (err) {
      console.log(err);
      return res.status(500).send({message: "Ha ocurrido un error al obtener los permisos del reporte."});
    }
  },

  report_punish_checker: function(req, res) {
    Report.findOne({_id: req.params.id}, async (err, report) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener el reporte."});
      if (!report) return res.status(404).send({message: "No se ha encontrado el reporte."});
      if (report.punishment) return res.status(403).send({message: "Ya se ha sancionado el reporte."});
      let placeholder = await AF.user_placeholder(report.involved).then((placeholder) => { return placeholder; }).catch((err) => console.log(err));
      return res.status(200).send({placeholder: placeholder, report: report._id});
    });
  },

  report_view: function(req, res) {
    try {
      Report.findOne({_id: req.params.id}, async (err, report) => {
        if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener el reporte."});
        if (!report) return res.status(404).send({message: "No se ha encontrado el reporte."});
        let report_info = {
          id: report._id,
          creator: await AF.user_placeholder(report.creator).then((placeholder) => { return placeholder; }).catch((err) => console.log(err)),
          involved: await AF.user_placeholder(report.involved).then((placeholder) => { return placeholder; }).catch((err) => console.log(err)),
          created_at: report.created_at,
          creator_ip: report.creator_ip,
          rule: report.rule,
          punishment: report.punishment,
          evidence: report.evidence,
          closed: report.closed
        };
        if (report.miscellaneous) report_info.miscellaneous = report.miscellaneous;
        if (report.assigned) report_info.assigned = await AF.user_placeholder(report.assigned).then((placeholder) => { return placeholder; }).catch((err) => console.log(err));
        let actions = await Promise.map(report.actions, async (actions) => {
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
        delete report.actions;
        return res.status(200).send({actions: actions_fixed, report: report_info});
      });
    } catch (err) {
      console.log(err);
      return res.status(500).send({message: "Ha ocurrido un error al obtener los el reporte."});
    }
  },

  report_comment: function(req, res) {
    if (req.body.content) {
      Report.findOne({_id: req.params.id}, (err, report) => {
        if (err || !report) return res.status(500).send({message: "Ha ocurrido un error al actualizar el reporte."});
        let action = new Action({type: "comment", username: req.user.sub, realm: "report", content: req.body.content, created_at: moment().unix()});
        action.save((err, action_saved) => {
          if (err || !action_saved) return res.status(500).send({message: "Ha ocurrido un error al actualizar el reporte."});
          Report.findOneAndUpdate({_id: report._id}, {$push: {actions: action_saved._id}}, (err, report_updated) => {
            if (err || !report_updated) return res.status(500).send({message: "Ha ocurrido un error al actualizar el reporte."});
            return res.status(200).send({updated: true});
          });
        });
      });
    } else {
      return res.status(400).send({message: "No se han indicado los parametros correctos para comentar el reporte."});
    }
  },

  report_close: function(req, res) {
    Report.findOne({_id: req.params.id}, (err, report) => {
      if (err || !report) return res.status(500).send({message: "Ha ocurrido un error al actualizar el reporte."});
      if (report.closed) {
        let action = new Action({type: "open", username: req.user.sub, realm: "report", content: req.body.content});
        action.save((err, action_saved) => {
          if (err || !action_saved) return res.status(500).send({message: "Ha ocurrido un error al actualizar el reporte."});
          Report.findOneAndUpdate({_id: report._id}, {closed: false, $push: {actions: action_saved._id}}, (err, report_updated) => {
            if (err || !report_updated) return res.status(500).send({message: "Ha ocurrido un error al actualizar el reporte."});
            return res.status(200).send({updated: true});
          });
        });
      } else {
        let action = new Action({type: "close", username: req.user.sub, realm: "report", content: req.body.content});
        action.save((err, action_saved) => {
          if (err || !action_saved) return res.status(500).send({message: "Ha ocurrido un error al actualizar el reporte."});
          Report.findOneAndUpdate({_id: report._id}, {closed: true, $push: {actions: action_saved._id}}, (err, report_updated) => {
            if (err || !report_updated) return res.status(500).send({message: "Ha ocurrido un error al actualizar el reporte."});
            return res.status(200).send({updated: true});
          });
        });
      }
    });
  },

  report_assign: function(req, res) {
    Report.findOneAndUpdate({_id: req.params.id}, {assigned: req.user.sub}, (err, updated_report) => {
      if (err || !updated_report) return res.status(500).send({message: "Ha ocurrido un error al actualizar el reporte."});
      return res.status(200).send({assigned: true});
    });
  },

  report_assignable: async function(req, res) {
    try {
      let final = false;
      let manage = await AF.local_permission(req.user.sub, "web_permissions.reports.manage").then((permission) => {
        if (permission) return true;
      }).catch((err) => {
        console.log(err);
        return false;
      });
      let can_assign = await AF.local_permission(req.user.sub, "web_permissions.reports.assign").then((permission) => {
        if (permission) return true;
      }).catch((err) => {
        console.log(err);
        return false;
      });
      if (can_assign || manage) final = true;
      return res.status(200).send({can_assign: final});
    } catch (err) {
      console.log(err);
      return res.status(500).send({message: "Ha ocurrido un error al obtener la lista de reportes."});
    }
  },

  report_list: async function(req, res) {
    try {
      let page = 1; if (req.params.page) page = req.params.page;
      let can_assign = await AF.local_permission(req.user.sub, "web_permissions.report.assign").then((permission) => {
        if (permission) return true;
      }).catch((err) => {
        console.log(err);
        return false;
      });
      let manage = await AF.local_permission(req.user.sub, "web_permissions.report.manage").then((permission) => {
        if (permission) return true;
      }).catch((err) => {
        console.log(err);
        return false;
      });
      let query = {};
      switch (req.params.type) {
        case "open": {
          query = {closed: false};
          break;
        }
        case "closed": {
          query = {closed: true};
          break;
        }
        case "waiting": {
          query = {assigned: {$exists: false}};
          break;
        }
        default: {
          if (manage) {
            query = {};
          } else if (can_assign) {
            query = {$or: [{assigned: {$exists: false}}, {creator: req.user.sub}, {assigned: req.user.sub}]};
          } else {
            query = {creator: req.user.sub};
          }
          break;
        }
      }
      Report.find(query, async (err, reports) => {
        if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener la lista de reportes."});
        if (!reports) return res.status(200).send({not_found: true});
        let raw_reports = await Promise.map(reports, async (report) => {
          let report_info = {
            id: report._id,
            creator: await AF.user_placeholder(report.creator).then((placeholder) => { return placeholder; }).catch((err) => console.log(err)),
            involved: await AF.user_placeholder(report.involved).then((placeholder) => { return placeholder; }).catch((err) => console.log(err)),
            created_at: report.created_at
          };
          if (report.assigned) report_info.assigned = await AF.user_placeholder(report.assigned).then((placeholder) => { return placeholder; }).catch((err) => console.log(err));
          return report_info;
        });
        let sort_reports = raw_reports.sort((a, b) => { return a.created_at - b.created_at;});
        let fixed_reports = await Pagination.paginate(sort_reports, 20, page).then((posts) => {
          return posts;
        }).catch((err) => {
          console.log(err);
        });
        return res.status(200).send({reports: fixed_reports, type: req.params.type, can_assign: can_assign, page: req.params.page, pages: Math.ceil(sort_reports.length/20)});
      });
    } catch (err) {
      console.log(err);
      return res.status(500).send({message: "Ha ocurrido un error al obtener la lista de reportes."});
    }
  }
};