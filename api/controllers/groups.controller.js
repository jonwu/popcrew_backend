'use strict';
var emoji = require('node-emoji')
var mongoose = require('mongoose'),
  Group = mongoose.model('Groups');
var helper = require('../helpers/helper');


exports.list = function(req, res) {
  Group.find()
    .populate('users')
    .then(group => res.json(group))
    .catch(err => res.send(err));
};

const create = exports.create = function(req, res, next, tries = 0) {
  if (req.body.users) req.body.users = req.body.users.split(',');
  req.body.codename = generateEmojiCodename(3);
  var new_group = new Group(req.body);
  new_group
    .save()
    .then(group => res.json(group))
    .catch(err => {
      if (err.code === 11000 && tries < 10) {
        create(req, res, next, tries + 1);
      } else {
        res.send(err)
      }
    });
};

exports.read = function(req, res) {
  Group.findById(req.params.groupId)
    .then(group => res.json(group))
    .catch(err => res.send(err));
};

exports.update = function(req, res) {
  Group.findOneAndUpdate({ _id: req.params.groupId }, req.body, { new: true })
    .then(group => res.json(group))
    .catch(err => res.send(err));
};

exports.addUser = function(req, res) {
  const query = {}
  if (req.body.user) query['$addToSet'] = { users: [req.body.user] }
  Group.findOneAndUpdate({ codename: req.params.codename }, query, { new: true })
    .then(group => {
      helper.handleNewUser(req.body.user, group._id).then(() => {
        res.json(group);
      });
    })
    .catch(err => res.send(err));
};


exports.delete = function(req, res) {
  Group.remove({
    _id: req.params.groupId,
  })
    .then(group => res.json('Group sucessfully deleted'))
    .catch(err => res.send(err));
};

function generateEmojiCodename(length) {
  let codename = '';
  for (var i = 0; i < length; i++) {
    codename += emoji.random().emoji
  }
  return codename;
}
