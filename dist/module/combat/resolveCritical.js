import { openModDialog } from "../utils/dialogs/openSimpleInputDialog.js";
import ABFFoundryRoll from "../rolls/ABFFoundryRoll.js";
const CRITICAL_LOCATIONS = [
  { min: 1, max: 10, location: "Costillas", zone: "torso" },
  { min: 11, max: 20, location: "Hombro", zone: "torso" },
  { min: 21, max: 30, location: "Estómago", zone: "torso" },
  { min: 31, max: 35, location: "Riñones", zone: "torso" },
  { min: 36, max: 48, location: "Pecho", zone: "torso" },
  { min: 49, max: 50, location: "Corazón", zone: "torso" },
  { min: 51, max: 54, location: "Brazo derecho (superior)", zone: "arm_right" },
  { min: 55, max: 58, location: "Brazo derecho (inferior)", zone: "arm_right" },
  { min: 59, max: 60, location: "Mano derecha", zone: "arm_right" },
  { min: 61, max: 64, location: "Brazo izquierdo (superior)", zone: "arm_left" },
  { min: 65, max: 68, location: "Brazo izquierdo (inferior)", zone: "arm_left" },
  { min: 69, max: 70, location: "Mano izquierda", zone: "arm_left" },
  { min: 71, max: 74, location: "Muslo derecho", zone: "leg_right" },
  { min: 75, max: 78, location: "Pantorrilla derecha", zone: "leg_right" },
  { min: 79, max: 80, location: "Pie derecho", zone: "leg_right" },
  { min: 81, max: 84, location: "Muslo izquierdo", zone: "leg_left" },
  { min: 85, max: 88, location: "Pantorrilla izquierda", zone: "leg_left" },
  { min: 89, max: 90, location: "Pie izquierdo", zone: "leg_left" },
  { min: 91, max: 100, location: "Cabeza", zone: "head" }
];
function getLocation(roll) {
  return CRITICAL_LOCATIONS.find((l) => roll >= l.min && roll <= l.max) || CRITICAL_LOCATIONS[0];
}
function isLimb(zone) {
  return ["arm_right", "arm_left", "leg_right", "leg_left"].includes(zone);
}
function isVital(zone, location) {
  return zone === "head" || location === "Corazón";
}
async function resolveCritical({ baseCriticalValue, defenderActor, defenderTokenId }) {
  const critRoll = new ABFFoundryRoll("1d100", {});
  await critRoll.roll();
  let rawCritLevel = critRoll.total + baseCriticalValue;
  if (rawCritLevel > 200) {
    rawCritLevel = 200 + Math.floor((rawCritLevel - 200) / 2);
  }
  const rfMod = await openModDialog() ?? 0;
  let rfBase = 0;
  if (defenderActor) {
    rfBase = defenderActor.system?.characteristics?.secondaries?.resistances?.physical?.final?.value ?? 0;
  }
  const rfRoll = new ABFFoundryRoll("1d100", defenderActor?.system ?? {});
  await rfRoll.roll();
  const rfTotal = rfRoll.total + rfBase + rfMod;
  const finalCritLevel = Math.max(0, rawCritLevel - rfTotal);
  let location = { location: "", zone: "general" };
  let locRollTotal = 0;
  if (finalCritLevel > 50) {
    const locRoll = new ABFFoundryRoll("1d100", {});
    await locRoll.roll();
    locRollTotal = locRoll.total;
    location = getLocation(locRollTotal);
  }
  const totalPenalty = finalCritLevel;
  let effectLine = "";
  let extraLines = "";
  if (finalCritLevel <= 0) {
    effectLine = "Sin efecto.";
  } else if (finalCritLevel <= 50) {
    effectLine = `Negativo: -${finalCritLevel} (dolor)`;
  } else {
    const pain = Math.ceil(finalCritLevel / 2);
    const physical = finalCritLevel - pain;
    effectLine = `Negativo: -${pain} (dolor) -${physical} (daño físico)`;
    if (isLimb(location.zone)) {
      extraLines += finalCritLevel > 100 ? `<p><strong>Miembro destrozado/amputado</strong></p>` : "";
    }
    if (isVital(location.zone, location.location) && finalCritLevel > 100) {
      extraLines += `<p><strong>MUERTE</strong></p>`;
    } else if (location.zone === "head" || finalCritLevel > 150) {
      extraLines += `<p><strong>INCONSCIENTE</strong></p>`;
    }
    if (finalCritLevel > 150 && !isVital(location.zone, location.location)) {
      extraLines += `<p>Muere en CON minutos sin atención médica</p>`;
    }
  }
  const speaker = defenderActor ? ChatMessage.getSpeaker({ actor: defenderActor }) : ChatMessage.getSpeaker();
  const content = `
    <div class="animabf-chat-message combat-result-message">
      <div class="group">
        <div class="group-header"><div class="group-header-title">Crítico</div></div>
        <div class="group-body">
          <p><strong>Crítico:</strong> ${rawCritLevel} - ${rfTotal} (RF) = <strong>${finalCritLevel}</strong></p>
          <p><strong>Efecto:</strong> ${effectLine}</p>
          ${finalCritLevel > 50 && location.location ? `<p><strong>Localización:</strong> ${location.location}</p>` : ""}
          ${extraLines}
          ${totalPenalty > 0 ? `
          <button type="button" class="chat-action-button" style="width:100%; margin-top:0.3rem;"
                  data-action="animabf-apply-critical-effect"
                  data-penalty="${totalPenalty}"
                  data-location="${location.location || "General"}"
                  data-zone="${location.zone}"
                  data-def-actor="${defenderActor?.id ?? ""}"
                  data-def-token="${defenderTokenId ?? ""}">
            Aplicar Penalizador (-${totalPenalty})
          </button>` : ""}
        </div>
      </div>
    </div>
  `;
  await ChatMessage.create({ user: game.user.id, content, speaker });
  return { finalCritLevel, location };
}
async function applyCriticalEffect({ penalty, location, actorId }) {
  const actor = actorId ? game.actors.get(actorId) : null;
  if (!actor) return;
  const current = actor.system?.general?.modifiers?.physicalActions?.base?.value ?? 0;
  const newValue = current - Number(penalty);
  await actor.update({
    "system.general.modifiers.physicalActions.base.value": newValue
  });
  ui.notifications.info(`Crítico en ${location}: Mod. físico ${current} → ${newValue} (${actor.name})`);
}
export {
  applyCriticalEffect,
  resolveCritical
};
