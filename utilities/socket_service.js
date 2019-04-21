"use strict";

const AF = require("@auxiliar_functions");
const app = require("express")();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const Topic = require("@topic");

io.on("connection", socket => {

  socket.on("feed_join", async (watcher) => {
    let topics = await AF.get_feed(watcher).then((topics) => {
      return topics;
    }).catch((err) => {
      console.log(err);
    });
    let viewable = await AF.viewable_forums(watcher).then((viewable) => {
      return viewable;
    }).catch((err) => {
      console.log(err);
    });

    socket.emit("feed_topics", {topics: topics, viewable: viewable});
  });

  socket.on("new_topic", async (data) => {

    let topic = await Topic.findOne({_id: data.id}).exec().then(async (topic) => {
      return {
        id: topic._id,
        subject: topic.subject,
        forum: topic.forum,
        created_at: topic.created_at,
        writer: await AF.user_placeholder(topic.created_by).then((placeholder) => {
        return placeholder;
      }).catch((err) => {
        console.log(err);
      })
    }
    }).catch((err) => {
      console.log(err);
    });

    io.emit("receive_topic", topic);
  });
});

exports.socket_listen = function() {
  http.listen(7533);
};
