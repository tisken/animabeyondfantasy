import * as Ability from "./concreteTypes/Ability.js";
import * as AffectedByCharacteristicValue from "./concreteTypes/AffectedByCharacteristicValue.js";
import * as Characteristic from "./concreteTypes/Characteristic.js";
import * as NumericalValue from "./concreteTypes/NumericalValue.js";
import * as Resistence from "./concreteTypes/Resistence.js";
import * as SecondaryAbility from "./concreteTypes/SecondaryAbility.js";
import { TypeRegistry } from "./TypeRegistry.js";
(() => {
  const typeModules = {
    .../* @__PURE__ */ Object.assign({ "./concreteTypes/Ability.js": Ability, "./concreteTypes/AffectedByCharacteristicValue.js": AffectedByCharacteristicValue, "./concreteTypes/Characteristic.js": Characteristic, "./concreteTypes/NumericalValue.js": NumericalValue, "./concreteTypes/Resistence.js": Resistence, "./concreteTypes/SecondaryAbility.js": SecondaryAbility }),
    .../* @__PURE__ */ Object.assign({ "./concreteTypes/Ability.js": Ability, "./concreteTypes/AffectedByCharacteristicValue.js": AffectedByCharacteristicValue, "./concreteTypes/Characteristic.js": Characteristic, "./concreteTypes/NumericalValue.js": NumericalValue, "./concreteTypes/Resistence.js": Resistence, "./concreteTypes/SecondaryAbility.js": SecondaryAbility })
  };
  const registerCtor = (ctor, src) => {
    if (typeof ctor !== "function") return;
    const type = ctor.type;
    if (typeof type !== "string" || !type.length) return;
    TypeRegistry.register(ctor);
  };
  for (const p in typeModules) {
    const mod = typeModules[p];
    if (typeof mod.default === "function") registerCtor(mod.default);
    if (Array.isArray(mod.types)) mod.types.forEach((t) => registerCtor(t));
    for (const [key, value] of Object.entries(mod)) {
      if (typeof value === "function" && typeof value.type === "string") {
        registerCtor(value);
      }
    }
  }
  console.debug(`[ABF] TypeRegistry loaded (${TypeRegistry.size ?? "?"})`);
  return TypeRegistry;
})();
