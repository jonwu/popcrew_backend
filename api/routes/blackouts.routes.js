'use strict';
module.exports = function(app) {
  var blackoutsController = require('../controllers/blackouts.controller');

  app.route('/blackouts')
    .get(blackoutsController.list)
    .post(blackoutsController.create);


  app.route('/blackouts/:userId')
    .get(blackoutsController.read)
    .put(blackoutsController.update)
    .delete(blackoutsController.delete);
};
