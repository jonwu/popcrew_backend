var express = require('express'),
  app = express(),
  port = process.env.PORT || 3000,
  mongoose = require('mongoose'),
  Event = require('./api/models/events.model'), //created model loading here
  User = require('./api/models/users.model'), //created model loading here
  Group = require('./api/models/groups.model'), //created model loading here
  Blackouts = require('./api/models/blackouts.model'), //created model loading here
  Invitations = require('./api/models/invitations.model'), //created model loading here
  bodyParser = require('body-parser'),
  helper = require('./api/helpers/helper');
  moment = require('moment');


mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/Popcrewdb');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.listen(port);

var eventsRoutes = require('./api/routes/events.routes'); //importing route
var usersRoutes = require('./api/routes/users.routes'); //importing route
var groupsRoutes = require('./api/routes/groups.routes'); //importing route
var blackoutsRoutes = require('./api/routes/blackouts.routes'); //importing route
var invitationsRoutes = require('./api/routes/invitations.routes'); //importing route

eventsRoutes(app); //register the route
usersRoutes(app); //register the route
groupsRoutes(app); //register the route
blackoutsRoutes(app); //register the route
invitationsRoutes(app); //register the route

// let chainedPromises = Promise.resolve();
// [0,1,2,3,4,5,6,7,8,9,10, 11, 12, 13,14,15,16,17,18,19,20, 21].map(index => {
//   chainedPromises = chainedPromises.then(() => helper.handleInvites(moment().startOf('day').add(index, 'days')));
// })
// helper.processInvites();
helper.initCronJobs();
// helper.processMorningNotifications();
// helper.sendPushNotification();
// helper.handleInvites(moment());


console.log('RESTful API server started on: ' + port);
