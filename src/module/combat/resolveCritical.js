// Critical hit resolution system - Anima Beyond Fantasy rules
import ABFFoundryRoll from '../rolls/ABFFoundryRoll';

const CRITICAL_LOCATIONS = [
  { min: 1, max: 10, location: 'Costillas', zone: 'torso' },
  { min: 11, max: 20, location: 'Hombro', zone: 'torso' },
  { min: 21, max: 30, location: 'Estómago', zone: 'torso' },
  { min: 31, max: 35, location: 'Riñones', zone: 'torso' },
  { min: 36, max: 48, location: 'Pecho', zone: 'torso' },
  { min: 49, max: 50, location: 'Corazón', zone: 'torso' },
  { min: 51, max: 54, location: 'Brazo derecho (superior)', zone: 'arm_right' },
  { min: 55, max: 58, location: 'Brazo derecho (inferior)', zone: 'arm_right' },
  { min: 59, max: 60, location: 'Mano derecha', zone: 'arm_right' },
  { min: 61, max: 64, location: 'Brazo izquierdo (superior)', zone: 'arm_left' },
  { min: 65, max: 68, location: 'Brazo izquierdo (inferior)', zone: 'arm_left' },
  { min: 69, max: 70, location: 'Mano izquierda', zone: 'arm_left' },
  { min: 71, max: 74, location: 'Muslo derecho', zone: 'leg_right' },
  { min: 75, max: 78, location: 'Pantorrilla derecha', zone: 'leg_right' },
  { min: 79, max: 80, location: 'Pie derecho', zone: 'leg_right' },
  { min: 81, max: 84, location: 'Muslo izquierdo', zone: 'leg_left' },
  { min: 85, max: 88, location: 'Pantorrilla izquierda', zone: 'leg_left' },
  { min: 89, max: 90, location: 'Pie izquierdo', zone: 'leg_left' },
  { min: 91, max: 100, location: 'Cabeza', zone: 'head' }
];

function getLocation(roll) {
  return CRITICAL_LOCATIONS.find(l => roll >= l.min && roll <= l.max) || CRITICAL_LOCATIONS[0];
}

function isLimb(zone) {
  return ['arm_right', 'arm_left', 'leg_right', 'leg_left'].includes(zone);
}

function isVital(zone, location) {
  return zone === 'head' || location === 'Corazón';
}

function getCriticalSeverity(critLevel, location) {
  const zone = location.zone;

  if (critLevel <= 0) {
    return {
      level: 'Ninguno', painPenalty: 0, physicalPenalty: 0,
      needsLocation: false, limbDestroyed: false, unconscious: false, death: false,
      description: 'RF superada. Sin efecto de crítico.'
    };
  }

  if (critLevel <= 50) {
    return {
      level: 'Menor (1-50)', painPenalty: critLevel, physicalPenalty: 0,
      needsLocation: false, limbDestroyed: false, unconscious: false, death: false,
      description: `Penalizador de -${critLevel} a toda acción por dolor. Se recupera a 5 puntos por asalto.`
    };
  }

  const pain = Math.ceil(critLevel / 2);
  const physical = critLevel - pain;
  const unconscious = zone === 'head';

  if (critLevel <= 100) {
    return {
      level: 'Mayor (51-100)', painPenalty: pain, physicalPenalty: physical,
      needsLocation: true, limbDestroyed: false, unconscious, death: false,
      description: `Dolor: -${pain} (5/asalto). Físico: -${physical} (5/semana).${unconscious ? ' ¡INCONSCIENTE!' : ''}`
    };
  }

  const limbDest = isLimb(zone);
  const death = isVital(zone, location);

  if (critLevel <= 150) {
    return {
      level: 'Grave (101-150)', painPenalty: pain, physicalPenalty: physical,
      needsLocation: true, limbDestroyed: limbDest, unconscious: unconscious || false, death,
      description: `Dolor: -${pain} (5/asalto). Físico: -${physical} (5/semana).${limbDest ? ' ¡Miembro DESTROZADO!' : ''}${death ? ' ¡MUERTE!' : ''}`
    };
  }

  return {
    level: 'Devastador (151+)', painPenalty: pain, physicalPenalty: physical,
    needsLocation: true, limbDestroyed: limbDest, unconscious: true, death,
    description: `Dolor: -${pain} (5/asalto). Físico: -${physical} (5/semana). INCONSCIENTE. Muere en CON minutos sin atención.${limbDest ? ' ¡Miembro DESTROZADO!' : ''}${death ? ' ¡MUERTE!' : ''}`
  };
}

/**
 * Full critical resolution flow.
 * baseCriticalValue already includes critBonus + critDamageBonus from the attack dialog.
 */
export async function resolveCritical({ baseCriticalValue, defenderActor, defenderTokenId }) {
  // 1. Attacker rolls 1d100 (NO open roll) + damage (which already includes crit bonuses)
  const critRoll = new ABFFoundryRoll('1d100', {});
  await critRoll.roll();

  let rawCritLevel = critRoll.total + baseCriticalValue;

  // If over 200, excess is halved
  if (rawCritLevel > 200) {
    rawCritLevel = 200 + Math.floor((rawCritLevel - 200) / 2);
  }

  // 2. Defender rolls RF
  let rfValue = 0;
  if (defenderActor) {
    rfValue = defenderActor.system?.characteristics?.secondaries?.resistances?.physical?.final?.value ?? 0;
  }

  const rfRoll = new ABFFoundryRoll('1d100', defenderActor?.system ?? {});
  await rfRoll.roll();
  const rfTotal = rfRoll.total + rfValue;

  // 3. Final critical level
  const finalCritLevel = Math.max(0, rawCritLevel - rfTotal);

  // 4. Location (only if > 50)
  let location = { location: 'N/A', zone: 'general' };
  let locRollTotal = 0;
  if (finalCritLevel > 50) {
    const locRoll = new ABFFoundryRoll('1d100', {});
    await locRoll.roll();
    locRollTotal = locRoll.total;
    location = getLocation(locRollTotal);
  }

  // 5. Severity
  const severity = getCriticalSeverity(finalCritLevel, location);

  // 6. Chat message
  const speaker = defenderActor
    ? ChatMessage.getSpeaker({ actor: defenderActor })
    : ChatMessage.getSpeaker();

  const overflowNote = (critRoll.total + baseCriticalValue) > 200
    ? ` → ${rawCritLevel} (exceso sobre 200 reducido a mitad)` : '';

  const totalPenalty = severity.painPenalty + severity.physicalPenalty;

  let alertsHtml = '';
  if (severity.death) alertsHtml += '<p style="color:#c00; font-weight:bold;">💀 ¡MUERTE!</p>';
  else if (severity.unconscious) alertsHtml += '<p style="color:#c60; font-weight:bold;">💫 ¡INCONSCIENTE!</p>';
  if (severity.limbDestroyed) alertsHtml += '<p style="color:#c00; font-weight:bold;">🦴 ¡Miembro destrozado/amputado!</p>';

  const content = `
    <div class="animabf-chat-message" style="padding: 0.5rem;">
      <h3 style="margin:0 0 0.5rem; border-bottom:1px solid #ccc; padding-bottom:4px;">⚔️ Resolución de Crítico</h3>
      <p><strong>Nivel de crítico:</strong> ${critRoll.total} (d100) + ${baseCriticalValue} (daño+bonos) = ${critRoll.total + baseCriticalValue}${overflowNote}</p>
      <p><strong>Tirada de RF:</strong> ${rfRoll.total} (d100) + ${rfValue} (RF) = <strong>${rfTotal}</strong></p>
      <p><strong>Resultado:</strong> ${rawCritLevel} - ${rfTotal} = <strong>${finalCritLevel}</strong></p>
      <hr style="margin: 0.4rem 0;">
      <p><strong>Severidad:</strong> ${severity.level}</p>
      ${severity.needsLocation ? `<p><strong>Localización (${locRollTotal}):</strong> 📍 ${location.location}</p>` : ''}
      ${alertsHtml}
      <p>${severity.description}</p>
      ${totalPenalty > 0 ? `
      <div style="margin-top:0.5rem;">
        <button type="button" class="chat-action-button" style="width:100%;"
                data-action="animabf-apply-critical-effect"
                data-penalty="${totalPenalty}"
                data-location="${location.location}"
                data-zone="${location.zone}"
                data-def-actor="${defenderActor?.id ?? ''}"
                data-def-token="${defenderTokenId ?? ''}">
          Aplicar Penalizador Físico (-${totalPenalty})
        </button>
      </div>` : ''}
    </div>
  `;

  await ChatMessage.create({ user: game.user.id, content, speaker });
  return { finalCritLevel, location, severity };
}

/**
 * Apply critical penalty to actor's allActions.base modifier.
 */
export async function applyCriticalEffect({ penalty, location, actorId }) {
  const actor = actorId ? game.actors.get(actorId) : null;
  if (!actor) return;

  const current = actor.system?.general?.modifiers?.physicalActions?.base?.value ?? 0;
  const newValue = current - Number(penalty);

  await actor.update({
    'system.general.modifiers.physicalActions.base.value': newValue
  });

  ui.notifications.info(`Crítico en ${location}: Mod. físico ${current} → ${newValue} (${actor.name})`);
}
