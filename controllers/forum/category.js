"use strict";

const Category = require("@category");
const Forum = require("@forum");
const Promise = require("bluebird");

module.exports = {

  category_create: function (req, res) {
    let params = req.body;
    if (params.name && params.order) {
      let category = new Category();
      category.name = params.name;
      category.order = params.order;
      category.save((err, category_stored) => {
        if (err || !category_stored) return res.status(500).send({message: "Ha ocurrido un error al guardar la categoría."});
        return res.status(200).send({category_stored});
      });
    } else {
      return res.status(403).send({message: "No se han enviado correctamente todos los parametros para crear la categoría."});
    }
  },

  category_get: function(req, res) {
    Category.findOne({_id: req.params.id}, (err, category) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al encontrar la categoría."});
      if (!category) return res.status(404).send({not_found: true});
      return res.status(200).send({category});
    });
  },

  category_list: function(req, res) {
    Category.find().sort("order").exec((err, categories) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener la lista de categorías."});
      if (!categories) return res.status(200).send({empty_record: true});
      return res.status(200).send({categories});
    });
  },

  category_update: function(req, res) {
    Category.findOneAndUpdate({_id: req.params.id}, req.body, {new: true}, (err, category_stored) => {
      if(err || !category_stored) return res.status(500).send({message: "Ha ocurrido un error al crear la categoría."});
      return res.status(200).send({category_stored});
    });
  },

  category_delete: function(req, res) {
    Category.find().sort("order").exec((err, categories) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un eliminar al borrar la categoría."});
      if (categories.length > 1) {
        Forum.find({category: req.params.id}, async (err, forums) => {
          if (forums) {
            await Promise.map(forums, (forum) => {
              forum.category = categories[1]._id;
              forum.save();
            });
          }
          Category.findOneAndDelete({_id: req.params.id}, (err) => {
            if (err) return res.status(500).send({message: "Ha ocurrido un error al eliminar la categoría."});
            return res.status(200).send({deleted: true});
          });
        });
      } else {
        let category = new Category();
        category.name = "Fallback Category";
        category.order = 1;
        category.save((err, category) => {
          Forum.find({category: req.params.id}, async (err, forums) => {
            if (forums) {
              await Promise.map(forums, (forum) => {
                forum.category = category._id;
                forum.save();
              });
            }
            Category.findOneAndDelete({_id: req.params.id}, (err) => {
              if (err) return res.status(500).send({message: "Ha ocurrido un error al eliminar la categoría."});
              return res.status(200).send({deleted: true, fallback: true});
            });
          });
        });
      }
    });
  }

};