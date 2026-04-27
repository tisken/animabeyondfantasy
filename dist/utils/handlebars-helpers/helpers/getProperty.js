const getPropertyHelper = {
  name: "getProperty",
  fn: function(obj, path, fallback = void 0) {
    if (!obj || typeof path !== "string") return fallback;
    try {
      const value = foundry.utils.getProperty(obj, path);
      return value !== void 0 ? value : fallback;
    } catch {
      return fallback;
    }
  }
};
export {
  getPropertyHelper
};
