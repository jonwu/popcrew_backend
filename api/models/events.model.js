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
    enum: ['idle', 'pending', 'active', 'completed', 'canceled'],
    default: 'idle'
  },
  weight: {
    type: Number,
    default: 1,
  },
  length: {
    type: Number,
    default: 1,
  },
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
