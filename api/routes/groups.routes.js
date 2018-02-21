'use strict';
module.exports = function(app) {
  var groupsController = require('../controllers/groups.controller');

  app.route('/groups')
    .get(groupsController.list)
    .post(groupsController.create);


  app.route('/groups/:groupId')
    .get(groupsController.read)
    .put(groupsController.update)
    .delete(groupsController.delete);
};
