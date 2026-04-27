import { collectEditablePaths } from "../../../module/actor/types/collectEditablePaths.js";
const collectEditablePathsHelper = {
  name: "collectEditablePaths",
  fn: function(defaultsObject) {
    if (!defaultsObject || typeof defaultsObject !== "object") return [];
    return collectEditablePaths(defaultsObject);
  }
};
export {
  collectEditablePathsHelper
};
