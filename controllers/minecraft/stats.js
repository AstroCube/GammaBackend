"use strict";

const AF = require("@auxiliar_functions");
const Pagination = require("@pagination_service");
const Stats = require("@stats");

module.exports = {
  user_stats: async function (req, res) {
    try {
      if (!req.body.username || !req.body.realm) {
        return res.status(200).send({query_success: "false", message: "commons_stats_error"});
      } else {
        await AF.real_player(req.body.username, req.user.sub, req.body.realm).then((target_data) => {
          Stats.findOne({username: target_data._id}).populate("cosmetics").exec((err, stats_sheet) => {
            if (err || !stats_sheet) return res.status(200).send({
              query_success: "false",
              message: "commons_stats_error"
            });
            return res.status(200).send({query_success: "true", stats: stats_sheet});
          });
        }).catch((err) => {
          console.log(err);
          return res.status(200).send({query_success: "false", message: "commons_stats_not_found"});
        });
      }
    } catch (err) {
      console.log(err);
      return res.status(200).send({query_success: "false", message: "commons_stats_error"});
    }
  },

  update_stats: function(req, res) {
    if (!req.body.username || !req.body.realm || !req.body.update) {
      return res.status(200).send({query_success: "false", message: "commons_stats_error"});
    } else {
      AF.real_player(req.body.username, req.user.sub, req.body.realm).then((target_data) => {
        Stats.findOneAndUpdate({username: target_data._id}, req.body.update, (err, stats_sheet) => {
          if (err || !stats_sheet) return res.status(200).send({query_success: "false", message: "commons_stats_error"});
          return res.status(200).send({query_success: "true", stats: stats_sheet});
        });
      }).catch((err) => {
        console.log(err);
        return res.status(200).send({query_success: "false", message: "commons_stats_not_found"});
      });
    }
  },

  get_inventory: function(req, res) {
    let page;
    if (!req.params.page) {
      page = 1;
    } else {
      page = req.params.page;
    }
    AF.real_player(req.body.username, req.user.sub, req.body.realm).then((target_data) => {
      Stats.findOne({username: target_data._id}).select({_id: 0, cosmetics: 1}).populate("cosmetics").exec(async (err, stats_sheet) => {
        if (err || !stats_sheet) return res.status(200).send({query_success: "false", message: "commons_stats_error"});
        let paginated_inventory = await Pagination.paginate(stats_sheet, 27, page).then((paginated) => {
          return paginated;
        }).catch((err) => {
          console.log(err);
        });
        return res.status(200).send({paginated_inventory});
      });
    }).catch((err) => {
      console.log(err);
      return res.status(200).send({query_success: "false", message: "commons_stats_not_found"});
    });
  }
};