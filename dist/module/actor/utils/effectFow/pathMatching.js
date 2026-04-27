function modPathToRegex(modPath) {
  const parts = String(modPath).split(".");
  const escaped = parts.map((seg) => {
    if (seg === "*") return "[^.]+";
    return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }).join("\\.");
  return new RegExp("^" + escaped + "(\\.|$)");
}
function pathAffects(modPath, depPath) {
  if (modPath === depPath) return true;
  if (!modPath.includes("*")) return depPath.startsWith(modPath + ".");
  return modPathToRegex(modPath).test(depPath);
}
export {
  pathAffects
};
