'use strict';
var mongoose = require('mongoose'),
  User = mongoose.model('Users');

exports.list = function(req, res) {
  User.find({})
    .then(user => res.json(user))
    .catch(err => res.send(err));
};

exports.create = function(req, res) {
  var new_user = new User(req.body);
  new_user
    .save()
    .then(user => res.json(user))
    .catch(err => res.send(err));
};

exports.read = function(req, res) {
  User.findById(req.params.userId)
    .then(user => res.json(user))
    .catch(err => res.send(err));
};

exports.update = function(req, res) {
  User.findOneAndUpdate({ _id: req.params.userId }, req.body, { new: true })
    .then(user => res.json(user))
    .catch(err => res.send(err));
};

exports.delete = function(req, res) {
  User.remove({
    _id: req.params.userId,
  })
    .then(user => res.json('User sucessfully deleted'))
    .catch(err => res.send(err));
};
