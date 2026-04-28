// Critical hit resolution system - Anima Beyond Fantasy rules
import { openModDialog } from '../utils/dialogs/openSimpleInputDialog';
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
      level: 'Ninguno',
      painPenalty: 0,
      physicalPenalty: 0,
      painRecoveryPerTurn: 0,
      physicalRecoveryPerWeek: 0,
      needsLocation: false,
      limbDestroyed: false,
      unconscious: false,
      death: false,
      description: 'RF superada. Sin efecto de crítico.'
    };
  }

  if (critLevel <= 50) {
    return {
      level: 'Menor (1-50)',
      painPenalty: critLevel,
      physicalPenalty: 0,
      painRecoveryPerTurn: 5,
      physicalRecoveryPerWeek: 0,
      needsLocation: false,
      limbDestroyed: false,
      unconscious: false,
      death: false,
      description: `Penalizador de -${critLevel} a toda acción por dolor. Se recupera a 5 puntos por asalto.`
    };
  }

  const pain = Math.ceil(critLevel / 2);
  const physical = critLevel - pain;

  if (critLevel <= 100) {
    const unconscious = zone === 'head';
    return {
      level: 'Mayor (51-100)',
      painPenalty: pain,
      physicalPenalty: physical,
      painRecoveryPerTurn: 5,
      physicalRecoveryPerWeek: 5,
      needsLocation: true,
      limbDestroyed: false,
      unconscious,
      death: false,
      description: `Penalizador total: -${critLevel}. Dolor: -${pain} (recupera 5/asalto). Daño físico: -${physical} (recupera 5/semana).${unconscious ? ' ¡Impacto en cabeza: INCONSCIENTE!' : ''}`
    };
  }

  if (critLevel <= 150) {
    const limbDest = isLimb(zone);
    const death = isVital(zone, location);
    return {
      level: 'Grave (101-150)',
      painPenalty: pain,
      physicalPenalty: physical,
      painRecoveryPerTurn: 5,
      physicalRecoveryPerWeek: 5,
      needsLocation: true,
      limbDestroyed: limbDest,
      unconscious: zone === 'head',
      death,
      description: `Penalizador total: -${critLevel}. Dolor: -${pain} (recupera 5/asalto). Daño físico: -${physical} (recupera 5/semana).${limbDest ? ' ¡Miembro DESTROZADO/AMPUTADO!' : ''}${death ? ' ¡Zona vital: MUERTE!' : ''}`
    };
  }

  // 151+
  const limbDest = isLimb(zone);
  const death = isVital(zone, location);
  return {
    level: 'Devastador (151+)',
    painPenalty: pain,
    physicalPenalty: physical,
    painRecoveryPerTurn: 5,
    physicalRecoveryPerWeek: 5,
    needsLocation: true,
    limbDestroyed: limbDest,
    unconscious: true,
    death,
    description: `Penalizador total: -${critLevel}. Dolor: -${pain} (recupera 5/asalto). Daño físico: -${physical} (recupera 5/semana). INCONSCIENTE. Muere en CON minutos sin atención médica.${limbDest ? ' ¡Miembro DESTROZADO!' : ''}${death ? ' ¡MUERTE INSTANTÁNEA!' : ''}`
  };
}

/**
 * Full critical resolution flow.
 * @param {object} opts
 * @param {number} opts.baseCriticalValue - damage that triggered the crit
 * @param {Actor|null} opts.defenderActor
 * @param {string} opts.defenderTokenId
 */
export async function resolveCritical({ baseCriticalValue, defenderActor, defenderTokenId }) {
  // 1. Attacker rolls 1d100 (NO open roll) + damage = raw critical level
  const critRoll = new ABFFoundryRoll('1d100', {});
  await critRoll.roll();

  let rawCritLevel = critRoll.total + baseCriticalValue;

  // If over 200, excess is halved
  if (rawCritLevel > 200) {
    rawCritLevel = 200 + Math.floor((rawCritLevel - 200) / 2);
  }

  // 2. Ask for modifier
  const critMod = await openModDialog() ?? 0;
  const adjustedCritLevel = rawCritLevel + critMod;

  // 3. Defender rolls RF
  let rfValue = 0;
  if (defenderActor) {
    rfValue = defenderActor.system?.characteristics?.secondaries?.resistances?.physical?.final?.value ?? 0;
  }

  const rfRoll = new ABFFoundryRoll('1d100', defenderActor?.system ?? {});
  await rfRoll.roll();
  const rfTotal = rfRoll.total + rfValue;

  // 4. Final critical level = adjusted - RF
  const finalCritLevel = Math.max(0, adjustedCritLevel - rfTotal);

  // 5. Location (only if > 50)
  let location = { location: 'N/A', zone: 'general' };
  let locRollTotal = 0;
  if (finalCritLevel > 50) {
    const locRoll = new ABFFoundryRoll('1d100', {});
    await locRoll.roll();
    locRollTotal = locRoll.total;
    location = getLocation(locRollTotal);
  }

  // 6. Severity
  const severity = getCriticalSeverity(finalCritLevel, location);

  // 7. Chat message
  const speaker = defenderActor
    ? ChatMessage.getSpeaker({ actor: defenderActor })
    : ChatMessage.getSpeaker();

  let locationHtml = '';
  if (severity.needsLocation) {
    locationHtml = `<p><strong>Localización (${locRollTotal}):</strong> 📍 ${location.location}</p>`;
  }

  let alertsHtml = '';
  if (severity.death) alertsHtml += '<p style="color:#c00; font-weight:bold;">💀 ¡MUERTE!</p>';
  else if (severity.unconscious) alertsHtml += '<p style="color:#c60; font-weight:bold;">💫 ¡INCONSCIENTE!</p>';
  if (severity.limbDestroyed) alertsHtml += '<p style="color:#c00; font-weight:bold;">🦴 ¡Miembro destrozado/amputado!</p>';

  const totalPenalty = severity.painPenalty + severity.physicalPenalty;

  const content = `
    <div class="animabf-chat-message" style="padding: 0.5rem;">
      <h3 style="margin:0 0 0.5rem; border-bottom:1px solid #ccc; padding-bottom:4px;">⚔️ Resolución de Crítico</h3>
      <p><strong>Tirada de crítico:</strong> ${critRoll.total} (d100) + ${baseCriticalValue} (daño) = ${critRoll.total + baseCriticalValue}${rawCritLevel !== critRoll.total + baseCriticalValue ? ` → ${rawCritLevel} (exceso sobre 200 reducido a mitad)` : ''}${critMod !== 0 ? ` ${critMod >= 0 ? '+' : ''}${critMod} mod = ${adjustedCritLevel}` : ''}</p>
      <p><strong>Tirada de RF:</strong> ${rfRoll.total} (d100) + ${rfValue} (RF) = <strong>${rfTotal}</strong></p>
      <p><strong>Nivel de crítico:</strong> ${adjustedCritLevel} - ${rfTotal} = <strong>${finalCritLevel}</strong></p>
      <hr style="margin: 0.4rem 0;">
      <p><strong>Severidad:</strong> ${severity.level}</p>
      ${locationHtml}
      ${alertsHtml}
      <p>${severity.description}</p>
      ${finalCritLevel > 0 && severity.painPenalty > 0 ? `
      <p style="font-size:0.8rem; opacity:0.8;">Dolor: -${severity.painPenalty} (recupera ${severity.painRecoveryPerTurn}/asalto)${severity.physicalPenalty > 0 ? ` | Físico: -${severity.physicalPenalty} (recupera ${severity.physicalRecoveryPerWeek}/semana)` : ''}</p>
      ` : ''}
      ${totalPenalty > 0 ? `
      <div style="margin-top:0.5rem; display:flex; gap:0.5rem;">
        <button type="button" class="chat-action-button" style="flex:1;"
                data-action="animabf-apply-critical-effect"
                data-penalty="${totalPenalty}"
                data-pain="${severity.painPenalty}"
                data-physical="${severity.physicalPenalty}"
                data-location="${location.location}"
                data-zone="${location.zone}"
                data-def-actor="${defenderActor?.id ?? ''}"
                data-def-token="${defenderTokenId ?? ''}">
          Aplicar Penalizador (-${totalPenalty})
        </button>
      </div>` : ''}
    </div>
  `;

  await ChatMessage.create({ user: game.user.id, content, speaker });

  return { finalCritLevel, location, severity };
}

/**
 * Apply critical effect as ActiveEffect on the actor.
 */
export async function applyCriticalEffect({ penalty, pain, physical, location, zone, actorId }) {
  const actor = actorId ? game.actors.get(actorId) : null;
  if (!actor) return;

  const effectName = `Crítico: ${location} (-${penalty})`;
  const changes = [
    {
      key: 'system.general.modifiers.allActions.special.value',
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: String(-penalty),
      priority: 20
    }
  ];

  const effectData = {
    name: effectName,
    icon: 'icons/svg/blood.svg',
    disabled: false,
    origin: null,
    transfer: false,
    changes,
    flags: {
      animabf: {
        criticalEffect: true,
        totalPenalty: Number(penalty),
        painPenalty: Number(pain) || Number(penalty),
        physicalPenalty: Number(physical) || 0,
        location,
        zone,
        painRecoveryPerTurn: 5,
        physicalRecoveryPerWeek: 5
      }
    }
  };

  await actor.createEmbeddedDocuments('ActiveEffect', [effectData]);
  ui.notifications.info(`Aplicado: ${effectName} a ${actor.name}`);
}
