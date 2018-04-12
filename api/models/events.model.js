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
  valid_days: {
    type: [{
      type: String,
      enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    }],
    require: true,
  },
  official_date: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['idle', 'pending', 'processing', 'active', 'completed', 'canceled'],
    default: 'idle'
  },
  dates_options: [{
    type: Date,
  }],
  date_confirmed: {
    type: Date,
  },
  weight: {
    type: Number,
    default: 1,
  },
  notified_days_before: {
    type: Number,
    default: 3,
  },
  expiration: {
    type: Date,
  },
  duration: {
    type: Number,
    default: 1,
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
