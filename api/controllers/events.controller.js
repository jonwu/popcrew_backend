'use strict';
var mongoose = require('mongoose'),
  Event = mongoose.model('Events');

exports.list = function(req, res) {
  const query = {};
  if (req.query.status) query.status = req.query.status;
  if (req.query.user) query.users = req.query.user;
  Event.find(query)
    .then(event => res.json(event))
    .catch(err => res.send(err));
};

exports.create = function(req, res) {
  if (req.body.valid_days) req.body.valid_days = req.body.valid_days.split(',');
  if (req.body.users) req.body.users = req.body.users.split(',');

  var new_event = new Event(req.body);
  new_event
    .save()
    .then(event => res.json(event))
    .catch(err => res.send(err));
};

exports.read = function(req, res) {
  Event.findById(req.params.eventId)
    .then(event => res.json(event))
    .catch(err => res.send(err));
};

exports.update = function(req, res) {
  if (req.body.valid_days) req.body.valid_days = req.body.valid_days.split(',');
  if (req.body.users) req.body.users = req.body.users.split(',');

  Event.findOneAndUpdate({ _id: req.params.eventId }, req.body, { new: true })
    .then(event => res.json(event))
    .catch(err => res.send(err));
};

exports.delete = function(req, res) {
  Event.remove({
    _id: req.params.eventId,
  })
    .then(event => res.json('Event sucessfully deleted'))
    .catch(err => res.send(err));
};
