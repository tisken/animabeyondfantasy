import { INITIAL_SPELL_CASTING_DATA } from '../../types/mystic/SpellItemConfig.js';
import { getUpdateObjectFromPath } from '../utils/prepareItems/util/getUpdateObjectFromPath';

/**
 * Evaluate whether a mystic character can cast a spell at a given grade.
 * @param {any} actor
 */
export function mysticCanCastEvaluate(actor, spell, spellGrade, casted = { prepared: false, innate: false }, override = false) {
  const spellCasting = {
    zeon: { ...INITIAL_SPELL_CASTING_DATA.zeon },
    canCast: { ...INITIAL_SPELL_CASTING_DATA.canCast },
    casted: { ...casted },
    override
  };

  spellCasting.zeon.accumulated = actor.system.mystic.zeon.accumulated ?? 0;

  if (override) return spellCasting;

  const spellGradeData = spell?.system?.grades?.[spellGrade];
  spellCasting.zeon.cost = spellGradeData?.zeon?.value ?? 0;

  if (!spell?.name) {
    spellCasting.casted.innate = false;
    spellCasting.casted.prepared = false;
    return spellCasting;
  }

  const preparedSpells = actor.system.mystic.preparedSpells ?? [];
  spellCasting.canCast.prepared =
    preparedSpells.find(
      ps => ps?.name === spell.name && ps?.system?.grade?.value === spellGrade
    )?.system?.prepared?.value ?? false;

  const spellVia = spell?.system?.via?.value;
  const innateMagic = actor.system.mystic.innateMagic;
  const innateVia = innateMagic?.via?.find(i => i?.name === spellVia);
  const innateMagicValue =
    innateMagic?.via?.length !== 0 && innateVia
      ? innateVia.system.final.value
      : innateMagic?.main?.final?.value ?? 0;

  spellCasting.canCast.innate = innateMagicValue >= spellCasting.zeon.cost;

  if (!spellCasting.canCast.innate) spellCasting.casted.innate = false;
  if (!spellCasting.canCast.prepared) spellCasting.casted.prepared = false;

  return spellCasting;
}

export function evaluateCast(spellCasting) {
  const { i18n } = game;
  const { canCast, casted, zeon, override } = spellCasting;
  if (override) return false;
  if (canCast.innate && casted.innate && canCast.prepared && casted.prepared) {
    ui.notifications.warn(i18n.localize('dialogs.spellCasting.warning.mustChoose'));
    return true;
  }
  if (canCast.innate && casted.innate) return;
  if (!canCast.innate && casted.innate) {
    ui.notifications.warn(i18n.localize('dialogs.spellCasting.warning.innateMagic'));
    return true;
  }
  if (canCast.prepared && casted.prepared) return false;
  if (!canCast.prepared && casted.prepared) {
    return ui.notifications.warn(i18n.localize('dialogs.spellCasting.warning.preparedSpell'));
  }
  if (zeon.accumulated < zeon.cost) {
    ui.notifications.warn(i18n.localize('dialogs.spellCasting.warning.zeonAccumulated'));
    return true;
  }
  return false;
}

export function mysticCast(actor, spellCasting, spellName, spellGrade) {
  const { zeon, casted, override } = spellCasting;
  if (override) return;
  if (casted.innate) return;
  if (casted.prepared) {
    deletePreparedSpell(actor, spellName, spellGrade);
  } else {
    consumeAccumulatedZeon(actor, zeon.cost);
  }
}

export function consumeAccumulatedZeon(actor, zeonCost) {
  actor.update({
    system: { mystic: { zeon: { accumulated: actor.system.mystic.zeon.accumulated - zeonCost } } }
  });
}

export async function consumeMaintainedZeon(actor, revert) {
  const { zeon, zeonMaintained } = actor.system.mystic;
  const updatedZeon = revert
    ? zeon.value + zeonMaintained.value
    : zeon.value - zeonMaintained.value;

  return actor.update({ system: { mystic: { zeon: { value: updatedZeon } } } });
}

export function deletePreparedSpell(actor, spellName, spellGrade) {
  const preparedSpellId = actor.system.mystic.preparedSpells.find(
    ps =>
      ps.name == spellName &&
      ps.system.grade.value == spellGrade &&
      ps.system.prepared.value == true
  )?._id;

  if (preparedSpellId !== undefined) {
    let items = actor.getPreparedSpells();
    items = items.filter(item => item._id !== preparedSpellId);
    const fieldPath = ['mystic', 'preparedSpells'];
    return actor.update({ system: getUpdateObjectFromPath(items, fieldPath) });
  }
}
