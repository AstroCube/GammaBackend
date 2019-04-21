"use strict";

const AF = require("@auxiliar_functions");
const Friend = require("@friend");
const Promise = require("bluebird");
const User = require("@user");
const Pagination = require("@pagination_service");

module.exports = {

  ingame_request: function(req, res) {
    try {
      let params = req.body;
      if (!params.target || !params.realm) {
        return res.status(200).send({query_success: "false", message: "commons_friends_error"});
      } else {
        AF.real_player(params.target, req.user.sub, params.realm).then((target_data) => {
          User.findOne({_id: req.user.sub}, (err, user_data) => {
            if (err || !user_data) return res.status(200).send({query_success: "false", message: "commons_friends_error"});
            Friend.findOne({username: target_data._id}, (err, friends_document) => {
              if (err || !friends_document) return res.status(200).send({query_success: "false", message: "commons_friends_error"});
              if (friends_document.accepted.includes(user_data._id.toString())) return res.status(200).send({query_success: "false", message: "commons_friends_already"});
              if (friends_document.pending.includes(user_data._id.toString())) return res.status(200).send({query_success: "false", message: "commons_friends_requested"});
              if (!friends_document.settings.receive_requests && !params.can_bypass) {
                return res.status(200).send({query_success: "false", message: "commons_friends_requests_disabled"});
              } else {
                friends_document.pending.push(user_data._id);
                friends_document.save((err, request) => {
                  if (err) return res.status(200).send({query_success: "false", message: "commons_friends_error"});
                  return res.status(200).send({query_success: "true", target_data});
                });
              }
            });
          });
        }).catch((err) => {
          console.log(err);
          return res.status(200).send({query_success: "false", message: "commons_friends_notfound"});
        });
      }
    } catch(err) {
      return res.status(200).send({message: "commons_friends_error"});
    }
  },

  accept_ingame: function(req, res) {
    try {
      let params = req.body;
      if (!params.target || !params.realm) {
        return res.status(200).send({query_success: "false", message: "commons_friends_error"});
      } else {
        AF.real_player(params.target, req.user.sub, params.realm).then((target_data) => {
          User.findOne({_id: req.user.sub}, (err, user_data) => {
            if (err || !user_data) return res.status(200).send({query_success: "false", message: "commons_friends_error"});
            Friend.findOne({username: user_data._id}, (err, friends_document) => {
              if (err || !friends_document) return res.status(200).send({query_success: "false", message: "commons_friends_error"});
              if (friends_document.accepted.includes(target_data._id.toString())) return res.status(200).send({query_success: "false", message: "commons_friends_already"});
              if (!friends_document.pending.includes(target_data._id.toString())) return res.status(200).send({query_success: "false", message: "commons_friends_no_requested"});
              friends_document.accepted.push(target_data._id.toString());
              friends_document.pending = friends_document.pending.filter(a => a !== target_data._id.toString());
              friends_document.save((err, accept_saved) => {
                if (err || !accept_saved) return res.status(200).send({query_success: "false", message: "commons_friends_error"});
                Friend.findOneAndUpdate({"username": target_data._id}, {$push: {accepted: user_data._id.toString()}, $pull: {pending: user_data._id.toString()}}, (err, accept_remote) => {
                  if (err || !accept_remote) return res.status(200).send({query_success: "false", message: "commons_friends_error"});
                  return res.status(200).send({query_success: "true", target_data});
                });
              });
            });
          });
        }).catch((err) => {
          console.log(err);
          return res.status(200).send({query_success: "false", message: "commons_friends_notfound"});
        });
      }
    } catch(err) {
      return res.status(200).send({message: "commons_friends_error"});
    }
  },

  remove_ingame: function(req, res) {
    try {
      let params = req.body;
      if (!params.target || !params.realm) {
        return res.status(200).send({query_success: "false", message: "commons_friends_error"});
      } else {
        AF.real_player(params.target, req.user.sub, params.realm).then((target_data) => {
          User.findOne({_id: req.user.sub}, (err, user_data) => {
            if (err || !user_data) return res.status(200).send({query_success: "false", message: "commons_friends_error"});
            Friend.findOne({username: user_data._id}, (err, friends_document) => {
              if (err || !friends_document) return res.status(200).send({query_success: "false", message: "commons_friends_error"});
              if (!friends_document.accepted.includes(target_data._id.toString())) return res.status(200).send({query_success: "false", message: "commons_friends_not_friends"});
              if (friends_document.pending.includes(target_data._id.toString())) return res.status(200).send({query_success: "false", message: "commons_friends_just_requested"});
              friends_document.accepted = friends_document.accepted.filter(a => a !== target_data._id.toString());
              friends_document.save((err, accept_saved) => {
                if (err || !accept_saved) return res.status(200).send({query_success: "false", message: "commons_friends_error"});
                Friend.findOneAndUpdate({"username": target_data._id}, {$pull: {accepted: user_data._id.toString()}}, (err, accept_remote) => {
                  if (err || !accept_remote) return res.status(200).send({query_success: "false", message: "commons_friends_error"});
                  return res.status(200).send({query_success: "true", target_data});
                });
              });
            });
          });
        }).catch((err) => {
          console.log(err);
          return res.status(200).send({query_success: "false", message: "commons_friends_notfound"});
        });
      }
    } catch(err) {
      return res.status(200).send({message: "commons_friends_error"});
    }
  },

  reject_ingame: function(req, res) {
    try {
      let params = req.body;
      if (!params.target || !params.realm) {
        return res.status(200).send({query_success: "false", message: "commons_friends_error"});
      } else {
        AF.real_player(params.target, req.user.sub, params.realm).then((target_data) => {
          User.findOne({_id: req.user.sub}, (err, user_data) => {
            if (err || !user_data) return res.status(200).send({query_success: "false", message: "commons_friends_error"});
            Friend.findOne({username: user_data._id}, (err, friends_document) => {
              if (err || !friends_document) return res.status(200).send({query_success: "false", message: "commons_friends_error"});
              if (friends_document.accepted.includes(target_data._id.toString())) return res.status(200).send({query_success: "false", message: "commons_friends_already"});
              if (!friends_document.pending.includes(target_data._id.toString())) return res.status(200).send({query_success: "false", message: "commons_friends_no_requested"});
              friends_document.pending = friends_document.pending.filter(a => a !== target_data._id.toString());
              friends_document.save((err, reject_saved) => {
                if (err || !reject_saved) return res.status(200).send({query_success: "false", message: "commons_friends_error"});
                return res.status(200).send({query_success: "true", target_data});
              });
            });
          });
        }).catch((err) => {
          console.log(err);
          return res.status(200).send({query_success: "false", message: "commons_friends_notfound"});
        });
      }
    } catch(err) {
      return res.status(200).send({message: "commons_friends_error"});
    }
  },

  toggle_ingame: function(req, res) {
    User.findOne({id_: req.user.sub}, (err, user_data) => {
      if (err || !user_data) return res.status(200).send({query_success: "false", message: "commons_friends_error"});
      Friend.findOne({username: user_data._id.toString()}, (err, friend_document) => {
        if (err || !friend_document) return res.status(200).send({query_success: "false", message: "commons_friends_error"});
        friend_document.settings.receive_requests = !friend_document.settings.receive_requests;
        friend_document.save((err, document_updated) => {
          if (err || !document_updated) return res.status(200).send({query_success: "false", message: "commons_friends_error"});
          return res.status(200).send({query_success: "true", receive_requests: document_updated.settings.receive_requests});
        });
      });
    });
  },

  ingame_sort: function(req, res) {
    User.findOne({_id: req.user.sub}, (err, user_data) => {
      if (err || !user_data) return res.status(200).send({query_success: "false", message: "commons_friends_error"});
      Friend.findOne({username: user_data._id.toString()}, (err, friend_document) => {
        if (err || !friend_document) return res.status(200).send({
          query_success: "false",
          message: "commons_friends_error"
        });
        friend_document.settings.friends_sorted = req.params.sort;
        friend_document.save((err, document_updated) => {
          if (err || !document_updated) return res.status(200).send({
            query_success: "false",
            message: "commons_friends_error"
          });
          return res.status(200).send({query_success: "true", sorted: document_updated.settings.friends_sorted});
        });
      });
    });
  },

  reverse_sort: function(req, res) {
    User.findOne({_id: req.user.sub}, (err, user_data) => {
      if (err || !user_data) return res.status(200).send({query_success: "false", message: "commons_friends_error"});
      Friend.findOne({username: user_data._id.toString()}, (err, friend_document) => {
        if (err || !friend_document) return res.status(200).send({query_success: "false", message: "commons_friends_error"});
        friend_document.settings.reversed = !friend_document.settings.reversed;
        friend_document.save((err, document_updated) => {
          if (err || !document_updated) return res.status(200).send({query_success: "false", message: "commons_friends_error"});
          return res.status(200).send({query_success: "true", reversed: document_updated.settings.reversed});
        });
      });
    });
  },

  ingame_sort_get: function(req, res) {
    User.findOne({_id: req.user.sub}, (err, user_data) => {
      if (err || !user_data) return res.status(200).send({query_success: "false", message: "commons_friends_error"});
      Friend.findOne({username: user_data._id.toString()}, (err, friend_document) => {
        if (err || !friend_document) return res.status(200).send({query_success: "false", message: "commons_friends_error2"});
        return res.status(200).send({query_success: "true", sorted: friend_document.settings.friends_sorted, reversed: friend_document.settings.reversed});
      });
    });
  },

  get_players: function(req, res) {
    let params = req.body;
    let page;
    if (!req.params.page) { page = 1; } else { page = req.params.page }
    if(!params.realm || !params.ipp || !params.sorted) {
      return res.status(200).send({query_success: "false", message: "commons_friends_error"});
    } else {
        User.findOne({_id: req.user.sub}, (err, user_data) => {
        if (err || !user_data) return res.status(200).send({query_success: "false", message: "commons_friends_error"});
        Friend.findOne({username: user_data._id}, async (err, friends_document) => {
          if (err || !friends_document) return res.status(200).send({query_success: "false", message: "commons_friends_error"});
          let user_friends = await Promise.map(friends_document.accepted, async (friends) => {
            return await User.findOne({_id: friends}).then(async (friend_user) => {
              let real_groups = await AF.user_groups_id(friend_user._id).then(async (userGroups) => {
                return await Promise.map(userGroups[0].group, async (groups) => {
                  return await AF.server_placeholder(params.realm.toLowerCase(), groups._id).then((group) => {
                    return group;
                  }).catch((err) => {
                    console.log(err);
                  });
                });
              });

              let disguise_group;
              if (friend_user.disguised) {
                disguise_group = await AF.server_placeholder(params.realm.toLowerCase(), friend_user.disguise_group).then((group) => {
                  return group;
                }).catch(() => {console.log(err)});
              }
              real_groups.sort((a, b) => parseFloat(a.priority) - parseFloat(b.priority));

              return {
                username: friend_user.username,
                level: friend_user.level,
                real_group: real_groups[0],
                skin: friend_user.skin,
                last_game: friend_user.last_game,
                disguised: friend_user.disguised,
                disguised_actual: friend_user.disguised_actual,
                disguise_group: disguise_group,
                last_online: friend_user.last_seen
              }
            });
          });

          let sorted_friends;
          if (params.sorted === 3) { // Last seen
            sorted_friends = user_friends.sort((a, b) => {
              return (b.last_online === "conectado") - (a.last_online === "conectado") || a.last_online - b.last_online;
            });
          } else if (params.sorted === 2) { // Alphabetical
            sorted_friends = user_friends.sort((a, b) => {
              return a.username.localeCompare(b.username);
            });
          } else { // Default
            sorted_friends = user_friends.sort((a, b) => {
              return (b.last_online === "conectado") - (a.last_online === "conectado") || a.username.localeCompare(b.username);
            });
          }

          let paginated_friends = await Pagination.paginate(sorted_friends, params.ipp, page).then((paginated) => {
            return paginated;
          }).catch((err) => {
            console.log(err);
          });

          return res.status(200).send({
            friends: paginated_friends,
            total_pages: Math.ceil(user_friends.length/params.ipp),
            actual_page: page
          });
        });
      });
    }
  },

  remove_all: function(req, res) {
    User.findOne({_id: req.user.sub}, (err, user_data) => {
      if (err || !user_data) return res.status(200).send({query_success: "false", message: "commons_friends_error"});
      Friend.findOne({username: user_data._id.toString()}, (err, friend_document) => {
        if (err || !friend_document) return res.status(200).send({query_success: "false", message: "commons_friends_error"});
        friend_document.accepted = [];
        friend_document.save((err, document_updated) => {
          if (err || !document_updated) return res.status(200).send({query_success: "false", message: "commons_friends_error"});
          return res.status(200).send({query_success: "true", reversed: document_updated.settings.reversed});
        });
      });
    });
  },

  get_requests: function(req, res) {
    let params = req.body;
    let page;
    if (!req.params.page) { page = 1; } else { page = req.params.page }
    if(!params.realm) {
      return res.status(200).send({query_success: "false", message: "commons_friends_error"});
    } else {
      User.findOne({_id: req.user.sub}, (err, user_data) => {
        if (err || !user_data) return res.status(200).send({query_success: "false", message: "commons_friends_error"});
        Friend.findOne({username: user_data._id}, async (err, friends_document) => {
          if (err || !friends_document) return res.status(200).send({query_success: "false", message: "commons_friends_error"});
          let user_requests = await Promise.map(friends_document.pending, async (friends) => {
            return await User.findOne({_id: friends}).then(async (friend_user) => {
              let real_groups = await AF.user_groups_id(friend_user._id).then(async (userGroups) => {
                return await Promise.map(userGroups[0].group, async (groups) => {
                  return await AF.server_placeholder(params.realm.toLowerCase(), groups._id).then((group) => {
                    return group;
                  }).catch(() => {console.log(err)});
                });
              });

              let disguise_group;
              if (friend_user.disguised) {
                disguise_group = await AF.server_placeholder(params.realm.toLowerCase(), friend_user.disguise_group).then((group) => {
                  return group;
                }).catch(() => {console.log(err)});
              }

              real_groups.sort((a, b) => parseFloat(a.priority) - parseFloat(b.priority));

              return {
                username: friend_user.username,
                level: friend_user.level,
                real_group: real_groups[0],
                skin: friend_user.skin,
                last_game: friend_user.last_game,
                disguised: friend_user.disguised,
                disguised_actual: friend_user.disguised_actual,
                disguise_group: disguise_group,
                last_online: friend_user.last_seen
              }
            });
          });

          let sorted_requests = user_requests.sort((a, b) => {
            return a.username.localeCompare(b.username);
          });

          let paginated_requests = await Pagination.paginate(sorted_requests, 8, page).then((paginated) => {
            return paginated;
          }).catch((err) => {
            console.log(err);
          });

          return res.status(200).send({
            requests: paginated_requests,
            total_pages: Math.ceil(user_requests.length/8),
            actual_page: page
          });
        });
      });
    }
  },

  find_user: function(req, res) {
    let params = req.body;
    let page;
    if (!req.params.page) { page = 1; } else { page = req.params.page }
    if(!params.realm || !params.search || !params.sorted) {
      return res.status(200).send({query_success: "false", message: "commons_friends_error"});
    } else {
      User.findOne({_id: req.user.sub}, (err, user_data) => {
        if (err || !user_data) return res.status(200).send({query_success: "false", message: "commons_friends_error"});
        Friend.findOne({username: user_data._id}, async (err, friends_document) => {
          if (err || !friends_document) return res.status(200).send({
            query_success: "false",
            message: "commons_friends_error"
          });
          console.log(friends_document.accepted);
          let user_search = await Promise.map(friends_document.accepted, async (friends) => {
            return await User.findOne({
              _id: friends,
              username_lowercase: {$regex: params.search.toLowerCase(), "$options": "i"}
            }).then(async (friend_user) => {
              if (friend_user) {
                let real_groups = await AF.user_groups_id(friend_user._id).then(async (userGroups) => {
                  return await Promise.map(userGroups[0].group, async (groups) => {
                    return await AF.server_placeholder(params.realm.toLowerCase(), groups._id).then((group) => {
                      return group;
                    }).catch((err) => {
                      console.log(err);
                    });
                  });
                });

                let disguise_group;
                if (friend_user.disguised) {
                  disguise_group = await AF.server_placeholder(params.realm.toLowerCase(), friend_user.disguise_group).then((group) => {
                    return group;
                  }).catch((err) => {
                    console.log(err);
                  });
                }

                real_groups.sort((a, b) => parseFloat(a.priority) - parseFloat(b.priority));

                return {
                  username: friend_user.username,
                  level: friend_user.level,
                  real_group: real_groups[0],
                  skin: friend_user.skin,
                  last_game: friend_user.last_game,
                  disguised: friend_user.disguised,
                  disguised_actual: friend_user.disguised_actual,
                  disguise_group: disguise_group,
                  last_online: friend_user.last_seen
                }
              } else {
                return null;
              }
            });
          });

          let sorted_friends;
          if (params.sorted === 3) { // Last seen
            sorted_friends = user_search.sort((a, b) => {
              return (b.last_online === "conectado") - (a.last_online === "conectado") || a.last_online - b.last_online;
            });
          } else if (params.sorted === 2) { // Alphabetical
            sorted_friends = user_search.sort((a, b) => {
              return a.username.localeCompare(b.username);
            });
          } else { // Default
            sorted_friends = user_search.sort((a, b) => {
              return (b.last_online === "conectado") - (a.last_online === "conectado") || a.username.localeCompare(b.username);
            });
          }

          let paginated_requests = await Pagination.paginate(sorted_friends, 27, page).then((paginated) => {
            return paginated;
          }).catch((err) => {
            console.log(err);
          });

          console.log(paginated_requests);
          let fixed_requests = paginated_requests.filter(Boolean);

          let has_results;
          if (fixed_requests.length <= 0) {
            has_results = "false";
          } else {
            has_results = "true";
          }

          return res.status(200).send({
            has_results: has_results,
            search: fixed_requests,
            total_pages: Math.ceil(user_search.length/27),
            actual_page: page
          });
        });
      });
    }
  },

  are_friends: async function(req, res) {
    try {
      await AF.real_player(req.body.username, req.user.sub, req.body.realm).then((response) => {
        Friend.findOne({username: req.user.sub}, (err, friend) => {
          if (err || !friend || !response.found) return res.status(200).send({query_success: false});
          if (!friend.accepted.contains(response._id.toString())) return res.status(200).send({query_success: true, are_friends: false});
          return res.status(200).send({query_success: true, are_friends: true});
        });
      }).catch((err) => {
        console.log(err);
      });
    } catch(err) {
      return res.status(200).send({query_success: false});
    }
  }
};
