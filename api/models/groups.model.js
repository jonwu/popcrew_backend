'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

var GroupsSchema = new Schema({
  name: {
    type: String,
  },
  date_created: {
    type: Date,
    default: Date.now
  },
  users: [{
    type: ObjectId,
    ref: 'Users',
  }],
  codename: {
    type: String,
    unique: true,
  }
});

module.exports = mongoose.model('Groups', GroupsSchema);
