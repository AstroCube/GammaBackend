"use strict";

const Alert = require("@alert");
const AF = require("@auxiliar_functions");
const Appeal = require("@appeal");
const Promise = require("bluebird");
const moment = require("moment");

module.exports = {

  alert_create: async function(alert_new) {
    try {
      if (alert_new.type && alert_new.user) {
        let alert = new Alert();
        alert.type = alert_new.type;
        alert.user = alert_new.user;
        alert.created_at = moment().unix();
        if (alert_new.related) alert.related = alert_new.related;
        return await alert.save().then((alert) => {
          return alert;
        }).catch((err) => {
          console.log(err);
        });
      }
    } catch(err) {
      console.log(err);
    }
  },

  alert_list: function(req, res) {
    try {
      Alert.find({}, async (err, alerts) => {
        if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener la lista de alertas."});
        let alerts_raw = await Promise.map(alerts, async (alert) => {
          let alert_info = {
            type: alert.type,
            user: await AF.user_placeholder(alert.user).then((placeholder) => { return placeholder; }).catch((err) => console.log(err)),
            created_at: alert.created_at
          };
          if (alert.second_user) alert_info.second_user = await AF.user_placeholder(alert.user).then((placeholder) => { return placeholder; }).catch((err) => console.log(err));
          if (alert.type === "appeal_issued" || alert.type === "appeal_issued") {
            alert_info.related = await Appeal.findOne({_id: alert.related}).exec().then((appeal) => {
              return appeal;
            }).catch((err) => {
              console.log(err);
            });
          } else if (alert.type === "forum_quote" || alert.type === "forum_subscribed" || alert.type === "forum_subscribe_news") {
            
          }
        });
      });
    } catch(err) {
      console.log(err);
      return res.status(500).send({message: "Ha ocurrido un error al obtener la lista de alertas."});
    }
  }

};