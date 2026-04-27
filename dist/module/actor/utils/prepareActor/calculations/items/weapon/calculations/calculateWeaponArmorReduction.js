import "../../../../../../../types/combat/WeaponItemConfig.js";
const calculateWeaponArmorReduction = (weapon) => {
  let reducedArmor = Math.max(
    weapon.system.reducedArmor.base.value + weapon.system.reducedArmor.special.value,
    0
  );
  return reducedArmor;
};
export {
  calculateWeaponArmorReduction
};
