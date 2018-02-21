'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var UsersSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  date_created: {
    type: Date,
    default: Date.now
  },
});

module.exports = mongoose.model('Users', UsersSchema);
