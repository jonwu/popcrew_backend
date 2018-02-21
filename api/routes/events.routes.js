'use strict';
module.exports = function(app) {
  var eventsController = require('../controllers/events.controller');

  app.route('/events')
    .get(eventsController.list)
    .post(eventsController.create);


  app.route('/events/:eventId')
    .get(eventsController.read)
    .put(eventsController.update)
    .delete(eventsController.delete);
};
