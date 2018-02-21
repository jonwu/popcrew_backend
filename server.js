var express = require('express'),
  app = express(),
  port = process.env.PORT || 3000,
  mongoose = require('mongoose'),
  Event = require('./api/models/events.model'), //created model loading here
  User = require('./api/models/users.model'), //created model loading here
  Group = require('./api/models/groups.model'), //created model loading here
  bodyParser = require('body-parser');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/Popcrewdb');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.listen(port);

var eventsRoutes = require('./api/routes/events.routes'); //importing route
var usersRoutes = require('./api/routes/users.routes'); //importing route
var groupsRoutes = require('./api/routes/groups.routes'); //importing route
eventsRoutes(app); //register the route
usersRoutes(app); //register the route
groupsRoutes(app); //register the route


console.log('RESTful API server started on: ' + port);
