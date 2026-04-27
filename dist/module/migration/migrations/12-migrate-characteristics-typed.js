import { Logger } from "../../../utils/log.js";
import "../../../utils/templatePaths.js";
import { TYPED_PATHS, TYPED_DEFAULTS } from "../../actor/types/typedTemplateIndex.js";
import { TypeRegistry } from "../../actor/types/TypeRegistry.js";
function toValueObj(node, fallback = 0) {
  if (node && typeof node === "object" && "value" in node) {
    return { value: Number(node.value) || 0 };
  }
  return { value: Number(node) || fallback };
}
function normalizeCharacteristicNode(node) {
  if (!node || typeof node !== "object") return node;
  if ("value" in node && !("base" in node)) {
    const base2 = toValueObj(node.value, 0);
    const special2 = toValueObj(0, 0);
    const final2 = toValueObj(base2.value + special2.value, 0);
    const mod2 = toValueObj(node.mod ?? 0, 0);
    return { ...node, base: base2, special: special2, final: final2, mod: mod2 };
  }
  const base = toValueObj(node.base ?? 0, 0);
  const special = toValueObj(node.special ?? 0, 0);
  const final = toValueObj(
    node.final ?? base.value + special.value,
    base.value + special.value
  );
  const mod = toValueObj(node.mod ?? 0, 0);
  const out = { ...node, base, special, final, mod };
  delete out.value;
  return out;
}
const MigrationXXMigrateTypedCharacteristics = {
  id: "migration_migrate-typed-characteristics",
  version: "2.2.0",
  order: 1,
  title: "Migrate typed characteristics",
  description: "Normalizes Characteristic nodes defined in the template (TYPED_PATHS) to the current typed shape.",
  filterActors(actor) {
    for (const [path, type] of TYPED_PATHS.entries()) {
      if (type !== "Characteristic") continue;
      const rel = path.replace(/^system\./, "");
      if (foundry.utils.getProperty(actor.system, rel) != null) return true;
    }
    return false;
  },
  updateActor(actor) {
    const ctor = TypeRegistry.get("Characteristic");
    if (!ctor) return actor;
    for (const [path, type] of TYPED_PATHS.entries()) {
      if (type !== "Characteristic") continue;
      const rel = path.replace(/^system\./, "");
      const current = foundry.utils.getProperty(actor.system, rel);
      if (!current || typeof current !== "object") continue;
      const normalizedLegacy = normalizeCharacteristicNode(current);
      const def = TYPED_DEFAULTS.get(path) ?? ctor.defaults();
      const merged = foundry.utils.mergeObject(def, normalizedLegacy, {
        inplace: false,
        insertKeys: true,
        insertValues: true,
        overwrite: true
      });
      delete merged.__type;
      ctor.pruneToDefaults(merged);
      foundry.utils.setProperty(actor.system, rel, merged);
    }
    Logger.log("Migrated Characteristic nodes (template-driven).");
    return actor;
  }
};
export {
  MigrationXXMigrateTypedCharacteristics
};
