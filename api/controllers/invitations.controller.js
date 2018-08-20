'use strict';
const helper = require('../helpers/helper');

var mongoose = require('mongoose'),
  Invitation = mongoose.model('Invitations');

exports.list = function(req, res) {
  const query = {}
  if (req.query.user) query.user = req.query.user;
  if (req.query.event) query.event = req.query.event;
  Invitation.find(query)
    .populate({path: 'event', populate: { path: 'users' }})
    .then(invitation => res.json(invitation))
    .catch(err => res.send(err));
};

exports.create = function(req, res) {
`  var new_invitation = new Invitation(req.body);
  new_invitation
    .save()
    .then(invitation => res.json(invitation))
    .catch(err => res.send(err));`
};

exports.read = function(req, res) {
  Invitation.findById(req.params.invitationId)
    .then(invitation => res.json(invitation))
    .catch(err => res.send(err));
};

exports.update = function(req, res) {
  Invitation.findOneAndUpdate({ event: req.body.event, user: req.body.user }, req.body, { new: true })
    .then(invitation => res.json(invitation))
    .catch(err => res.send(err));
};

exports.delete = function(req, res) {
  Invitation.remove({
    _id: req.params.invitationId,
  })
    .then(invitation => res.json('Invitation sucessfully deleted'))
    .catch(err => res.send(err));
};

exports.generateInvites = function(req, res) {
  const date = new Date(req.query.date);
  console.log(date)
  helper.handleInvites(date);
}
