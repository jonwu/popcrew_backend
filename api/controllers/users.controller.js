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
  const query = {};
  if (req.body.apn_token) query['$addToSet'] = { apn_tokens: [req.body.apn_token] }
  if (req.body.gcm_token) query['$addToSet'] = { gcm_tokens: [req.body.gcm_token] }
  User.findOneAndUpdate({ _id: req.params.userId }, query, { new: true })
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

exports.signin = function(req, res) {
  if (!req.query.username) return res.status(404).send("Requires username");
  const query = {username: req.query.username}
  User.findOne(query)
    .then(user => {
      if (!user) return res.status(404).send("not found");
      return res.json(user);
    })
    .catch(err => res.status(404).send(err));
}
