"use strict";

const AF = require("@auxiliar_functions");
const moment = require("moment");
const Workspace = require("@workspace");

module.exports = {

  workspace_create: function(req, res) {
    if (req.body.extension && req.body.file) {
      let workspace = new Workspace();
      const date = moment().unix();
      workspace.owner = req.user.sub;
      workspace.world = req.params.uuid + "-" + date + ".zip";
      workspace.last_save = date;
      workspace.save((err, workspace) => {
        if (err || !workspace) return res.status(200).send({query_success: false, message: "workspace_error"});
        let file_extension = req.body.extension;
        let file_name = req.params.uuid.replace(/ /g, "_") + "-" + date;
        let file_path = "./uploads/workspace/" + file_name + "." + file_extension;
        if (file_extension === "zip") {
          fs.writeFile(file_path, req.body.file.split(";base64,").pop(), {encoding: "base64"}, (err) => {
            if (err) {
              Workspace.findOneAndDelete({_id: workspace._id}, () => {
                return res.status(200).send({query_success: false, message: "workspace_error"});
              });
            } else {
              return res.status(200).send({query_success: true, workspace: workspace._id});
            }
          });
        } else {
          return res.status(200).send({query_success: false, message: "workspace_error"});
        }
      });
    } else {
      return res.status(200).send({query_success: false, message: "workspace_query_error"});
    }
  },

  workspace_settings: function(req, res) {
    Workspace.findOneAndUpdate({_id: req.params.id}, {settings: req.body}, (err, workspace) => {
      if (err || !workspace) return res.status(200).send({query_success: false, message: "workspace_error"});
      return res.status(200).send({query_success: true});
    });
  },

  workspace_warp_add: function(req, res) {
    Workspace.findOneAndUpdate({_id: req.params.id}, {$push: {warps: req.body}}, (err, workspace) => {
      if (err || !workspace) return res.status(200).send({query_success: false, message: "workspace_error"});
      return res.status(200).send({query_success: true});
    });
  },

  workspace_warp_delete: function(req, res) {
    Workspace.findOneAndUpdate({_id: req.params.id}, {$pull: {warps: {_id: req.params.id}}}, (err, workspace) => {
      if (err || !workspace) return res.status(200).send({query_success: false, message: "workspace_error"});
      return res.status(200).send({query_success: true});
    });
  },


  workspace_permissions_add: async function(req, res) {
    try {
      await AF.real_player(req.body.target, req.user.sub, req.body.realm).then((query) => {
        if (!query.found) return res.status(200).send({query_success: false, message: "workspace_not_found"});
        Workspace.findOneAndUpdate({_id: req.params.id}, {permissions: {$push: {user: query._id}}}, (err, workspace) => {
          if (err || !workspace) return res.status(200).send({query_success: false, message: "workspace_error"});
          return res.status(200).send({query_success: true});
        });
      }).catch((err) => {
        console.log(err);
      });
    } catch(err) {
      return res.status(200).send({query_success: false, message: "workspace_error"});
    }
  },

  workspace_permissions_update: async function(req, res) {
    try {
      await AF.real_player(req.body.target, req.user.sub, req.body.realm).then((query) => {
        if (!query.found) return res.status(200).send({query_success: false, message: "workspace_not_found"});
        Workspace.findOneAndUpdate({_id: req.params.id, permissions: {user: query._id}}, {$pull: {permissions: {user: query._id}}, $push: {permissions: {user: query._id, view: req.body.view, edit: req.body.edit, config: req.body.config}}}, (err, workspace) => {
          if (err) return res.status(200).send({query_success: false, message: "workspace_error"});
          if (!workspace) return res.status(200).send({query_success: false, message: "workspace_query_error"});
          return res.status(200).send({query_success: true});
        });
      }).catch((err) => {
        console.log(err);
      });
    } catch(err) {
      return res.status(200).send({query_success: false, message: "workspace_error"});
    }
  },
  
  workspace_permissions_revoke: async function(req, res) {
    try {
      await AF.real_player(req.body.target, req.user.sub, req.body.realm).then((query) => {
        if (!query.found) return res.status(200).send({query_success: false, message: "workspace_not_found"});
        Workspace.findOneAndUpdate({_id: req.params.id}, {permissions: {$pull: {user: query._id}}}, (err, workspace) => {
          if (err || !workspace) return res.status(200).send({query_success: false, message: "workspace_error"});
          return res.status(200).send({query_success: true});
        });
      }).catch((err) => {
        console.log(err);
      });
    } catch(err) {
      return res.status(200).send({query_success: false, message: "workspace_error"});
    }
  },

  workspace_save: function(req, res) {
    const date = moment().unix();
    if (req.body.extension && req.file && req.body.file_name) {
      let file_extension = req.body.extension;
      let file_name = req.body.file_name.replace(/ /g, "_") + "-" + date;
      let file_path = "./uploads/workspace/" + file_name + "." + file_extension;
      if (file_extension === "zip") {
        fs.writeFile(file_path, req.body.file.split(";base64,").pop(), {encoding: "base64"}, (err) => {
          if (err) return res.status(200).send({query_success: false, message: "workspace_error"});
          Workspace.findOneAndUpdate({_id: req.params.id}, {last_save: date, world: file_name + "." + file_extension}, (err, workspace) => {
            if (err || !workspace) return res.status(200).send({query_success: false, message: "workspace_error"});
            AF.file_unlink(file_path);
            return res.status(200).send({query_success: true, saved_date: date});
          });
        });
      } else {
        return res.status(200).send({query_success: false, message: "workspace_error"});
      }
    } else {
      return res.status(200).send({query_success: false, message: "workspace_error"});
    }
  },

  workspace_exists: function(req, res) {
    Workspace.findOne({owner: req.user.sub}, (err, workspace) => {
      if (err) return res.status(500).send({query_success: false, message: "workspace_error"});
      if (!workspace) return res.status(200).send({query_success: true, found: false});
      return res.status(200).send({query_success: true, found: true});
    });
  },

  workspace_get: function(req, res) {
    Workspace.findOne({owner: req.user.sub}, (err, workspace) => {
      if (err) return res.status(500).send({query_success: false, message: "workspace_error"});
      if (!workspace) return res.status(200).send({query_success: false, message: "workspace_notfound"});
      return res.status(200).send({query_success: true, workspace: workspace});
    });
  }


};