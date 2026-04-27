import "./typeRegistryLoader.js";
import { INITIAL_ACTOR_DATA } from "../constants.js";
import { collectTypedFromTemplate } from "./collectTypedFromTemplate.js";
const { typedPaths: TYPED_PATHS, typedDefaults: TYPED_DEFAULTS } = collectTypedFromTemplate(INITIAL_ACTOR_DATA, "system");
export {
  TYPED_DEFAULTS,
  TYPED_PATHS
};
