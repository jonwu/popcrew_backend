'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var UsersSchema = new Schema({
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  apn_tokens: [{
    type: String,
  }],
  gcm_tokens: [{
    type: String,
  }],
  date_created: {
    type: Date,
    default: Date.now
  },
});

module.exports = mongoose.model('Users', UsersSchema);
