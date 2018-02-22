'use strict';
module.exports = function(app) {
  var invitationsController = require('../controllers/invitations.controller');

  app.route('/invitations')
    .get(invitationsController.list)
    .post(invitationsController.create);


  app.route('/invitations/:userId')
    .get(invitationsController.read)
    .put(invitationsController.update)
    .delete(invitationsController.delete);
};
