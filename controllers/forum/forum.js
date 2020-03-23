"use strict";

const AF = require("@auxiliar_functions");
const Category = require("@category");
const Forum = require("@forum");
const Topic = require("@topic");
const Pagination = require("@pagination_service");
const Post = require("@post");
const Promise = require("bluebird");

module.exports = {

  forum_create: function(req, res) {
    if (req.body.name && req.body.order && req.body.category) {
      let forum = new Forum();
      forum.name = req.body.name;
      forum.order = req.body.order;
      forum.description = req.body.description;
      forum.category = req.body.category;
      if (req.body.parent) forum.parent = req.body.parent;
      forum.save((err, created_forum) => {
        if (err || !created_forum) return res.status(500).send({message: "Ha ocurrido un error al crear la categoría."});
        return res.status(200).send({created: true});
      });
    } else {
      return res.status(403).send({message: "No se han enviado los datos de creación de foro correctamente."});
    }
  },

  forum_pre_fetch: function(req, res) {
    try {
      Forum.findOne({_id: req.params.id}, async (err, forum) => {
        if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener los datos para el foro."});
        if (!forum) return res.status(404).send({not_found: true});
        let pre_fetch =  {
          breadcrumb: {
            category: await Category.findOne({_id: forum.category}).exec().then((category) => {
              return category.name;
            }).catch((err) => {
              console.log(err);
            }),
            parent: await Forum.findOne({_id: forum.parent}).exec().then((forum) => {
              if (forum && forum.name) return {_id: forum._id, name: forum.name};
            }).catch((err) => {
              console.log(err);
            }),
            actual: {_id: forum._id, name: forum.name, description: forum.description}
          },
          permissions: {
            create: false,
            view: "none",
            edit: "none",
            comment: "none",
            official: false,
            delete: "none",
            pin: false,
            lock: false
          }
        };

        // --- Create permission check --- //

        await AF.local_permission(req.user.sub, "web_permissions.forum." + req.params.id + ".create").then((permission) => {
          if (permission) pre_fetch.permissions.create = true;
        }).catch((err) => {
          console.log(err);
        });

        // --- View permission check --- //

        await AF.dynamic_permission(req.user.sub, "web_permissions.forum." + req.params.id + ".view", "all").then((permission) => {
          if (permission) pre_fetch.permissions.view = "all";
        }).catch((err) => {
          console.log(err);
        });

        await AF.dynamic_permission(req.user.sub, "web_permissions.forum." + req.params.id + ".view", "own").then((permission) => {
          if (permission) pre_fetch.permissions.view = "own";
        }).catch((err) => {
          console.log(err);
        });

        // --- Edit permission check --- //

        await AF.dynamic_permission(req.user.sub, "web_permissions.forum." + req.params.id + ".edit", "all").then((permission) => {
          if (permission) pre_fetch.permissions.edit = "all";
        }).catch((err) => {
          console.log(err);
        });

        await AF.dynamic_permission(req.user.sub, "web_permissions.forum." + req.params.id + ".edit", "own").then((permission) => {
          if (permission) pre_fetch.permissions.edit = "own";
        }).catch((err) => {
          console.log(err);
        });

        // --- Comment permission check --- //

        await AF.dynamic_permission(req.user.sub, "web_permissions.forum." + req.params.id + ".comment", "all").then((permission) => {
          if (permission) pre_fetch.permissions.comment = "all";
        }).catch((err) => {
          console.log(err);
        });

        await AF.dynamic_permission(req.user.sub, "web_permissions.forum." + req.params.id + ".comment", "own").then((permission) => {
          if (permission) pre_fetch.permissions.comment = "own";
        }).catch((err) => {
          console.log(err);
        });


        // --- Delete permission check --- //

        await AF.dynamic_permission(req.user.sub, "web_permissions.forum." + req.params.id + ".delete", "all").then((permission) => {
          if (permission) pre_fetch.permissions.delete = "all";
        }).catch((err) => {
          console.log(err);
        });

        await AF.dynamic_permission(req.user.sub, "web_permissions.forum." + req.params.id + ".delete", "own").then((permission) => {
          if (permission) pre_fetch.permissions.delete = "own";
        }).catch((err) => {
          console.log(err);
        });

        // --- Pin permission check --- //

        await AF.local_permission(req.user.sub, "web_permissions.forum." + req.params.id + ".pin").then((permission) => {
          if (permission) pre_fetch.permissions.pin = true;
        }).catch((err) => {
          console.log(err);
        });

        // --- Pin permission check --- //

        await AF.local_permission(req.user.sub, "web_permissions.forum." + req.params.id + ".lock").then((permission) => {
          if (permission) pre_fetch.permissions.lock = true;
        }).catch((err) => {
          console.log(err);
        });

        // --- Global manage permission check --- //

        await AF.local_permission(req.user.sub, "web_permissions.forum.manage").then((permission) => {
          if (permission) {
            pre_fetch.permissions.create = true;
            pre_fetch.permissions.view = "all";
            pre_fetch.permissions.edit = "all";
            pre_fetch.permissions.comment = "all";
            pre_fetch.permissions.delete = "all";
            pre_fetch.permissions.pin = true;
            pre_fetch.permissions.lock = true;
          }
        }).catch((err) => {
          console.log(err);
        });

        // --- Manage permission check --- //

        await AF.local_permission(req.user.sub, "web_permissions.forum." + req.params.id + ".manage").then((permission) => {
          if (permission) {
            pre_fetch.permissions.create = true;
            pre_fetch.permissions.view = "all";
            pre_fetch.permissions.edit = "all";
            pre_fetch.permissions.comment = "all";
            pre_fetch.permissions.delete = "all";
            pre_fetch.permissions.pin = true;
            pre_fetch.permissions.lock = true;
          }
        }).catch((err) => {
          console.log(err);
        });

        // --- Officialize permission check --- //

        await AF.local_permission(req.user.sub, "web_permissions.forum.official").then((permission) => {
          if (permission) pre_fetch.permissions.official = true;
        }).catch((err) => {
          console.log(err);
        });

        return res.status(200).send({pre_fetch});
      });
    } catch(err) {
      console.log(err);
      return res.status(500).send({message: "Ha ocurrido un error al obtener los datos para el foro."});
    }
  },

  forum_tree: function(req, res) {
    try {
      Forum.find(async (err, forums) => {
        if (forums && forums.length > 0) {
            if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener el arbol de foros."});
            let forum_tree = await Promise.map(forums, async (forum) => {
                let category = await Category.findOne({_id: forum.category}).exec().then((category) => {
                    return category;
                }).catch((err) =>  {
                    console.log(err);
                });
                let fixed_forum = {
                    _id: forum._id,
                    name: forum.name,
                    category: category.name,
                    category_id: forum.category
                };
                return fixed_forum;
            });
            return res.status(200).send({forum_tree: forum_tree, only_categories: false});
        } else {
          Category.find((err, categories) => {
              if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener el arbol de foros."});
              return res.status(200).send({forum_tree: categories, only_categories: true});
          });
        }
      });
    } catch(err) {
      return res.status(500).send({message: "Ha ocurrido un error al obtener el arbol de foros."});
    }
  },

  forum_admin_list: function(req, res) {
    try {
      Category.find().sort("order").exec(async (err, categories) => {
        if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener la lista de categorías"});
        let forum_list = await Promise.map(categories, async (category) => {
          let category_fixed = {};
          category_fixed.category = category;
          category_fixed.forums = await Forum.find({category: category._id}).sort("order").exec().then(async (forums) => {
            return await Promise.map(forums, async (forum) => {
              let new_forum = {};
              if (forum.parent) new_forum.parent = await Forum.findOne({_id: forum.parent}).exec().then((node) => {
                return node.name;
              }).catch((err) => {
                console.log(err);
              });
              new_forum._id = forum._id;
              new_forum.name = forum.name;
              new_forum.order = forum.order;
              if (forum.description) new_forum.description = forum.description;
              new_forum.category = forum.category;
              return new_forum;
            });
          }).catch((err) => {
            console.log(err);
          });
          return category_fixed;
        });
        return res.status(200).send({forum_list});
      });
    } catch(err) {
      console.log(err);
      return res.status(500).send({message: "Ha ocurrido un error al obtener la lista de categorías"});
    }
  },

  forum_admin_get: function(req, res) {
    Forum.findOne({_id: req.params.id}, (err, forum) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener el foro."});
      return res.status(200).send({forum});
    });
  },

  forum_update: function(req, res) {
    Forum.findOneAndUpdate({"_id": req.params.id}, req.body, {new: true}, (err, forum_stored) => {
      if(err || !forum_stored) return res.status(500).send({message: "Ha ocurrido un error al actualizar el foro."});
      return res.status(200).send({forum_stored});
    });
  },

  forum_get: function(req, res) {
    let page = 1;
    if (req.query.page) page = req.query.page;
    Forum.findOne({_id: req.params.id}, async(err, forum) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener el foro."});
      if (!forum) return res.status(404).send({message: "El foro que se ha buscado no existe."});

      // --- Forum info --- //

      let info = {
        id: forum._id,
        name: forum.name,
        observer: req.user.sub,
        description: forum.description
      };

      // --- Forum subforums --- //

      let sub_forums = await Forum.find({parent: forum._id}).exec().then(async (sub_forums) => {
        if (sub_forums) {
          return await Promise.map(sub_forums, async (sub_forum) => {
            let fixed_sub =  {};
            fixed_sub.id = sub_forum._id;
            fixed_sub.name = sub_forum.name;
            fixed_sub.order = sub_forum.order;
            fixed_sub.last_topic = await Topic.find({forum: sub_forum._id}).sort("created_at").exec().then(async (topics) => {
              if (topics && topics.length >= 1) {
                return {
                  id: topics[0]._id,
                  subject: topics[0].subject,
                  created_at: topics[0].created_at,
                  writer: await AF.user_placeholder(topics[0].created_by).then((placeholder) => {
                    return placeholder;
                  }).catch((err) => {
                    console.log(err);
                  })
                };
              }
            }).catch((err) => {
              console.log(err);
            });
            fixed_sub.count = await Topic.find({forum: sub_forum._id}).exec().then(async (count) => {
              return count.length;
            }).catch((err) => {
              console.log(err);
            });
            fixed_sub.new_topics = await Topic.find({forum: sub_forum._id, subscribers: req.user.sub}).exec().then(async (subscribed_topics) => {
              if (subscribed_topics) {
                let map = [];
                await Promise.map(subscribed_topics, async (topic) => {
                  return await Post.find({topic: topic._id, viewed_by: {$ne: req.user.sub}}).exec().then((post) => {
                    if (post && post.length >= 1) map.push(true);
                  }).catch((err) => {
                    console.log(err);
                  });
                });
                return map.length;
              } else {
                return 0;
              }
            }).catch((err) => {
              console.log(err);
            });
            fixed_sub.can_view = await AF.dynamic_permission(req.user.sub, "web_permissions.forum." + sub_forum._id + ".view", "all").then(async (permission) => {
              if (permission) {
                return true;
              } else {
                return await AF.dynamic_permission(req.user.sub, "web_permissions.forum." + sub_forum._id + ".view", "own").then((permission) => {
                  if (permission) return true;
                }).catch((err) => {
                  console.log(err);
                });
              }
            }).catch((err) => {
              console.log(err);
            });
            return fixed_sub;
          });
        }
      }).catch((err) => {
        console.log(err);
      });

      // --- Pinned Topics --- //
      // Note: To hide pin topics at page 2 < wrap this variable inside if (page === 1) {}
      // and uncomment line 446

      let pinned_topics = await Topic.find({forum: forum._id, pinned: true}).exec().then(async (pinned_topics) => {
        if (pinned_topics && pinned_topics.length >= 1) {
          return await Promise.map(pinned_topics, async (topic) => {
            let fixed_topic = {};
            let first_info = await Post.find({topic: topic._id}).sort("created_at").exec().then((first) => {
              return {
                count: first.length,
                views: first[0].viewed_by,
                last_info: first.reverse()[0]
              }
            }).catch((err) => {
              console.log(err);
            });
            fixed_topic.id = topic._id;
            fixed_topic.subject = topic.subject;
            fixed_topic.pinned = topic.pinned;
            fixed_topic.locked = topic.locked;
            fixed_topic.official = topic.official;
            fixed_topic.created_at = topic.created_at;
            fixed_topic.writer = await AF.user_placeholder(topic.created_by).then((placeholder) => {
              return placeholder;
            }).catch((err) => {
              console.log(err);
            });
            fixed_topic.posts = first_info.count;
            fixed_topic.views = first_info.views;
            fixed_topic.last_message = {
              writer: await AF.user_placeholder(first_info.last_info.created_by).then((placeholder) => {
                return placeholder;
              }).catch((err) => {
                console.log(err);
              }),
              created_at: first_info.last_info.created_at
            };
            fixed_topic.unread = await Topic.findOne({
              _id: topic._id,
              subscribers: req.user.sub
            }).exec().then(async (subscribed_topic) => {
              if (subscribed_topic) {
                return await Post.find({topic: topic._id, viewed_by: {$ne: req.user.sub}}).exec().then((post) => {
                  return post.length;
                }).catch((err) => {
                  console.log(err);
                });
              } else {
                return 0;
              }
            });
            return fixed_topic;
          });
        }
      }).catch((err) => {
        console.log(err);
      });

      // --- Normal topics --- //

      let raw_topics = await Topic.find({forum: forum._id, pinned: false}).exec().then(async (topics) => {
        if (topics && topics.length >= 1) {
          return await Promise.map(topics, async (topic) => {
            let fixed_topic = {};
            let first_info = await Post.find({topic: topic._id}).sort("created_at").exec().then((first) => {
              return {
                count: first.length,
                views: first[0].viewed_by,
                last_info: first.reverse()[0]
              }
            }).catch((err) => {
              console.log(err);
            });
            fixed_topic.id = topic._id;
            fixed_topic.observer = req.user.sub;
            fixed_topic.subject = topic.subject;
            fixed_topic.pinned = topic.pinned;
            fixed_topic.locked = topic.locked;
            fixed_topic.created_at = topic.created_at;
            fixed_topic.official = topic.official;
            fixed_topic.writer = await AF.user_placeholder(topic.created_by).then((placeholder) => {
              return placeholder;
            }).catch((err) => {
              console.log(err);
            });
            fixed_topic.posts = first_info.count;
            fixed_topic.views = first_info.views;
            fixed_topic.last_message = {
              writer: await AF.user_placeholder(first_info.last_info.created_by).then((placeholder) => {
                return placeholder;
              }).catch((err) => {
                console.log(err);
              }),
              created_at: first_info.last_info.created_at
            };
            fixed_topic.unread = await Topic.findOne({
              _id: topic._id,
              subscribers: req.user.sub
            }).exec().then(async (subscribed_topic) => {
              if (subscribed_topic) {
                return await Post.find({topic: topic._id, viewed_by: {$ne: req.user.sub}}).exec().then((post) => {
                  return post.length;
                }).catch((err) => {
                  console.log(err);
                });
              } else {
                return 0;
              }
            });
            return fixed_topic;
          });
        }
      }).catch((err) => {
        console.log(err);
      });

      let discount = 15;
      if (/*page === 1 &&*/pinned_topics && pinned_topics.length >= 1) discount = discount - pinned_topics.length;

      let topics;
      if (raw_topics && raw_topics.length >= 1) {
        topics = await Pagination.paginate(raw_topics, discount, page).then((posts) => {
          return posts;
        }).catch((err) => {
          console.log(err);
        });
      }
      let pages = 1;
      if (topics && topics.length >= 1) pages = Math.ceil(topics.length/discount);

      return res.status(200).send({info: info, sub_forums: sub_forums, pinned_topics: pinned_topics, topics: topics, page: page, pages: pages});

    });
  },

  forum_clear: function(req, res) {
    try {
      Forum.findOne({_id: req.params.id}, (err, forum) => {
        if (err || !forum) return res.status(500).send({message: "Ha ocurrido un error al leer todos los mensajes."});
        Topic.find({forum: req.params.id}, async (err, topics) => {
          await Promise.map(topics, async (topic) => {
            await Post.find({topic: topic, viewed_by: {$ne: req.user.sub}}).exec().then(async (posts) => {
              if (posts) {
                await Promise.map(posts, async (post) => {
                  await Post.findOneAndUpdate({_id: post._id}, {$push: {viewed_by: req.user.sub}}).exec().then().catch((err) => {
                    console.log(err);
                  });
                });
              }
            }).catch((err) => {
              console.log(err);
            });
          });
          return res.status(200).send({cleared: true});
        });
      });
    } catch(err) {
      console.log(err);
      return res.status(500).send({message: "Ha ocurrido un error al leer todos los mensajes."});
    }
  },

  forum_main: function(req, res) {
    Category.find().sort("order").exec(async (err, categories) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener las categorías del foro."});
      if (!categories) return res.status(404).send({message: "No hay categorías."});
      let fixed_categories = await Promise.map(categories, async (category) => {
        let fixed_category = {};
        fixed_category.name = category.name;
        fixed_category.order = category.order;
        fixed_category.forums = await Forum.find({category: category._id, parent: {$exists: false}}).exec().then(async (forums) => {
          return await Promise.map(forums, async (forum) => {
            let description; if (forum.description) description = forum.description;
            let can_view = await AF.local_permission(req.user.sub, "web_permissions.forum.manage").then(async (global) => {
              if (global) {
                return true;
              } else {
                return await AF.local_permission(req.user.sub, "web_permissions.forum." + forum._id + ".manage").then(async (local) => {
                  if (local) {
                    return true;
                  } else {
                    return await AF.dynamic_permission(req.user.sub, "web_permissions.forum." + forum._id + ".view", "all").then(async (all) => {
                      if (all) {
                        return true;
                      } else {
                        return await AF.dynamic_permission(req.user.sub, "web_permissions.forum." + forum._id + ".view", "own").then((own) => {
                          console.log(req.user.sub);
                          console.log(own);
                          if (own) return true;
                        }).catch((err) => {
                          console.log(err);
                        });
                      }
                    }).catch((err) => {
                      console.log(err);
                    })
                  }
                }).catch((err) => {
                  console.log(err);
                })
              }
            }).catch((err) => {
              console.log(err);
            });
            if (can_view) {
              return {
                id: forum._id,
                name: forum.name,
                order: forum.order,
                description: description,
                topics: await Topic.find({forum: forum._id}).exec().then(async (count) => {
                  return count.length;
                }).catch((err) => {
                  console.log(err);
                }),
                unread: await Topic.find({forum: forum._id, subscribers: req.user.sub}).exec().then(async (subscribed_topics) => {
                  if (subscribed_topics) {
                    let map = [];
                    await Promise.map(subscribed_topics, async (topic) => {
                      return await Post.find({topic: topic._id, viewed_by: {$ne: req.user.sub}}).exec().then((post) => {
                        if (post && post.length >= 1) map.push(true);
                      }).catch((err) => {
                        console.log(err);
                      });
                    });
                    return map.length;
                  } else {
                    return 0;
                  }
                }).catch((err) => {
                  console.log(err);
                }),
                messages: await Topic.find({forum: forum._id}).exec().then(async (topics) => {
                  if (topics && topics.length >= 1) {
                    let counter = 0;
                    await Promise.map(topics, async (topic) => {
                      return await Post.find({topic: topic._id}).exec().then(async(posts) => {
                        counter = counter + posts.length;
                      }).catch((err) => {
                        console.log(err);
                      });
                    });
                    return counter;
                  } else {
                    return 0;
                  }
                }).catch((err) => {
                  console.log(err);
                }),
                last_topic: await Topic.find({forum: forum._id}).sort("created_at").exec().then(async (topics) => {
                  if (topics && topics.length >= 1) {
                    return {
                      id: topics[0]._id,
                      subject: topics[0].subject,
                      created_at: topics[0].created_at,
                      writer: await AF.user_placeholder(topics[0].created_by).then((placeholder) => {
                        return placeholder;
                      }).catch((err) => {
                        console.log(err);
                      })
                    };
                  }
                }).catch((err) => {
                  console.log(err);
                })
              }
            }
          });
        }).catch((err) => {
          console.log(err);
        });
        return fixed_category;
      });
      return res.status(200).send({categories: fixed_categories.filter((category) => category.forums && category.forums.length >= 1)});
    });
  }

};
