'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

var EventsSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  date_created: {
    type: Date,
    default: Date.now
  },
  options: [{
    start_day: {
      type: String,
      enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    },
    duration: Number,
  }],
  status: {
    type: String,
    enum: ['idle', 'pending', 'processing', 'active', 'completed', 'canceled'],
    default: 'idle'
  },
  date_option: {
    start_date: Date,
    duration: Number,
  },
  notified_days_before: {
    type: Number,
    default: 3,
  },
  expiration: {
    type: Date,
  },
  groups: [{
    type: ObjectId,
    ref: 'Groups'
  }],
  users: [{
    type: ObjectId,
    ref: 'Users'
  }],
  author: {
    type: ObjectId,
    ref: 'Users'
  }
});

module.exports = mongoose.model('Events', EventsSchema);
