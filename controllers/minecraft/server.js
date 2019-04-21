"use strict";

const AF = require("@auxiliar_functions");
const Server = require("@server");
const Cluster = require("@cluster");
const cluster_token = require("@cluster_service");
const moment = require("moment");

module.exports = {

  load_server: function(req, res) {
    let params = req.body;
    if (params.slug && params.type && params.cluster) {
      Cluster.findOne({_id: params.cluster}, (err, cluster) => {
        if (!cluster) return res.status(403).send({message: "El cluster al que se intenta iniciar no es válido."});
        let server = new Server();
        server.slug = params.slug;
        server.type = params.type.toLowerCase();
        server.started_at = moment().unix();
        server.gamemode = params.gamemode;
        server.sub_gamemode = params.sub_gamemode;
        server.cluster = params.cluster;
        server.max_running = params.max_running;
        server.max_total = params.max_total;
        server.save((err, server) => {
          if (err || !server) return res.status(500).send({message: "Ha ocurrido un error al iniciar el servidor."});
          return res.status(200).send({server: AF.fixId(server), token: cluster_token.createToken(server), requested: req.params.request});
        });
      });
    } else {
      return res.status(404).send({message: "No se han indicado los parametros correctamente."});
    }
  },

  disconnect_server: function(req, res) {
    Server.findOneAndDelete({"_id": req.server.sub}, (err) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al desconectar el servidor"});
      return res.status(200).send({message: "Desconexión exitosa."});
    });
  }

};