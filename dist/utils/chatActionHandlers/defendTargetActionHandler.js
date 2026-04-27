import { DefenseConfigurationDialog } from "../../module/dialogs/DefenseConfigurationDialog.js";
import { ABFAttackData } from "../../module/combat/ABFAttackData.js";
import { sendAccumulationZeroDefense } from "../sendAccumulationZeroDefense.js";
async function defendTargetActionHandler(message, _html, dataset) {
  try {
    const messageId = dataset.messageId ?? message?.id;
    const msg = game.messages.get(messageId);
    if (!msg) return ui.notifications?.warn("Mensaje no encontrado.");
    const rawAtk = msg.getFlag(game.animabf.id, "attackData") ?? msg.flags?.animabf?.attackData;
    if (!rawAtk) return ui.notifications?.warn("Datos de ataque no disponibles.");
    const atk = ABFAttackData.fromJSON(rawAtk);
    let attackerToken = message?.speaker?.token ? canvas.tokens.get(message.speaker.token) : null;
    if (!attackerToken && atk.attackerId) {
      attackerToken = canvas.tokens.placeables.find((t) => t.actor?.id === atk.attackerId) ?? null;
    }
    const targets = msg.getFlag(game.animabf.id, "targets") ?? [];
    const targetTokenId = dataset.targetToken ?? dataset["target-token"] ?? "";
    const targetActorId = dataset.targetActor ?? dataset["target-actor"] ?? dataset.target ?? "";
    let targetEntry = null;
    if (targetTokenId) {
      targetEntry = targets.find((t) => t?.tokenUuid === targetTokenId) ?? targets.find((t) => (t?.tokenUuid ?? "").endsWith(`.${targetTokenId}`)) ?? null;
    }
    if (!targetEntry && targetActorId) {
      targetEntry = targets.find((t) => t?.actorUuid === targetActorId && t?.tokenUuid) ?? targets.find((t) => t?.actorUuid === targetActorId) ?? null;
    }
    let defenderToken = targetEntry ? resolveTokenForTarget(targetEntry, message) : null;
    if (!defenderToken && targetTokenId)
      defenderToken = canvas.tokens.get(targetTokenId) ?? null;
    if (!defenderToken && targetActorId) {
      defenderToken = canvas.tokens.placeables.find((t) => t.actor?.id === targetActorId) ?? null;
    }
    if (!defenderToken)
      return ui.notifications?.warn("No se encontró el token del objetivo.");
    if (!game.user.isGM) {
      const ok = defenderToken.actor?.testUserPermission(
        game.user,
        CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
      );
      if (!ok) return ui.notifications?.warn("Sin permisos para defender este objetivo.");
    }
    const defenseMode = defenderToken.actor?.system?.general?.settings?.defenseType?.value;
    const storedTokenKey = targetEntry?.tokenUuid ?? "";
    if (defenseMode === "resistance") {
      await sendAccumulationZeroDefense({
        defenderToken,
        attackerToken,
        attackData: atk,
        messageId,
        storedTokenKey
      });
      return;
    }
    new DefenseConfigurationDialog(
      {
        defender: defenderToken,
        attacker: attackerToken ?? void 0,
        attackData: atk,
        weaponId: atk.weaponId,
        messageId
      },
      { allowed: true }
    ).render(true);
  } catch (err) {
    console.error(err);
    ui.notifications?.error("No se pudo abrir la defensa.");
  }
}
const action = "defend-target";
function resolveTokenForTarget(t, message) {
  const id = t?.tokenUuid ?? "";
  if (id && id.includes(".")) {
    try {
      const doc = fromUuidSync(id);
      return doc?.object ?? null;
    } catch {
    }
  }
  if (id) {
    const onCanvas = canvas.tokens?.get?.(id);
    if (onCanvas) return onCanvas;
  }
  const actorId = t?.actorUuid ?? "";
  if (actorId) {
    const sceneId = message?.speaker?.scene;
    if (sceneId) {
      const tok = game.scenes?.get(sceneId)?.tokens?.find((tt) => tt.actorId === actorId);
      const live = tok ? canvas.tokens?.get?.(tok.id) : null;
      if (live) return live;
    }
    return canvas.tokens?.placeables?.find((tt) => tt.actor?.id === actorId) ?? null;
  }
  return null;
}
export {
  action,
  defendTargetActionHandler as default
};
