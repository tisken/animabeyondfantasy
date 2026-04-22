import { executeMacro } from '../../utils/functions/executeMacro';
import { ABFSettingsKeys } from '../../../utils/registerSettings';
import { calculateDamage } from '../../combat/utils/calculateDamage';
import { roundTo5Multiples } from '../../combat/utils/roundTo5Multiples';

export function applyDamage(actor, damage) {
  const newLifePoints =
    actor.system.characteristics.secondaries.lifePoints.value - damage;
  actor.update({
    system: { characteristics: { secondaries: { lifePoints: { value: newLifePoints } } } }
  });
}

export function applyFatigue(actor, fatigueUsed) {
  const newFatigue =
    actor.system.characteristics.secondaries.fatigue.value - fatigueUsed;
  actor.update({
    system: { characteristics: { secondaries: { fatigue: { value: newFatigue } } } }
  });
}

export function accumulateDefenses(actor, keepAccumulating) {
  const defensesCounter = actor.getFlag(game.animabf.id, 'defensesCounter') || {
    accumulated: 0,
    keepAccumulating
  };
  const newDefensesCounter = defensesCounter.accumulated + 1;
  if (keepAccumulating) {
    actor.setFlag(game.animabf.id, 'defensesCounter', {
      accumulated: newDefensesCounter,
      keepAccumulating
    });
  } else {
    actor.setFlag(game.animabf.id, 'defensesCounter.keepAccumulating', keepAccumulating);
  }
}

export function resetDefensesCounter(actor) {
  const defensesCounter = actor.getFlag(game.animabf.id, 'defensesCounter');
  if (defensesCounter === undefined) {
    actor.setFlag(game.animabf.id, 'defensesCounter', {
      accumulated: 0,
      keepAccumulating: true
    });
  } else {
    actor.setFlag(game.animabf.id, 'defensesCounter.accumulated', 0);
  }
}

export async function newSupernaturalShield(actor, shieldData) {
  const itemCreateData =
    typeof shieldData?.toItemCreateData === 'function'
      ? shieldData.toItemCreateData()
      : shieldData;

  const [item] = await actor.createEmbeddedDocuments('Item', [itemCreateData]);
  const args = { thisActor: actor, newShield: true, shieldId: item._id };
  executeMacro(itemCreateData.name, args);
  return item._id;
}

export async function deleteSupernaturalShield(actor, supShieldId) {
  const supShield = actor.getItem(supShieldId);
  if (supShield) {
    await actor.deleteItem(supShieldId);
    executeMacro(supShield.name ?? undefined, {
      thisActor: actor,
      newShield: false,
      shieldId: supShieldId
    });
  }
}

export async function applyDamageSupernaturalShield(actor, supShieldId, damage, dobleDamage, newCombatResult) {
  const supShield = actor.getItem(supShieldId);
  const shieldValue = supShield?.system.shieldPoints;
  const newShieldPoints = dobleDamage ? shieldValue - damage * 2 : shieldValue - damage;
  if (newShieldPoints > 0) {
    actor.updateItem({ id: supShieldId, system: { shieldPoints: newShieldPoints } });
  } else {
    deleteSupernaturalShield(actor, supShieldId);
    if (newShieldPoints < 0 && newCombatResult) {
      const needToRound = game.settings.get(game.animabf.id, ABFSettingsKeys.ROUND_DAMAGE_IN_MULTIPLES_OF_5);
      const result = calculateDamage(
        newCombatResult.attack, 0, newCombatResult.at,
        Math.abs(newShieldPoints), newCombatResult.halvedAbsorption
      );
      const breakingDamage = needToRound ? roundTo5Multiples(result) : result;
      applyDamage(actor, breakingDamage);
    }
  }
}
