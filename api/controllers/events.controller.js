'use strict';
var mongoose = require('mongoose'),
  Event = mongoose.model('Events'),
  Invitation = mongoose.model('Invitations');
var helper = require('../helpers/helper');
const _ = require('lodash');

exports.list = function(req, res) {
  const query = {};
  if (req.query.status) query.status = req.query.status.split(',');
  if (req.query.user) query.users = req.query.user;
  let EventObj = Event.find(query)
  if (req.query.expiration) EventObj = EventObj.sort({expiration: req.query.expiration})
  EventObj
    .populate('users')
    .then(events => {
      res.json(events)
    })
    .catch(err => res.send(err));
};

exports.create = function(req, res) {
  console.log(req.body);
  var new_event = new Event(req.body);
  new_event
    .save()
    .then(event => {
      helper.handleSingleEvent(moment(), event).then(() => {
        res.json(event);
      })
    })
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
