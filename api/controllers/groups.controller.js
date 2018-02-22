'use strict';
var mongoose = require('mongoose'),
  Group = mongoose.model('Groups');

exports.list = function(req, res) {
  Group.find()
    .populate('users')
    .then(group => res.json(group))
    .catch(err => res.send(err));
};

exports.create = function(req, res) {
  var new_group = new Group(req.body);
  new_group
    .save()
    .then(group => res.json(group))
    .catch(err => res.send(err));
};

exports.read = function(req, res) {
  Group.findById(req.params.groupId)
    .then(group => res.json(group))
    .catch(err => res.send(err));
};

exports.update = function(req, res) {
  if (req.body.users) req.body.users = req.body.users.split(',');

  Group.findOneAndUpdate({ _id: req.params.groupId }, req.body, { new: true })
    .then(group => res.json(group))
    .catch(err => res.send(err));
};

exports.delete = function(req, res) {
  Group.remove({
    _id: req.params.groupId,
  })
    .then(group => res.json('Group sucessfully deleted'))
    .catch(err => res.send(err));
};
