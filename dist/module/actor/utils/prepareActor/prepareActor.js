import { prepareItems } from "../prepareItems/prepareItems.js";
import { mutateWeaponsData } from "./calculations/items/weapon/mutateWeaponsData.js";
import { mutateTotalArmor } from "./calculations/actor/mutateTotalArmor.js";
import { mutateAmmoData } from "./calculations/items/ammo/mutateAmmoData.js";
import { mutateArmorsData } from "./calculations/items/armor/mutateArmorsData.js";
import { mutateNaturalPenaltyUnreduced, mutateNaturalPenaltyReduction, mutateNaturalPenaltyFinal } from "./calculations/actor/modifiers/mutateNaturalPenalty.js";
import { mutatePhysicalModifier } from "./calculations/actor/modifiers/mutatePhysicalModifier.js";
import { mutatePerceptionPenalty } from "./calculations/actor/modifiers/mutatePerceptionPenalty.js";
import { mutateAllActionsModifier } from "./calculations/actor/modifiers/mutateAllActionsModifier.js";
import { mutateMovementType, mutateMovementDistances } from "./calculations/actor/general/mutateMovementType.js";
import { mutateActMain, mutateActVias, mutateInnateMagicMain, mutateInnateMagicVias, mutateMagicProjection, mutateMagicProjectionOffensive, mutateMagicProjectionDefensive, mutateZeonMaintenance, mutateSummoningSummon, mutateSummoningBanish, mutateSummoningBind, mutateSummoningControl, mutatePreparedSpells } from "./calculations/actor/mystic/mutateMysticData.js";
import { mutatePsychicProjection, mutatePsychicProjectionOffensive, mutatePsychicProjectionDefensive, mutatePsychicPotential } from "./calculations/actor/psychic/mutatePsychicData.js";
import { mutateKiAccumulationStrength, mutateKiAccumulationAgility, mutateKiAccumulationDexterity, mutateKiAccumulationConstitution, mutateKiAccumulationWillPower, mutateKiAccumulationPower } from "./calculations/actor/domine/mutateDomineData.js";
import { mutateInitiative } from "./calculations/actor/mutateInitiative.js";
import { mutateRegenerationType } from "./calculations/actor/general/mutateRegenerationType.js";
import { mutatePresence } from "./calculations/actor/mutatePresence.js";
import { mutateTotalLevel } from "./calculations/actor/mutateTotalLevel.js";
import { mutatePhysicalResistanceBase, mutatePhysicalResistanceFinal, mutateDiseaseResistanceBase, mutateDiseaseResistanceFinal, mutatePoisonResistanceBase, mutatePoisonResistanceFinal, mutateMagicResistanceBase, mutateMagicResistanceFinal, mutatePsychicResistanceBase, mutatePsychicResistanceFinal } from "./calculations/actor/mutateResistances.js";
import { runEffectFlow } from "../effectFow/runFlow.js";
import { inflateSystemFromTypeMarkers } from "../../types/inflateSystemFromTypeMarkers.js";
const DERIVED_DATA_FUNCTIONS = [
  mutateTotalLevel,
  mutatePresence,
  // Resistances — base must run before final (final depends on base)
  mutatePhysicalResistanceBase,
  mutatePhysicalResistanceFinal,
  mutateDiseaseResistanceBase,
  mutateDiseaseResistanceFinal,
  mutatePoisonResistanceBase,
  mutatePoisonResistanceFinal,
  mutateMagicResistanceBase,
  mutateMagicResistanceFinal,
  mutatePsychicResistanceBase,
  mutatePsychicResistanceFinal,
  // mutatePrimaryModifiers,
  mutateRegenerationType,
  mutateAllActionsModifier,
  mutateArmorsData,
  mutateTotalArmor,
  // Natural penalty — unreduced/reduction before final
  mutateNaturalPenaltyUnreduced,
  mutateNaturalPenaltyReduction,
  mutateNaturalPenaltyFinal,
  mutatePhysicalModifier,
  mutatePerceptionPenalty,
  // mutateCombatData,
  mutateMovementType,
  mutateMovementDistances,
  //mutateSecondariesData,
  mutateAmmoData,
  mutateWeaponsData,
  mutateInitiative,
  // Mystic — ACT before InnateMagic (InnateMagic depends on ACT final)
  mutateActMain,
  mutateActVias,
  mutateInnateMagicMain,
  mutateInnateMagicVias,
  mutateMagicProjection,
  mutateMagicProjectionOffensive,
  mutateMagicProjectionDefensive,
  mutateZeonMaintenance,
  mutateSummoningSummon,
  mutateSummoningBanish,
  mutateSummoningBind,
  mutateSummoningControl,
  mutatePreparedSpells,
  // Psychic
  mutatePsychicProjection,
  mutatePsychicProjectionOffensive,
  mutatePsychicProjectionDefensive,
  mutatePsychicPotential,
  // Domine — ki accumulations
  mutateKiAccumulationStrength,
  mutateKiAccumulationAgility,
  mutateKiAccumulationDexterity,
  mutateKiAccumulationConstitution,
  mutateKiAccumulationWillPower,
  mutateKiAccumulationPower
];
const prepareActor = async (actor) => {
  if (actor.__abfPreparePromise) {
    await actor.__abfPreparePromise;
  }
  actor.__abfPreparePromise = (async () => {
    const baselineSystem = foundry.utils.duplicate(actor._source.system);
    foundry.utils.mergeObject(actor.system, baselineSystem, {
      overwrite: true,
      insertKeys: true,
      insertValues: true
    });
    actor.system = inflateSystemFromTypeMarkers(actor.system);
    await prepareItems(actor);
    await runEffectFlow(actor, { derivedFns: DERIVED_DATA_FUNCTIONS });
    actor.system.general.description.enriched = await (foundry.applications?.ux?.TextEditor?.implementation ?? TextEditor).enrichHTML(
      actor.system.general.description.value,
      { async: true }
    );
    for (const key of Object.keys(actor.system.ui.contractibleItems ?? {})) {
      if (typeof actor.system.ui.contractibleItems[key] === "string") {
        actor.system.ui.contractibleItems[key] = actor.system.ui.contractibleItems[key] === "true";
      }
    }
  })();
  try {
    await actor.__abfPreparePromise;
  } finally {
    actor.__abfPreparePromise = null;
  }
};
export {
  prepareActor
};
