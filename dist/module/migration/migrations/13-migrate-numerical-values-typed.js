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
function normalizeNumericalValueNode(node) {
  if (!node || typeof node !== "object") return node;
  const out = { ...node };
  if ("value" in out && !("base" in out)) {
    const base2 = toValueObj(out.value, 0);
    const special2 = toValueObj(0, 0);
    const final2 = toValueObj(base2.value + special2.value, base2.value + special2.value);
    delete out.value;
    return {
      ...out,
      base: base2,
      special: special2,
      final: final2
    };
  }
  const base = toValueObj(out.base ?? 0, 0);
  const special = toValueObj(out.special ?? 0, 0);
  const final = toValueObj(
    out.final ?? base.value + special.value,
    base.value + special.value
  );
  const formula = typeof out.formula === "string" ? out.formula : "";
  const calculateBaseFromFormula = typeof out.calculateBaseFromFormula === "boolean" ? out.calculateBaseFromFormula : false;
  const normalized = {
    ...out,
    formula,
    calculateBaseFromFormula,
    base,
    special,
    final
  };
  delete normalized.value;
  return normalized;
}
const MigrationXXMigrateTypedNumericalValues = {
  id: "migration_migrate-typed-numerical-values",
  version: "2.2.0",
  order: 2,
  title: "Migrate typed NumericalValue",
  description: "Normalizes NumericalValue nodes defined in the template (TYPED_PATHS) to the current typed shape (adds formula fields).",
  filterActors(actor) {
    for (const [path, type] of TYPED_PATHS.entries()) {
      if (type !== "NumericalValue") continue;
      const rel = path.replace(/^system\./, "");
      if (foundry.utils.getProperty(actor.system, rel) != null) return true;
    }
    return false;
  },
  updateActor(actor) {
    const ctor = TypeRegistry.get("NumericalValue");
    if (!ctor) return actor;
    for (const [path, type] of TYPED_PATHS.entries()) {
      if (type !== "NumericalValue") continue;
      const rel = path.replace(/^system\./, "");
      const current = foundry.utils.getProperty(actor.system, rel);
      if (!current || typeof current !== "object") continue;
      const normalizedLegacy = normalizeNumericalValueNode(current);
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
    Logger.log("Migrated NumericalValue nodes (template-driven).");
    return actor;
  }
};
export {
  MigrationXXMigrateTypedNumericalValues
};
