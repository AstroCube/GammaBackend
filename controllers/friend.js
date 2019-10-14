"use strict";

const AF = require("@auxiliar_functions");
const Friend = require("@friend");
const Promise = require("bluebird");
const User = require("@user");
const Pagination = require("@pagination_service");

module.exports = {

  createFriendship: function(req, res) {
    let params = req.body;
    if (params.sender && params.receiver) {
      let friend = new Friend();
      friend.sender = params.sender;
      friend.receiver = params.receiver;
      friend.save((err, savedFriendship) => {
        if (err || !savedFriendship) return res.status(500).send({message: "Ha ocurrido un error al crear la sanción."});
        return res.status(200).send({created: true});
      });
    } else {
      return res.status(400).send({message: "No se ha enviado correctamente la petición."});
    }
  },

  checkFriendship: function(req, res) {
    if (req.query.sender && req.query.receiver) {
      Friend.findOne({$or: [
          {sender: req.query.sender, receiver: req.query.receiver},
          {sender: req.query.receiver, receiver: req.query.sender}]
      }, (err, status) => {
        if (err) return res.status(500).send({message: "Ha ocurrido un error al detectar la amistad."});
        let finalStatus = false;
        if (status) finalStatus = true;
        return res.status(200).send({status: finalStatus});
      });
    } else {
      return res.status(400).send({message: "No se han enviado los parámetros correctamente."});
    }
  },

  removeFriendship: function(req, res) {
    if (req.query.sender && req.query.receiver) {
      Friend.findOneAndDelete({$or: [
          {sender: req.query.sender, receiver: req.query.receiver},
          {sender: req.query.receiver, receiver: req.query.sender}]
      }, (err) => {
        if (err) return res.status(500).send({message: "Ha ocurrido un error al detectar la amistad."});
        return res.status(200).send({removed: true});
      });
    } else {
      return res.status(400).send({message: "No se han enviado los parámetros correctamente."});
    }
  },

  listFriends: function(req, res) {
    Friend.find({$or: [{sender: req.params.id}, {receiver: req.params.id}]}, (err, friendList) => {
       if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener la lista de amigos."});
       return res.status(200).send(friendList);
    });
  },

  listFriendsWebsite: function(req, res) {
    Friend.find({$or: [{sender: req.params.id}, {receiver: req.params.id}]}).populate("sender receiver").lean().exec((err, friendList) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener la lista de amigos."});

      // This will store all the friends of the user
      let queriedFriends = [];

      friendList = friendList.map((friendship) => {
        if (friendship.sender._id.toString() === req.params.id) {
          queriedFriends.push(friendship.receiver._id.toString());
          return {
            username: friendship.receiver.username,
            skin: friendship.receiver.skin
          };
        } else {
          queriedFriends.push(friendship.sender._id.toString());
          return {
            username: friendship.sender.username,
            skin: friendship.sender.skin
          };
        }
      });

      // Will get friends in common by a query
      Friend.find(
          {
            $or:
                [
                    {sender: {$in: queriedFriends}, receiver: req.user.sub},
                    {sender: req.user.sub, receiver: {$in: queriedFriends}}
                ]
          },
          (err, commonFriends) => {
            if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener la lista de amigos."});
            return res.status(200).send({
              friends: friendList.slice(0, 30),
              commons: commonFriends.length
            });
          });
    });
  },

  clearFriends: function(req, res) {
    Friend.find({$or: [{sender: req.params.id}, {receiver: req.params.id}]}, async (err, friendList) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener la lista de amigos."});
      await Promise.map(friendList, (friend) => {
        Friend.findOneAndDelete({_id: friend._id}, () => {});
      });
      return res.status(200).send({deleted: true});
    });
  }

};
