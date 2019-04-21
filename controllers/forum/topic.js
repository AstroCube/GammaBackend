"use strict";

const AF = require("@auxiliar_functions");
const Alert = require("@alert");
const Category = require("@category");
const Forum = require("@forum");
const Topic = require("@topic");
const Post = require("@post");
const Pagination = require("@pagination_service");
const User = require("@user");
const moment = require("moment");
const Promise = require("bluebird");

module.exports = {

  topic_create: function(req, res) {
    if (req.body.subject && req.body.content && req.body.forum) {
      let topic = new Topic();
      topic.subject = req.body.subject;
      topic.content = req.body.content;
      topic.forum = req.body.forum;
      topic.created_by = req.user.sub;
      topic.created_at = moment().unix();
      topic.subscribers.push(req.user.sub);
      if(req.body.pinned) { topic.pinned = req.body.pinned; } else { topic.pinned = false; }
      if(req.body.official) { topic.official = req.body.official; } else { topic.official = false; }
      if(req.body.locked) { topic.locked = req.body.locked; } else { topic.locked = false }
      topic.save((err, topic_stored) => {
        if (err) return res.status(500).send({message: "Ha ocurrido un error al crear el tema."});
        let post = new Post();
        post.content = req.body.content;
        post.created_at = moment().unix();
        post.created_by = req.user.sub;
        post.topic = topic_stored._id;
        post.viewed_by.push(req.user.sub);
        post.save((err, post_stored) => {
          if (err || !post_stored) return res.status(500).send({message: "Ha ocurrido un error al crear el tema."});
          return res.status(200).send({
            topic: topic_stored,
            post: post_stored
          });
        });
      });
    } else {
      return res.status(400).send({message: "Ha ocurrido un error al crear el tema."});
    }
  },

  topic_get: function(req, res) {
    let page = 1;
    if (req.query.page) page = req.query.page;
    Topic.findOne({_id: req.params.id}, async (err, topic) => {

      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener el tema"});
      if (!topic) return res.status(404).send({message: "No se ha encontrado el tema."});

      let topic_info = {
        id: topic._id,
        watcher: req.user.sub,
        subject: topic.subject,
        pinned: topic.pinned,
        locked: topic.locked,
        official: topic.official,
        forum: topic.forum,
        created_at: topic.created_at,
        own: topic.created_by.toString() === req.user.sub.toString(),
        subscribed: await Topic.findOne({_id: req.params.id, subscribers: req.user.sub}).exec().then((topic) => {
          return topic;
        }).catch((err) => { console.log(err); }),
        page: page,
        total_pages: 1
      };
      if (req.query.onlytopic === "false") {
        let posts_raw = await Post.find({topic: topic._id}).sort("created_at").exec().then(async (posts) => {
          return await Promise.map(posts, async (post) => {

            await Post.findOne({_id: post._id, viewed_by: req.user.sub}).exec().then(async (tagged) => {
              if (!tagged) {
                await Post.findOneAndUpdate({_id: post._id}, {$push: {viewed_by: req.user.sub}}).exec().then().catch((err) => {
                  console.log(err);
                });
              }
            }).catch((err) => {
              console.log(err);
            });

            let fixed_post =  {};
            fixed_post.writer = await AF.user_placeholder(post.created_by).then((placeholder) => {
              return placeholder;
            }).catch((err) => {
              console.log(err);
            });
            if (post.last_update && post.last_updater) {
              fixed_post.last_update = post.last_update;
              fixed_post.last_updater = await AF.user_placeholder(post.last_updater).then((placeholder) => {
                return placeholder;
              }).catch((err) => {
                console.log(err);
              });
            }
            fixed_post.content = post.content;
            fixed_post.created_at = post.created_at;
            fixed_post.id = post._id;
            if (post.quote) fixed_post.quote = await Post.findOne({_id: post.quote}).exec().then(async (quoted_post) => {
              if (quoted_post) {
                let fixed_quoted =  {};
                fixed_quoted.writer = await AF.user_placeholder(quoted_post.created_by).then((placeholder) => {
                  return placeholder;
                }).catch((err) => {
                  console.log(err);
                });
                fixed_quoted.content = quoted_post.content;
                fixed_quoted.created_at = quoted_post.created_at;
                fixed_quoted.likes = quoted_post.liked_by.length;
                return fixed_quoted;
              } else {
                return false;
              }
            }).catch((err) => {
              console.log(err);
            });
            fixed_post.likes = post.liked_by.length;
            return fixed_post;
          });
        }).catch((err) => {
          console.log(err);
        });

        let posts = await Pagination.paginate(posts_raw, 10, page).then((posts) => {
          return posts;
        }).catch((err) => {
          console.log(err);
        });

        topic_info.total_pages = Math.ceil(posts_raw.length/10);

        return res.status(200).send({
          topic_info: topic_info,
          posts: posts
        });
      } else {
        let final_post = await Post.find({topic: topic._id}).sort("created_at").exec().then(async (posts) => {
          let post = posts[0];
          let fixed_post =  {};
          fixed_post.writer = await AF.user_placeholder(post.created_by).then((placeholder) => {
            return placeholder;
          }).catch((err) => {
            console.log(err);
          });
          if (post.last_update && post.last_updater) {
            fixed_post.last_update = post.last_update;
            fixed_post.last_updater = await AF.user_placeholder(post.last_updater).then((placeholder) => {
              return placeholder;
            }).catch((err) => {
              console.log(err);
            });
          }
          fixed_post.content = post.content;
          fixed_post.created_at = post.created_at;
          fixed_post.id = post._id;
          if (post.quote) fixed_post.quote = await Post.findOne({_id: post.quote}).exec().then(async (quoted_post) => {
            if (quoted_post) {
              let fixed_quoted =  {};
              fixed_quoted.writer = await AF.user_placeholder(quoted_post.created_by).then((placeholder) => {
                return placeholder;
              }).catch((err) => {
                console.log(err);
              });
              fixed_quoted.content = quoted_post.content;
              fixed_quoted.created_at = quoted_post.created_at;
              fixed_quoted.likes = quoted_post.liked_by.length;
              return fixed_quoted;
            } else {
              return false;
            }
          });
          return fixed_post;
        }).catch((err) => {
          console.log(err);
        });
        return res.status(200).send({topic_info: topic_info, posts: final_post});
      }
    });
  },

  post_get: function(req, res) {
    Post.findOne({_id: req.params.id}, async (err, post) => {
      if (err || !post) return res.status(500).send({message: "Ha ocurrido un error al obtener el mensaje."});

      let fixed_post =  {};
      fixed_post.writer = await AF.user_placeholder(post.created_by).then((placeholder) => {
        return placeholder;
      }).catch((err) => {
        console.log(err);
      });
      if (post.last_update && post.last_updater) {
        fixed_post.last_update = post.last_update;
        fixed_post.last_updater = await AF.user_placeholder(post.last_updater).then((placeholder) => {
          return placeholder;
        }).catch((err) => {
          console.log(err);
        });
      }
      fixed_post.content = post.content;
      fixed_post.created_at = post.created_at;
      fixed_post.topic = post.topic;
      fixed_post.id = post._id;
      if (post.quoted) fixed_post.quoted = post.quoted;
      return res.status(200).send({fixed_post});
    });
  },

  topic_reply: async function(req, res) {
    try {
      if (req.body.content) {
        let post = new Post();
        post.content = req.body.content;
        if (req.body.quote) post.quote = req.body.quote;
        post.created_by = req.user.sub;
        post.created_at = moment().unix();
        post.topic = req.body.topic;
        post.viewed_by.push(req.user.sub);
        post.save(async (err, saved_post) => {
          if (err || !saved_post) return res.status(500).send({message: "Ha ocurrido un error al responder este tema."});
          User.findOne({_id: req.user.sub}, async (err, poster) => {
            if (err || !poster) return res.status(500).send({message: "Ha ocurrido un error al responder este tema."});
            if (poster.subscribe_topics) {
              await Topic.findOne({_id: req.body.topic, subscribers: req.user.sub}).exec().then((topic_tagged) => {
                if (!topic_tagged) {
                  Topic.findOneAndUpdate({_id: req.body.topic}, {$push: {subscribers: req.user.sub}}).exec().then(() => {
                    return true;
                  }).catch((err) => {
                    console.log(err);
                  });
                }
              }).catch((err) => {
                console.log(err);
              });
            }
            if (req.body.quote) {
              let alert = new Alert();
              alert.user = await Post.findOne({_id: req.body.quote}).exec().then((quoted) => {
                return quoted.created_by;
              }).catch((err) => {
                console.log(err);
              });
              User.findOne({_id: alert.user}, (err, user) => {
                if (err || !user) return res.status(500).send({message: "Ha ocurrido un error al responder este tema."});
                if (user.alert_quoted && user._id.toString() !== req.user.sub.toString()) {
                  alert.type = "forum_quote";
                  alert.related = req.body.topic;
                  alert.second_user = req.user.sub;
                  alert.created_at = moment().unix();
                  alert.save((err, alerted) => {
                    if (err || !alerted) return res.status(500).send({message: "Ha ocurrido un error al actualizar la subscripción del tema."});
                    return res.status(200).send({saved: true});
                  });
                } else {
                  return res.status(200).send({saved: true});
                }
              });
            } else {
              return res.status(200).send({saved: true});
            }
          });
        });
      } else {
        return res.status(200).send({message: "No se ha enviado ningún contenido para responder al tema."});
      }
    } catch(err) {
      console.log(err);
      return res.status(500).send({message: "Ha ocurrido un error al responder el foro."});
    }
  },

  topic_delete: function(req, res) {
    Post.find({topic: req.params.id}, async (err, posts) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al eliminar el tema."});

      await Promise.map(posts, (post) => {
        Post.findOneAndDelete({_id: post._id}, (err) => {
          if (err) console.log(err);
        });
      });

      Topic.findOneAndDelete({_id: req.params.id}, (err) => {
        if (err) return res.status(500).send({message: "Ha ocurrido un error al eliminar el tema."});
        return res.status(200).send({deleted: true});
      });
    });
  },

  post_like: function(req, res) {
    Post.findOne({_id: req.params.id, liked_by: req.user.sub}, (err, post) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error actualizar el mensaje."});
      if(!post) {
        Post.findOneAndUpdate({_id: req.params.id}, {$push: {liked_by: req.user.sub}}, (err, updated) => {
          if (err || !updated) return res.status(500).send({message: "Ha ocurrido un  error actualizar el mensaje."});
          return res.status(200).send({liked: true});
        });
      } else {
        Post.findOneAndUpdate({_id: req.params.id}, {$pull: {liked_by: req.user.sub}}, (err, updated) => {
          if (err || !updated) return res.status(500).send({message: "Ha ocurrido un error actualizar el mensaje."});
          return res.status(200).send({liked: false});
        });
      }
    });
  },

  topic_subscribe: function(req, res) {
    Topic.findOne({_id: req.params.id, subscribers: req.user.sub}, (err, topic) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al actualizar la subscripción del tema."});
      if(!topic) {
        Topic.findOneAndUpdate({_id: req.params.id}, {$push: {subscribers: req.user.sub}}, (err, updated) => {
          if (err || !updated) return res.status(500).send({message: "Ha ocurrido un error al actualizar la subscripción del tema."});
          let alert = new Alert();
          alert.type = "forum_subscribed";
          alert.user = req.user.sub;
          alert.related = req.params.id;
          alert.created_at = moment().unix();
          alert.save((err, alerted) => {
            if (err || !alerted) return res.status(500).send({message: "Ha ocurrido un error al actualizar la subscripción del tema."});
            return res.status(200).send({subscribed: true});
          });
        });
      } else {
        Topic.findOneAndUpdate({_id: req.params.id}, {$pull: {subscribers: req.user.sub}}, (err, updated) => {
          if (err || !updated) return res.status(500).send({message: "Ha ocurrido un error al actualizar la subscripción del tema."});
          return res.status(200).send({subscribed: false});
        });
      }
    });
  },

  topic_lock: function(req, res) {
    Topic.findOne({_id: req.params.id}, (err, topic) => {
      if (err || !topic) return res.status(500).send({message: "Ha ocurrido un error al actualizar el bloqueo del tema."});
      topic.locked = !topic.locked;
      topic.save((err, updated_topic) => {
        if (err || !updated_topic) return res.status(500).send({message: "Ha ocurrido un error al actualizar el bloqueo el tema."});
        return res.status(200).send({locked: updated_topic.locked});
      });
    });
  },

  topic_pin: function(req, res) {
    Topic.findOne({_id: req.params.id}, (err, topic) => {
      if (err || !topic) return res.status(500).send({message: "Ha ocurrido un error al actualizar el anclaje del tema."});
      topic.pinned = !topic.pinned;
      topic.save((err, updated_topic) => {
        if (err || !updated_topic) return res.status(500).send({message: "Ha ocurrido un error al actualizar el anclaje el tema."});
        return res.status(200).send({pinned: updated_topic.pinned});
      });
    });
  },

  topic_official: function(req, res) {
    Topic.findOne({_id: req.params.id}, (err, topic) => {
      if (err || !topic) return res.status(500).send({message: "Ha ocurrido un error al actualizar el tema."});
      topic.official = !topic.official;
      topic.save((err, updated_topic) => {
        if (err || !updated_topic) return res.status(500).send({message: "Ha ocurrido un error al actualizar el tema."});
        return res.status(200).send({official: updated_topic.official});
      });
    });
  },

  post_delete: function(req, res) {
    Post.find({quote: req.params.id}, async (err, posts) => {
      await Promise.map(posts, (post) => {
        Post.findOneAndDelete({_id: post._id}, (err) => {
          if (err) console.log(err);
        });
      });

      Post.findOneAndDelete({_id: req.params.id}, (err) => {
        if (err) return res.status(500).send({message: "Ha ocurrido un error al eliminar el mensaje."});
        return res.status(200).send({deleted: true});
      });
    });
  },

  post_update: function(req, res) {
    Post.findOneAndUpdate({_id: req.params.id}, {content: req.body.content, last_update: moment().unix(), last_updater: req.user.sub}, (err, post) => {
      if (err || !post) return res.status(500).send({message: "Ha ocurrido un error al actualizar el mensaje."});
      if (req.body.subject) {
        Topic.findOneAndUpdate({_id: post.topic}, {subject: req.body.subject}, (err, post) => {
          if (err || !post) return res.status(500).send({message: "Ha ocurrido un error al actualizar el tema."});
          return res.status(200).send({updated: true});
        });
      } else {
        return res.status(200).send({updated: true});
      }
    });
  }
};