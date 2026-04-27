import "../../../../actor/ABFActor.js";
const canOwnerReceiveMessage = (actor) => {
  if (!actor.hasPlayerOwner || !actor.id) {
    return false;
  }
  const activePlayers = game.users.players.filter((u) => u.active);
  return activePlayers.some((u) => actor.testUserPermission(u, "OWNER"));
};
export {
  canOwnerReceiveMessage
};
