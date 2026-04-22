import { ABFItems } from '../../items/ABFItems';
import { openSimpleInputDialog } from '../../utils/dialogs/openSimpleInputDialog';
import { mutateWeapon } from '../../items/utils/prepareItem/items/mutateWeapon';
import { ABFItemConfigFactory } from '../ABFItemConfig';

// Re-export constants from canonical TS source
export {
  WeaponEquippedHandType,
  WeaponKnowledgeType,
  WeaponCritic,
  NoneWeaponCritic,
  DamageType,
  WeaponManageabilityType,
  WeaponShotType,
  WeaponSize,
  WeaponSizeProportion
} from '../../data/combat-constants';

/**
 * Initial data for a new weapon. Used to infer the type of the data inside `weapon.system`
 * @readonly
 */
export const INITIAL_WEAPON_DATA = {
  equipped: { value: false },
  isShield: { value: false },
  special: { value: '' },
  hasOwnStr: { value: false },
  ignoreArmor: { value: false },
  reducedArmor: {
    base: { value: 0 },
    special: { value: 0 },
    final: { value: 0 }
  },
  integrity: {
    base: { value: 0 },
    final: { value: 0 }
  },
  breaking: {
    base: { value: 0 },
    final: { value: 0 }
  },
  attack: {
    base: { value: 0 },
    special: { value: 0 },
    final: { value: 0 }
  },
  block: {
    base: { value: 0 },
    special: { value: 0 },
    final: { value: 0 }
  },
  damage: {
    base: { value: 0 },
    special: { value: 0 },
    final: { value: 0 },
    formula: { value: '' },
    applyQualityInFormula: { value: false }
  },
  initiative: {
    base: { value: 0 },
    special: { value: 0 },
    final: { value: 0 }
  },
  presence: {
    base: { value: 0 },
    final: { value: 0 }
  },
  size: { value: WeaponSize.MEDIUM },
  sizeProportion: { value: WeaponSizeProportion.NORMAL },
  strRequired: {
    oneHand: {
      base: { value: 0 },
      final: { value: 0 }
    },
    twoHands: {
      base: { value: 0 },
      final: { value: 0 }
    }
  },
  quality: { value: 0 },
  oneOrTwoHanded: { value: WeaponEquippedHandType.ONE_HANDED },
  knowledgeType: { value: WeaponKnowledgeType.KNOWN },
  manageabilityType: { value: WeaponManageabilityType.ONE_HAND },
  shotType: { value: WeaponShotType.SHOT },
  isRanged: { value: false },
  cadence: { value: '' },
  range: {
    base: { value: 0 },
    final: { value: 0 }
  },
  reload: {
    base: { value: 0 },
    final: { value: 0 }
  },
  weaponStrength: {
    base: { value: 0 },
    final: { value: 0 }
  },
  critic: {
    primary: { value: WeaponCritic.CUT },
    secondary: { value: NoneWeaponCritic.NONE }
  },
  useCustomFormula: { value: false },
  hotbarMacroCreatorId: 'weapon.attack'
};

/** @type {import("../Items").WeaponItemConfig} */
export const WeaponItemConfig = ABFItemConfigFactory({
  type: ABFItems.WEAPON,
  isInternal: false,
  hasSheet: true,
  defaultValue: INITIAL_WEAPON_DATA,
  fieldPath: ['combat', 'weapons'],
  selectors: {
    addItemButtonSelector: 'add-weapon',
    containerSelector: '#weapons-context-menu-container',
    rowSelector: '.weapon-row'
  },
  onCreate: async actor => {
    const { i18n } = game;

    const name = await openSimpleInputDialog({
      content: i18n.localize('dialogs.items.weapons.content')
    });

    const itemData = {
      name,
      type: ABFItems.WEAPON,
      system: INITIAL_WEAPON_DATA
    };

    await actor.createItem(itemData);
  },
  onAttach: async (actor, weapon) => {
    if (
      weapon.system.isRanged &&
      typeof weapon.system.ammoId === 'string' &&
      !!weapon.system.ammoId
    ) {
      const {
        system: {
          combat: { ammo }
        }
      } = actor;

      weapon.system.ammo = ammo.find(i => i._id === weapon.system.ammoId);
    }
  },
  prepareItem(data) {
    mutateWeapon(data);
  }
});
