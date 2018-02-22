'use strict';
var mongoose = require('mongoose'),
  Invitation = mongoose.model('Invitations');

exports.list = function(req, res) {
  Invitation.find({})
    .then(invitation => res.json(invitation))
    .catch(err => res.send(err));
};

exports.create = function(req, res) {
  var new_invitation = new Invitation(req.body);
  new_invitation
    .save()
    .then(invitation => res.json(invitation))
    .catch(err => res.send(err));
};

exports.read = function(req, res) {
  Invitation.findById(req.params.invitationId)
    .then(invitation => res.json(invitation))
    .catch(err => res.send(err));
};

exports.update = function(req, res) {
  Invitation.findOneAndUpdate({ _id: req.params.invitationId }, req.body, { new: true })
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
