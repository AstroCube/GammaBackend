"use strict";

const AF = require("@auxiliar_functions");
const moment = require("moment");
const Party = require("@party");
const Promise = require("bluebird");
const User = require("@user");

module.exports = {

  party_command: async function(req, res) {
    if (req.body.target && req.body.realm) {
      await AF.real_player(req.body.target, req.user.sub, req.body.realm).then((query) => {
        if (query.found) {
          if (query.last_seen === "conectado") {
            Party.findOne({leader: req.user.sub, pending: query._id}, (err, already_invited) => {
              if (err) return res.status(200).send({query_success: false, message: "party_error"});
              if (!already_invited) {
                Party.findOne({leader: {$ne: req.user.sub}, "members.user": req.user.sub}, (err, found_joined) => {
                  if (err) return res.status(200).send({query_success: false, message: "party_error"});
                  if (!found_joined) {
                    Party.findOne({leader: req.user.sub, "members.user": query._id}, (err, found_already) => {
                      if (err) return res.status(200).send({query_success: false, message: "party_error"});
                      if (!found_already) {
                        Party.findOne({leader: query._id, pending: req.user.sub}, (err, found_pending) => {
                          if (err) return res.status(200).send({query_success: false, message: "party_error"});
                          if (found_pending) {
                            Party.findOneAndUpdate({_id: found_pending._id}, {$push: {members: {user: req.user.sub, joined_at: moment().unix()}}, $pull: {pending: req.user.sub}}, (err, joined_party) => {
                              if (err || !joined_party) return res.status(200).send({query_success: false, message: "party_error"});
                              return res.status(200).send({query_success: true, action: "accept", placeholders: query});
                            });
                          } else {
                            Party.findOne({$or: [{"members.user": query._id}, {leader: query._id}]}, (err, already_party) => {
                              if (err) return res.status(200).send({query_success: false, message: "party_error"});
                              if (already_party) {
                                return res.status(200).send({query_success: false, message: "party_other_joined"});
                              } else {
                                Party.findOne({leader: req.user.sub}, (err, own_party) => {
                                  if (err) return res.status(200).send({query_success: false, message: "party_error"});
                                  if (own_party) {
                                    Party.findOneAndUpdate({_id: own_party._id}, {$push: {pending: query._id}}, (err, updated_own) => {
                                      if (err || !updated_own) return res.status(200).send({query_success: false, message: "party_error"});
                                      return res.status(200).send({query_success: true, action: "invite", placeholders: query});
                                    });
                                  } else {
                                    let party = new Party();
                                    party.leader = req.user.sub;
                                    party.pending.push(query._id);
                                    party.save((err, saved_party) => {
                                      if (err || !saved_party) return res.status(200).send({query_success: false, message: "party_error"});
                                      return res.status(200).send({query_success: true, action: "invite", placeholders: query});
                                    });
                                  }
                                });
                              }
                            });
                          }
                        });
                      } else {
                        return res.status(200).send({query_success: false, message: "party_already"});
                      }
                    });
                  } else {
                    return res.status(200).send({query_success: false, message: "party_not_leader"});
                  }
                });
              } else {
                return res.status(200).send({query_success: false, message: "party_already_invited"});
              }
            });
          } else {
            return res.status(200).send({query_success: false, message: "party_offline"});
          }
        } else {
          return res.status(200).send({query_success: false, message: "party_not_found"});
        }
      }).catch((err) => {
        console.log(err);
        return res.status(200).send({query_success: false, message: "party_error"});
      });
    } else {
      return res.status(200).send({query_success: false, message: "party_error"});
    }
  },

  party_accept: async function(req, res) {
    await AF.real_player(req.body.target, req.user.sub, req.body.realm).then((query) => {
      if (query.found) {
        Party.findOne({leader: query._id, pending: req.user.sub}, (err, found_pending) => {
          if (err) return res.status(200).send({query_success: false, message: "party_error"});
          if (found_pending) {
            Party.findOneAndUpdate({_id: found_pending._id}, {$push: {members: {user: req.user.sub, joined_at: moment().unix()}}, $pull: {pending: req.user.sub}}, (err, joined_party) => {
              if (err || !joined_party) return res.status(200).send({query_success: false, message: "party_error"});
              return res.status(200).send({query_success: true, placeholders: query});
            });
          } else {
            return res.status(200).send({query_success: false, message: "party_not_invited"});
          }
        });
      } else {
        return res.status(200).send({query_success: false, message: "party_not_found"});
      }
    }).catch((err) => {
      console.log(err);
      return res.status(200).send({query_success: false, message: "party_error"});
    });
  },

  party_invite: async function(req, res) {
    await AF.real_player(req.body.target, req.user.sub, req.body.realm).then((query) => {
      if (query.found) {
        if (query.last_seen === "conectado") {
          Party.findOne({leader: req.user.sub, pending: query._id}, (err, already_invited) => {
            if (err) return res.status(200).send({query_success: false, message: "party_error"});
            if (!already_invited) {
              Party.findOne({leader: {$ne: req.user.sub}, "members.user": req.user.sub}, (err, found_joined) => {
                if (err) return res.status(200).send({query_success: false, message: "party_error"});
                if (!found_joined) {
                  Party.findOne({leader: req.user.sub, "members.user": query._id}, (err, found_already) => {
                    if (err) return res.status(200).send({query_success: false, message: "party_error"});
                    if (!found_already) {
                      Party.findOne({$or: [{"members.user": query._id}, {leader: query._id}]}, (err, already_party) => {
                        if (err) return res.status(200).send({query_success: false, message: "party_error"});
                        if (already_party) {
                          return res.status(200).send({query_success: false, message: "party_other_joined"});
                        } else {
                          Party.findOne({leader: req.user.sub}, (err, own_party) => {
                            if (err) return res.status(200).send({query_success: false, message: "party_error"});
                            if (own_party) {
                              Party.findOneAndUpdate({_id: own_party._id}, {$push: {pending: query._id}}, (err, updated_own) => {
                                if (err || !updated_own) return res.status(200).send({query_success: false, message: "party_error"});
                                return res.status(200).send({query_success: true, placeholders: query});
                              });
                            } else {
                              let party = new Party();
                              party.leader = req.user.sub;
                              party.pending.push(query._id);
                              party.save((err, saved_party) => {
                                if (err || !saved_party) return res.status(200).send({query_success: false, message: "party_error"});
                                return res.status(200).send({query_success: true, placeholders: query});
                              });
                            }
                          });
                        }
                      });
                    } else {
                      return res.status(200).send({query_success: false, message: "party_already"});
                    }
                  });
                } else {
                  return res.status(200).send({query_success: false, message: "party_not_leader"});
                }
              });
            } else {
              return res.status(200).send({query_success: false, message: "party_already_invited"});
            }
          });
        } else {
          return res.status(200).send({query_success: false, message: "party_offline"});
        }
      } else {
        return res.status(200).send({query_success: false, message: "party_not_found"});
      }
    }).catch((err) => {
      console.log(err);
      return res.status(200).send({query_success: false, message: "party_error"});
    });
  },

  party_leave: function(req, res) {
    Party.findOne({leader: req.user.sub}, (err, leader_party) => {
      if (err) return res.status(200).send({query_success: false, message: "party_error"});
      if (!leader_party) {
        Party.findOneAndUpdate({"members.user": req.user.sub}, {$pull: {members: {user: req.user.sub}}}, {new: true}, (err, updated_party) => {
          if (err) return res.status(200).send({query_success: false, message: "party_error"});
          if (!updated_party) return res.status(200).send({query_success: false, message: "party_not_joined"});
          if (updated_party.members.length <= 0) {
            Party.findOneAndDelete({_id: updated_party._id}, (err) => {
              if (err) return res.status(200).send({query_success: false, message: "party_error"});
              return res.status(200).send({query_success: true, disbanded: true});
            });
          } else {
            return res.status(200).send({query_success: true});
          }
        });
      } else {
        return res.status(200).send({query_success: false, message: "party_leader_disband"});
      }
    });
  },

  party_disband: function(req, res) {
    Party.findOne({leader: req.user.sub}, (err, leader_party) => {
      if (err) return res.status(200).send({query_success: false, message: "party_error"});
      if (leader_party) {
        if (leader_party.members.length >= 1) {
          Party.findOneAndDelete({_id: leader_party._id}, (err) => {
            if (err) return res.status(200).send({query_success: false, message: "party_error"});
            return res.status(200).send({query_success: true});
          });
        } else {
          return res.status(200).send({query_success: false, message: "party_disband_insufficient"});
        }
      } else {
        Party.findOne({"members.user": req.user.sub}, (err, joined_party) => {
          if (err) return res.status(200).send({query_success: false, message: "party_error"});
          if (!joined_party) return res.status(200).send({query_success: false, message: "party_not_joined"});
          return res.status(200).send({query_success: false, message: "party_not_leader"});
        });
      }
    });
  },

  party_promote: async function(req, res) {
    await AF.real_player(req.body.target, req.user.sub, req.body.realm).then((query) => {
      if (query.found) {
        Party.findOne({leader: req.user.sub}, (err, leader_party) => {
          if (err) return res.status(200).send({query_success: false, message: "party_error"});
          if (leader_party) {

            Party.findOne({leader: req.user.sub, "members.user": query._id}, (err, found_party) => {
              if (err) return res.status(200).send({query_success: false, message: "party_error"});
              if (!found_party) return res.status(200).send({query_success: false, message: "party_not_member"});
              Party.findOneAndUpdate({_id: found_party._id}, {$pull: {members: {user: query._id}}}, {new: true}, (err, updated_party) => {
                if (err || !updated_party) return res.status(200).send({query_success: false, message: "party_error"});
                Party.findOneAndUpdate({_id: found_party._id}, {leader: query._id, $push: {members: {user: req.user.sub, joined_at: moment().unix()}}}, (err, updated_final) => {
                  if (err || !updated_final) return res.status(200).send({query_success: false, message: "party_error"});
                  return res.status(200).send({query_success: true, placeholders: query});
                });
              });
            });
          } else {
            Party.findOne({"members.user": req.user.sub}, (err, joined_party) => {
              if (err) return res.status(200).send({query_success: false, message: "party_error"});
              if (!joined_party) return res.status(200).send({query_success: false, message: "party_not_joined"});
              return res.status(200).send({query_success: false, message: "party_not_leader"});
            });
          }
        });
      } else {
        return res.status(200).send({query_success: false, message: "party_not_found"});
      }
    }).catch((err) => {
      console.log(err);
      return res.status(200).send({query_success: false, message: "party_error"});
    });
  },

  party_kick_offline: function (req, res) {
    Party.findOne({leader: req.user.sub}, async (err, leader_party) => {
      if (err) return res.status(200).send({query_success: false, message: "party_error"});
      if (leader_party) {
        let kicked = await Promise.map(leader_party.members, async (member) => {
          return await User.findOne({_id: member.user}).exec().then((user) => {
            if (user.last_seen !== "conectado") return user._id;
          }).catch((err) => {
            console.log(err);
          });
        });
        Party.findOneAndUpdate({_id: leader_party._id}, {$pull: {members: {user: {$in: kicked}}}}, {new: true}, (err, updated_party) => {
          if (err) return res.status(200).send({query_success: false, message: "party_error"});
          if (!updated_party) return res.status(200).send({query_success: false, message: "party_not_member"});
          if (updated_party.members.length <= 0) {
            Party.findOneAndDelete({_id: leader_party._id}, (err) => {
              if (err) return res.status(200).send({query_success: false, message: "party_error"});
              return res.status(200).send({query_success: true, disbanded: true});
            });
          } else {
            return res.status(200).send({query_success: true});
          }
        });
      } else {
        Party.findOne({"members.user": req.user.sub}, (err, joined_party) => {
          if (err) return res.status(200).send({query_success: false, message: "party_error"});
          if (!joined_party) return res.status(200).send({query_success: false, message: "party_not_joined"});
          return res.status(200).send({query_success: false, message: "party_not_leader"});
        });
      }
    });
  },

  party_kick: async function(req, res) {
    await AF.real_player(req.body.target, req.user.sub, req.body.realm).then((query) => {
      if (query.found) {
        Party.findOne({leader: req.user.sub}, (err, leader_party) => {
          if (err) return res.status(200).send({query_success: false, message: "party_error"});
          if (leader_party) {

            Party.findOne({leader: req.user.sub, "members.user": query._id}, (err, found_party) => {
              if (err) return res.status(200).send({query_success: false, message: "party_error"});
              if (!found_party) return res.status(200).send({query_success: false, message: "party_not_member"});
              Party.findOneAndUpdate({_id: found_party._id}, {$pull: {members: {user: query._id}}}, {new: true}, (err, updated_party) => {
                if (err || !updated_party) return res.status(200).send({query_success: false, message: "party_error"});
                return res.status(200).send({query_success: true, placeholders: query});
              });
            });
          } else {
            Party.findOne({"members.user": req.user.sub}, (err, joined_party) => {
              if (err) return res.status(200).send({query_success: false, message: "party_error"});
              if (!joined_party) return res.status(200).send({query_success: false, message: "party_not_joined"});
              return res.status(200).send({query_success: false, message: "party_not_leader"});
            });
          }
        });
      } else {
        return res.status(200).send({query_success: false, message: "party_not_found"});
      }
    }).catch((err) => {
      console.log(err);
      return res.status(200).send({query_success: false, message: "party_error"});
    });
  },

  party_list: function(req, res) {
    Party.findOne({$or: [{"members.user": req.user.sub}, {leader: req.user.sub}]}, async (err, party) => {
      if (err) return res.status(200).send({query_success: false, message: "party_error"});
      if (!party) return res.status(200).send({query_success: false, message: "party_not_joined"});
      let members = await Promise.map(party.members, async (member) => {
        return await User.findOne({_id: member}).exec().then(async (user) => {
          return await AF.real_player(user.username_lowercase, req.user.sub, req.params.realm).then((placeholder) => {
            return placeholder;
          }).catch((err) => {
            console.log(err);
          });
        }).catch((err) => {
          console.log(err);
        });
      });
      return res.status(200).send({query_succes: true, members: members});
    });
  },

  party_poll: function(req, res) {

  }

};