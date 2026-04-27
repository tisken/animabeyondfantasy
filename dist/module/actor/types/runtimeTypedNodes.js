import { TypeRegistry } from "./TypeRegistry.js";
function parseTypeMarker(str) {
  try {
    const obj = JSON.parse(str);
    if (!obj || typeof obj.type !== "string") return null;
    return obj;
  } catch {
    return null;
  }
}
function collectTypedPathsFromMarkers(root, basePath = "system", out = /* @__PURE__ */ new Map()) {
  if (!root || typeof root !== "object") return out;
  if (typeof root.__type === "string") {
    const marker = parseTypeMarker(root.__type);
    if (marker) out.set(basePath, marker.type);
  }
  for (const [k, v] of Object.entries(root)) {
    if (k === "__type") continue;
    collectTypedPathsFromMarkers(v, `${basePath}.${k}`, out);
  }
  return out;
}
function buildTypedNodes(actor, typedPaths) {
  actor.typedNodes = /* @__PURE__ */ new Map();
  for (const [path, type] of typedPaths.entries()) {
    actor.typedNodes.set(path, TypeRegistry.create(type, actor, path));
  }
  const extra = collectTypedPathsFromMarkers(actor._source?.system, "system");
  for (const [path, type] of extra.entries()) {
    if (actor.typedNodes.has(path)) continue;
    actor.typedNodes.set(path, TypeRegistry.create(type, actor, path));
  }
  actor.typedRepo = /* @__PURE__ */ new Map();
  for (const node of actor.typedNodes.values()) {
    const type = node.constructor.type;
    const key = node.key;
    if (!key) continue;
    if (!actor.typedRepo.has(type)) {
      actor.typedRepo.set(type, /* @__PURE__ */ new Map());
    }
    actor.typedRepo.get(type).set(key, node);
  }
}
export {
  buildTypedNodes
};
