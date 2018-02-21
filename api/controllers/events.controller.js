'use strict';
var mongoose = require('mongoose'),
  Event = mongoose.model('Events');

exports.list = function(req, res) {
  Event.find({})
    .then(event => res.json(event))
    .catch(err => res.send(err));
};

exports.create = function(req, res) {
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
