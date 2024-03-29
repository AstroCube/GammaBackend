"use strict";
const { URLSearchParams } = require('url');
const fetch = require("node-fetch");
const Friend = require("@friend");
const fs = require("fs");
const Forum = require("@forum");
const Group = require("@group");
const jwt = require('jwt-simple');
const moment = require("moment");
const Punishment = require("@punishment");
const Promise = require("bluebird");
const Stats = require("@stats");
const Topic = require("@topic");
const User = require("@user");

function fixId(object) {
  let ob = object.toObject();
  ob.id = object._id;
  delete ob._id;
  return ob;
}

async function local_permission(user, permission) {
  try {
    let user_groups = await user_groups_id(user).then(async (groups) => {
      return await Promise.map(groups, (ids) => {
        return ids.group._id;
      });
    }).catch((err) => {
      console.log(err);
    });
    return await Group.find({"_id": {$in: user_groups}, [permission]: true}).then((groups) => {
      return groups.length > 0;
    }).catch((err) => {
      console.log(err);
    });
  } catch(err) {
    console.log(err);
  }
}

async function file_unlink(path) {
  if(!path) return; fs.unlink(path, () => {});
}

async function dynamic_permission(user, permission, text) {
  try {
    let user_groups = await user_groups_id(user).then(async (groups) => {
      return await Promise.map(groups, (ids) => {
        return ids.group._id;
      });
    }).catch((err) => {
      console.log(err);
    });
    return await Group.find({"_id": {$in: user_groups}, [permission]: text}).then((groups) => {
      return groups.length > 0;
    }).catch((err) => {
      console.log(err);
    });
  } catch(err) {
    console.log(err);
  }
}

async function user_placeholder(user_id) {
  try {
    return await user_groups_id(user_id).then(async (userGroups) => {
      let groupBadges = await Promise.map(userGroups.groups, async (groups) => {
        return await groups.group;
      });
      groupBadges.sort((a, b) => parseFloat(a.priority) - parseFloat(b.priority));
      let username = await User.findOne({"_id": user_id}).exec().then((username) => {
        return username;
      }).catch((err) => {
        console.log(err);
      });
      return {
        id: username._id,
        username: username.display,
        user_color: groupBadges[0].html_color,
        last_seen: username.session.lastSeen,
        skin: username.skin,
        badges: groupBadges
      }
    }).catch((err) => {
      console.log(err);
    });
  } catch(err) {
    console.log(err);
  }
}

async function user_punishments(id) {
  try {
    return await Punishment.find({punished: id}).select("_id").exec().then(async (punishments_id) => {
      let punishments = await Promise.map((punishments_id), async (punishments_map) => {
        return await Punishment.findOne({"_id": punishments_map}).exec().then(async (punishment) => {
          let punished_placeholder = await user_placeholder(punishment.punished).then((placeholder) => { return placeholder; }).catch((err) => console.log(err));
          let punisher_placeholder = await user_placeholder(punishment.punisher).then((placeholder) => { return placeholder; }).catch((err) => console.log(err));
          delete punishment.punished;
          delete punishment.punisher;
          delete punishment.last_ip;
          delete punishment.server;
          delete punishment.match;
          delete punishment.evidence;
          return {
            punished_placeholder: punished_placeholder,
            punisher_placeholder: punisher_placeholder,
            punishment_details: punishment
          }
        }).catch((err) => {
          console.log(err);
        });
      });
      punishments.sort((a, b) => parseFloat(a.punishment_details.created_at) - parseFloat(b.punishment_details.created_at));
      return punishments;
    }).catch((err) => {
      console.log(err);
    });
  } catch(err) {
    console.log(err);
  }
}

async function punishment_placeholder(id) {
  try {
    return await Punishment.findOne({"_id": id}).exec().then(async (punishment) => {
      let punished_placeholder = await user_placeholder(punishment.punished).then((placeholder) => { return placeholder; }).catch((err) => console.log(err));
      let punisher_placeholder = await user_placeholder(punishment.punisher).then((placeholder) => { return placeholder; }).catch((err) => console.log(err));
      delete punishment.punished;
      delete punishment.punisher;
      delete punishment.last_ip;
      delete punishment.server;
      delete punishment.match;
      delete punishment.evidence;
      return {
        punished_placeholder: punished_placeholder,
        punisher_placeholder: punisher_placeholder,
        punishment_details: punishment
      }
    }).catch((err) => {
      console.log(err);
    });
  } catch(err) {
    console.log(err);
  }
}

async function group_badge(group) {
  try {
    return await Group.find({"_id": group}).select("_id name priority html_color badge_link");
  } catch(err) {
    console.log(err);
  }
}

async function inside_group(group) {
  try {
    const groupData = await Group.find({"_id": group}).select("_id name priority html_color");
    const playersInside = await User.find({"group._id": group}).select("_id group._id group.role_comment username");
    return {
      group: groupData,
      members: playersInside
    }
  } catch(err) {
    console.log(err);
  }
}

async function server_placeholder(realm, id) {
  try {
    return await Group.findOne({"_id": id}).select({
      "name": 1,
      "priority": 1,
      "minecraft_flair": 1
    }).exec().then(async (group) => {
      let flair = await group.minecraft_flair.filter(flair => {
        return flair.realm === realm
      });

      if (!flair || flair.length <= 0) {
        return {
          name: group.name,
          color: "",
          symbol: "",
          priority: group.priority
        }
      } else {
        return {
          name: group.name,
          color: flair[0].color,
          symbol: flair[0].symbol,
          priority: group.priority
        }
      }
    }).catch((err) => {
      console.log(err);
    });
  } catch (err) {
    console.log(err);
  }
}

async function real_player(name, requester, realm) {
  try {
    let sender = {};

    if (requester) {
      sender = await User.findOne({_id: requester}).exec().then(async (own_user) => {
        let own_groups = await user_groups_id(own_user._id).then(async (userGroups) => {
          return await Promise.map(userGroups.groups, async (groups) => {
            return await server_placeholder(realm.toLowerCase(), groups.group._id).then((group) => {
              return group;
            }).catch((err) => { console.log(err); });
          });
        });

        let disguise_placeholder_own;
        if (own_user.disguise_group) {
          disguise_placeholder_own = await server_placeholder(realm.toLowerCase(), own_user.disguise_group).then((group) => {
            return group;
          }).catch((err) => { console.log(err); });
        }

        own_groups.sort((a, b) => parseFloat(a.priority) - parseFloat(b.priority));

        return {
          _id: own_user._id,
          real_name: own_user.display,
          last_seen: own_user.session.lastSeen,
          disguised_name: own_user.disguise_actual,
          real_group: own_groups[0],
          disguise_group: disguise_placeholder_own
        }
      });
    }

    return await User.findOne({disguise_lowercase: name.toLowerCase()}).then(async (disguised_user) => {
      if (!disguised_user) {

        return await User.findOne({username: name.toLowerCase()}).then(async (real_user) => {
          if (!real_user) return ({found: false});

          let real_groups = await user_groups_id(real_user._id).then(async (userGroups) => {
            return await Promise.map(userGroups.groups, async (groups) => {
              return await server_placeholder(realm.toLowerCase(), groups.group._id).then((group) => {
                return group;
              }).catch((err) => { console.log(err); });
            });
          });
          real_groups.sort((a, b) => parseFloat(a.priority) - parseFloat(b.priority));

          let friends = await Friend.findOne({username: requester, accepted: real_user._id.toString()}).then((friend) => {
            return (friend !== null && friend !== undefined);
          }).catch((err) => {
            console.log(err);
          });

          return {
            found: true,
            _id: real_user._id,
            sender: sender,
            disguised: false,
            friends: friends,
            last_seen: real_user.session.lastSeen,
            real_name: real_user.display,
            real_group: real_groups[0]
          }
        });

      } else {

        let target_groups = await user_groups_id(disguised_user._id).then(async (userGroups) => {
          return await Promise.map(userGroups.groups, async (groups) => {
            return await server_placeholder(realm.toLowerCase(), groups.group._id).then((group) => {
              return group;
            }).catch((err) => { console.log(err); });
          });
        });

        let disguise_placeholder_target;
        if (disguised_user.disguise_group) {
          disguise_placeholder_target = await server_placeholder(realm.toLowerCase(), disguised_user.disguise_group).then((group) => {
            return group;
          }).catch((err) => { console.log(err); });
        }

        target_groups.sort((a, b) => parseFloat(a.priority) - parseFloat(b.priority));

        let friends = await Friend.findOne({username: requester, accepted: disguised_user._id.toString()}).then((friend) => {
          return (friend !== null && friend !== undefined);
        }).catch((err) => {
          console.log(err);
        });

        return {
          found: true,
          _id: disguised_user._id,
          disguised: true,
          sender: sender,
          friends: friends,
          real_name: disguised_user.display,
          last_seen: disguised_user.session.lastSeen,
          disguised_name: disguised_user.disguise_actual,
          real_group: target_groups[0],
          disguise_group: disguise_placeholder_target
        }
      }
    });
  } catch (err) {
    console.log(err);
  }
}

async function user_groups_id(user) {
  try {
    return await User.findOne({_id: user}).select({groups: 1, _id: 0});
  } catch(err) {
    console.log(err);
  }
}

// --- Arithmetic function: (2500)((x-2)^2+(x-2)/2)+10000(x-1) --- //

function arithmetic_max_xp(level) {
  return 2500 * ((Math.pow((level-2), 2) + (level-2)) / 2) + (10000 * (level-1));
}

function arithmetic_remaining_xp(level, user_xp) {
  return arithmetic_max_xp(level) - user_xp;
}

function stats_create(id) {
  let stats_document = new Stats();
  stats_document.username = id;
  stats_document.cosmetics = [];
  stats_document.save(() => {});
}

async function viewable_forums(username) {
  let viewable = [];
  let user;
  if (username === "none") {
    user = process.env.GUEST_USER;
  } else {
    let token = username.toString().replace(/['"]+/g, '');
    user = jwt.decode(token, process.env.TOKENIZATION_SECRET).sub;
  }

  await Forum.find().select("_id").exec().then(async (forums) => {
    await Promise.map(forums, async (forum) => {
      await local_permission(user, "web_permissions.forum.manage").then( async (global) => {
        if (global) {
          viewable.push(forum._id).toString();
        } else {
          await local_permission(user, "web_permissions.forum." + forum._id + ".manage").then(async (local) => {
            if (local) {
              viewable.push(forum._id).toString();
            } else {
              await dynamic_permission(user, "web_permissions.forum." + forum._id + ".view", "all").then((permission) => {
                if (permission) viewable.push(forum._id).toString();
              }).catch((err) => {
                console.log(err);
              });
            }
          }).catch((err) => {
            console.log(err);
          });
        }
      }).catch((err) => {
        console.log(err);
      });
    });
  }).catch((err) => {
    console.log(err);
  });
  return viewable;
}

async function get_feed(username) {

  let viewable = await viewable_forums(username).then((viewable) => {
    return viewable;
  }).catch((err) => {
    console.log(err);
  });

  return await Topic.find({forum: {$in: viewable}}).sort("created_at").exec().then(async (topics) => {
    let raw_topics = topics.reverse().slice(0, 10);
    return await Promise.map(raw_topics, async (topic) => {
      return {
        id: topic._id,
        subject: topic.subject,
        created_at: topic.created_at,
        writer: await user_placeholder(topic.created_by).then((placeholder) => {
          return placeholder;
        }).catch((err) => {
          console.log(err);
        })
      }
    });
  });
}

module.exports = {
  fixId,
  local_permission,
  get_feed,
  punishment_placeholder,
  arithmetic_max_xp,
  file_unlink,
  dynamic_permission,
  inside_group,
  stats_create,
  user_groups_id,
  server_placeholder,
  group_badge,
  user_placeholder,
  viewable_forums,
  user_punishments,
  real_player
};
