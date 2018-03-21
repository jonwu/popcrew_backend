'use strict';
module.exports = function(app) {
  var usersController = require('../controllers/users.controller');

  app.route('/users')
    .get(usersController.list)
    .post(usersController.create);


  app.route('/users/:userId')
    .get(usersController.read)
    .patch(usersController.update)
    .delete(usersController.delete);

  app.route('/signin')
    .get(usersController.signin);
};
