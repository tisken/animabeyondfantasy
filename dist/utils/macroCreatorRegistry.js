import * as weaponAttack from "./macroCreators/weaponAttack.js";
const macroCreators = (() => {
  const modules = {
    .../* @__PURE__ */ Object.assign({ "./macroCreators/weaponAttack.js": weaponAttack }),
    .../* @__PURE__ */ Object.assign({ "./macroCreators/weaponAttack.js": weaponAttack })
  };
  const creators = {};
  const register = (dst, id, fn, src, label) => {
    if (!id || typeof fn !== "function") return;
    if (dst[id]) {
      console.warn(`[ABF] ${label}: override '${id}' from ${dst[id].__src} with ${src}`);
    }
    try {
      Object.defineProperty(fn, "__src", { value: src });
    } catch {
    }
    dst[id] = fn;
  };
  for (const p in modules) {
    const mod = modules[p];
    if (typeof mod.default === "function") {
      const ids = Array.isArray(mod.ids) ? mod.ids : typeof mod.id === "string" ? [mod.id] : null;
      if (ids) {
        for (const id of ids)
          register(creators, id, mod.default, `default@${p}`, "macroCreators");
      }
    }
    if (mod.creators && typeof mod.creators === "object") {
      for (const [id, fn] of Object.entries(mod.creators)) {
        register(creators, id, fn, `creators@${p}`, "macroCreators");
      }
    }
    for (const [key, value] of Object.entries(mod)) {
      if (typeof value === "function" && typeof value.id === "string") {
        register(creators, value.id, value, `${key}@${p}`, "macroCreators");
      }
    }
  }
  console.debug(
    `[ABF] macroCreators loaded (${Object.keys(creators).length})`,
    Object.keys(creators)
  );
  return creators;
})();
const macroExecutors = (() => {
  const modules = {
    .../* @__PURE__ */ Object.assign({ "./macroCreators/weaponAttack.js": weaponAttack }),
    .../* @__PURE__ */ Object.assign({ "./macroCreators/weaponAttack.js": weaponAttack })
  };
  const executors = {};
  const register = (id, fn, src) => {
    if (!id || typeof fn !== "function") return;
    if (executors[id]) {
      console.warn(
        `[ABF] macroExecutors: override '${id}' from ${executors[id].__src} with ${src}`
      );
    }
    try {
      Object.defineProperty(fn, "__src", { value: src });
    } catch {
    }
    executors[id] = fn;
  };
  for (const p in modules) {
    const mod = modules[p];
    if (typeof mod.executor === "function") {
      const ids = Array.isArray(mod.ids) ? mod.ids : typeof mod.id === "string" ? [mod.id] : null;
      if (ids) {
        for (const id of ids) register(id, mod.executor, `executor@${p}`);
      }
    }
    if (mod.executors && typeof mod.executors === "object") {
      for (const [id, fn] of Object.entries(mod.executors)) {
        register(id, fn, `executors@${p}`);
      }
    }
    for (const [key, value] of Object.entries(mod)) {
      if (typeof value === "function" && typeof value.execId === "string") {
        register(value.execId, value, `${key}@${p}`);
      }
    }
  }
  console.debug(
    `[ABF] macroExecutors loaded (${Object.keys(executors).length})`,
    Object.keys(executors)
  );
  return executors;
})();
export {
  macroCreators,
  macroExecutors
};
