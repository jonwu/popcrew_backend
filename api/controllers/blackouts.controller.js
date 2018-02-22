'use strict';
var mongoose = require('mongoose'),
  Blackout = mongoose.model('Blackouts');

exports.list = function(req, res) {
  Blackout.find({})
    .then(blackout => res.json(blackout))
    .catch(err => res.send(err));
};

exports.create = function(req, res) {
  var new_blackout = new Blackout(req.body);
  new_blackout
    .save()
    .then(blackout => res.json(blackout))
    .catch(err => res.send(err));
};

exports.read = function(req, res) {
  Blackout.findById(req.params.blackoutId)
    .then(blackout => res.json(blackout))
    .catch(err => res.send(err));
};

exports.update = function(req, res) {
  Blackout.findOneAndUpdate({ _id: req.params.blackoutId }, req.body, { new: true })
    .then(blackout => res.json(blackout))
    .catch(err => res.send(err));
};

exports.delete = function(req, res) {
  Blackout.remove({
    _id: req.params.blackoutId,
  })
    .then(blackout => res.json('Blackout sucessfully deleted'))
    .catch(err => res.send(err));
};
