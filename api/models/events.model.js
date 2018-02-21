'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var EventsSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  date_created: {
    type: Date,
    default: Date.now
  },
  on_days: {
    type: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
  },
  official_date: {
    type: {
      type: Date,
    },
  },
  status: {
    type: [{
      type: String,
      enum: ['idle', 'pending', 'active', 'completed', 'canceled']
    }],
    default: ['idle']
  },
  weight: {
    type: Number,
    default: 1,
  },
  length: {
    type: Number,
    default: 1,
  }
});

module.exports = mongoose.model('Events', EventsSchema);
