'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

var GroupsSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  date_created: {
    type: Date,
    default: Date.now
  },
  users: [{
    type: ObjectId,
    ref: 'Users',
  }]
});

module.exports = mongoose.model('Groups', GroupsSchema);
