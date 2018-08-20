'use strict';
module.exports = function(app) {
  var invitationsController = require('../controllers/invitations.controller');

  app.route('/invitations')
    .get(invitationsController.list)
    .post(invitationsController.create)
    .patch(invitationsController.update)


  app.route('/invitations/:invitationId')
    .get(invitationsController.read)
    .delete(invitationsController.delete);
};
