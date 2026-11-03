// Uninvited signups never receive access to the application.
export default {
  userValidate(event) { if (!event.user.invitedAt) event.deny(); },
};
