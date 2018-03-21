'use strict';
module.exports = function(app) {
  var invitationsController = require('../controllers/invitations.controller');

  app.route('/invitations')
    .get(invitationsController.list)
    .post(invitationsController.create);


  app.route('/invitations/:invitationId')
    .get(invitationsController.read)
    .patch(invitationsController.update)
    .delete(invitationsController.delete);

};
