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
function inflateNode(node) {
  const marker = parseTypeMarker(node.__type);
  if (!marker) return node;
  const { type, ...overrides } = marker;
  const ctor = TypeRegistry.get(type);
  if (!ctor) throw new Error(`Unknown type: ${type}`);
  const { __type, ...rest } = node;
  const out = ctor.inflate(overrides, rest);
  return out;
}
function inflateSystemFromTypeMarkers(root) {
  ensureTypesRegistered();
  const seen = /* @__PURE__ */ new WeakSet();
  const walk = (obj) => {
    if (!obj || typeof obj !== "object") return obj;
    if (seen.has(obj)) return obj;
    seen.add(obj);
    if (typeof obj.__type === "string") {
      return walk(inflateNode(obj));
    }
    for (const [k, v] of Object.entries(obj)) {
      const walked = walk(v);
      if (walked !== v) {
        try {
          obj[k] = walked;
        } catch {
        }
      }
    }
    return obj;
  };
  return walk(root);
}
function ensureTypesRegistered() {
  if (TypeRegistry.size === 0) {
    throw new Error(
      "[ABF] TypeRegistry is empty. typeRegistryLoader.js was not executed."
    );
  }
}
export {
  inflateSystemFromTypeMarkers
};
