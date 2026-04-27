import { calculateAttributeModifier } from "../module/actor/utils/prepareActor/calculations/util/calculateAttributeModifier.js";
class FormulaEvaluator {
  // Whitelisted functions. Add your own here.
  static FUNCTIONS = {
    floor: (x) => Math.floor(x),
    ceil: (x) => Math.ceil(x),
    round: (x) => Math.round(x),
    abs: (x) => Math.abs(x),
    min: (...xs) => Math.min(...xs),
    max: (...xs) => Math.max(...xs),
    clamp: (v, min, max) => Math.min(Math.max(v, min), max),
    statMod: (x) => calculateAttributeModifier(x)
  };
  /**
   * Eval numeric formula using actor data paths + whitelisted functions.
   * Supports:
   *  - @paths like @characteristics.primaries.power.mod
   *  - functions like floor(...), ceil(...), clamp(...), etc.
   * No dice allowed here.
   *
   * @param {string} formula
   * @param {Actor|null} actor
   * @returns {number|null}
   */
  static evaluate(formula, actor = null) {
    const clean = (formula ?? "").trim();
    if (!clean) return null;
    if (/[dD]\d+/.test(clean)) {
      console.warn("FormulaEvaluator: dice are not allowed inside @formula:", clean);
      return null;
    }
    const ctx = actor?.system ? foundry.utils.duplicate(actor.system) : {};
    ctx.system = ctx;
    try {
      const withValues = clean.replace(/@([a-zA-Z0-9_.]+)/g, (_match, path) => {
        let value = foundry.utils.getProperty(ctx, path);
        if (value && typeof value === "object" && "value" in value) {
          value = value.value;
        }
        const num = Number(value);
        return Number.isFinite(num) ? String(num) : "0";
      });
      const resolved = this.#resolveFunctions(withValues);
      const compact = resolved.replace(/\s+/g, "");
      if (!/^[0-9+\-*/().,]*$/.test(compact)) {
        console.error("FormulaEvaluator: invalid chars after replace/resolve", {
          original: clean,
          withValues,
          resolved
        });
        return null;
      }
      const total = Roll.safeEval(resolved);
      return Number.isFinite(total) ? total : null;
    } catch (err) {
      console.error("FormulaEvaluator error evaluating formula:", {
        formula: clean,
        err
      });
      return null;
    }
  }
  // ---- internals ----
  static #resolveFunctions(expr) {
    let current = expr;
    for (let i = 0; i < 50; i++) {
      const found = this.#findNextFunctionCall(current);
      if (!found) break;
      const { name, startIndex, openParenIndex, closeParenIndex } = found;
      const fn = this.FUNCTIONS[name];
      if (!fn) {
        console.error("FormulaEvaluator: function not allowed:", name);
        throw new Error(`Function not allowed: ${name}`);
      }
      const inside = current.slice(openParenIndex + 1, closeParenIndex);
      const args = this.#splitArgs(inside).map((arg) => this.#evalArg(arg));
      const result = fn(...args);
      const num = Number(result);
      if (!Number.isFinite(num)) {
        console.error("FormulaEvaluator: function returned non-finite:", {
          name,
          args,
          result
        });
        throw new Error(`Function returned non-finite: ${name}`);
      }
      current = current.slice(0, startIndex) + String(num) + current.slice(closeParenIndex + 1);
    }
    return current;
  }
  static #evalArg(argExpr) {
    const trimmed = (argExpr ?? "").trim();
    if (!trimmed) return 0;
    const resolved = this.#resolveFunctions(trimmed);
    const compact = resolved.replace(/\s+/g, "");
    if (!/^[0-9+\-*/().,]*$/.test(compact)) {
      console.error("FormulaEvaluator: invalid chars in function arg:", {
        argExpr,
        resolved
      });
      throw new Error("Invalid chars in function arg");
    }
    const value = Roll.safeEval(resolved);
    const num = Number(value);
    if (!Number.isFinite(num)) {
      console.error("FormulaEvaluator: arg eval not finite:", {
        argExpr,
        resolved,
        value
      });
      throw new Error("Arg eval not finite");
    }
    return num;
  }
  static #splitArgs(s) {
    const args = [];
    let depth = 0;
    let last = 0;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === "(") depth++;
      else if (ch === ")") depth = Math.max(0, depth - 1);
      else if (ch === "," && depth === 0) {
        args.push(s.slice(last, i));
        last = i + 1;
      }
    }
    args.push(s.slice(last));
    return args.map((x) => x.trim()).filter((x) => x.length > 0);
  }
  static #findNextFunctionCall(s) {
    const re = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
    const match = re.exec(s);
    if (!match) return null;
    const name = match[1];
    const startIndex = match.index;
    const openParenIndex = re.lastIndex - 1;
    const closeParenIndex = this.#findMatchingParen(s, openParenIndex);
    if (closeParenIndex < 0) {
      console.error("FormulaEvaluator: unbalanced parentheses in:", s);
      throw new Error("Unbalanced parentheses");
    }
    return { name, startIndex, openParenIndex, closeParenIndex };
  }
  static #findMatchingParen(s, openIndex) {
    let depth = 0;
    for (let i = openIndex; i < s.length; i++) {
      const ch = s[i];
      if (ch === "(") depth++;
      else if (ch === ")") {
        depth--;
        if (depth === 0) return i;
      }
    }
    return -1;
  }
  /**
   * Extract @path dependencies from a formula.
   * Returns normalized paths prefixed with "system." (unless already "system.").
   *
   * Examples:
   *  "@characteristics.primaries.power.mod" -> "system.characteristics.primaries.power.mod"
   *  "@system.characteristics.primaries.power.mod" -> "system.characteristics.primaries.power.mod"
   *
   * @param {string} formula
   * @returns {string[]}
   */
  static getDependencies(formula) {
    const clean = (formula ?? "").trim();
    if (!clean) return [];
    const deps = /* @__PURE__ */ new Set();
    const re = /@([a-zA-Z0-9_.]+)/g;
    let m;
    while ((m = re.exec(clean)) !== null) {
      const raw = String(m[1] ?? "").trim();
      if (!raw) continue;
      const normalized = raw.startsWith("system.") ? raw : `system.${raw}`;
      deps.add(normalized);
    }
    return [...deps];
  }
}
export {
  FormulaEvaluator
};
