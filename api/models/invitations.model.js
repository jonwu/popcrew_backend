'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

var InvitationsSchema = new Schema({
  dates_options: [{
    type: Date,
    required: true,
  }],
  dates_accepted: [{
    type: Date,
  }],
  user: {
    type: ObjectId,
    ref: 'Users',
    required: true,
  },
  event: {
    type: ObjectId,
    ref: 'Events',
    required: true,
  },
  status: {
    type: String,
    enum: ['idle', 'accepted', 'rejected'],
    default: 'idle'
  },
});

module.exports = mongoose.model('Invitations', InvitationsSchema);
