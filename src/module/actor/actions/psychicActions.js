import { psychicFatigueCheck } from '../../combat/utils/psychicFatigueCheck.js';

export async function evaluatePsychicFatigue(actor, power, psychicDifficulty, eliminateFatigue, sendToChat = true) {
  const { psychic: { psychicSettings: { fatigueResistance }, psychicPoints } } = actor.system;
  const psychicFatigue = {
    value: psychicFatigueCheck(power?.system.effects[psychicDifficulty].value),
    inmune: fatigueResistance || eliminateFatigue
  };

  if (psychicFatigue.value) {
    if (sendToChat) {
      const { i18n } = game;
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: i18n.format('macros.combat.dialog.psychicPotentialFatigue.title', {
          fatiguePen: psychicFatigue.inmune ? 0 : psychicFatigue.value
        })
      });
    }
    if (!psychicFatigue.inmune && !eliminateFatigue) {
      actor.applyFatigue(psychicFatigue.value - psychicPoints.value);
      actor.update({
        system: {
          psychic: { psychicPoints: { value: Math.max(psychicPoints.value - psychicFatigue.value, 0) } }
        }
      });
    }
  }
  if (eliminateFatigue) {
    actor.update({
      system: { psychic: { psychicPoints: { value: psychicPoints.value - 1 } } }
    });
  }

  return psychicFatigue.value;
}

export async function psychicShieldsMaintenance(actor, revert) {
  const psychicShields = actor.system.combat.supernaturalShields.filter(
    s => s.system.type === 'psychic'
  );

  for (const psychicShield of psychicShields) {
    const psychic = psychicShield.getFlag(game.animabf.id, 'psychic');
    if (psychic?.overmantained) {
      if (psychic.maintainMax >= psychicShield.system.shieldPoints) {
        psychicShield.unsetFlag(game.animabf.id, 'psychic');
      } else {
        const damage = revert ? -5 : 5;
        actor.applyDamageSupernaturalShield(psychicShield._id, damage, false, undefined);
      }
    }
  }
}
