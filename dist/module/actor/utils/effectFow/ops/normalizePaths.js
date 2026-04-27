function normalizePath(path) {
  if (!path) return path;
  if (path.startsWith("system.")) return path;
  return `system.${path}`;
}
function normalizePaths(paths) {
  if (!Array.isArray(paths)) return [];
  const out = [];
  for (const p of paths) out.push(normalizePath(p));
  return [...new Set(out)];
}
export {
  normalizePath,
  normalizePaths
};
