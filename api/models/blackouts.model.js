'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

var BlackoutsSchema = new Schema({
  date: {
    type: Date,
    required: true,
  },
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
});

module.exports = mongoose.model('Blackouts', BlackoutsSchema);
