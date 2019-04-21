"use strict";

const Cluster = require("@cluster");
const moment = require("moment");
const Server = require("@server");

module.exports = {

  create_cluster: function(req, res) {
    let params = req.body;
    if (params.name) {
      let cluster = new Cluster();
      cluster.name = params.name;
      cluster.created_at = moment().unix();
      cluster.save((err, cluster) => {
        if (err) return res.status(500).send({message: "Ha ocurrido un error al iniciar el servidor"});
        if (cluster) return res.status(200).send({cluster});
      });
    } else {
      return res.status(404).send({message: "No se han indicado los parametros correctamente."});
    }
  },

  get_cluster: async function(req, res) {
    try {
      let cluster = await Cluster.findOne({"_id": req.params.id}).exec().then((cluster) => {
        return cluster;
      }).catch((err) => {
        console.log(err);
      });
      let cluster_servers = await Server.find({"cluster": req.params.id}).exec().then((servers) => {
        return servers;
      }).catch((err) => {
        console.log(err);
      });
      return res.status(200).send({cluster: cluster, cluster_servers: cluster_servers});
    } catch(err) {
      console.log(err);
      return res.status(500).send({message: "Ha ocurrido un error al obtener el cluster."});
    }
  },

  update_cluster: function(req, res) {
    let update = req.body;
    Cluster.findOneAndUpdate({"_id": req.params.id}, update, {new: true}, (err, cluster) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al actualizar el cluster."});
      return res.status(200).send({cluster});
    });
  },

  delete_cluster: function(req, res) {
    Cluster.findOneAndDelete({"id": req.params.id}, (err) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al eliminar el cluster."});
      return res.status(200).send({deleted: true});
    });
  }
};