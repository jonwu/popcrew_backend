'use strict';
module.exports = function(app) {
  var usersController = require('../controllers/users.controller');

  app.route('/users')
    .get(usersController.list)
    .post(usersController.create);


  app.route('/users/:userId')
    .get(usersController.read)
    .put(usersController.update)
    .delete(usersController.delete);
};
