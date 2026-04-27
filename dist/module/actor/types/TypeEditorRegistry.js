import { GenericBaseTypeEditor } from "./GenericBaseTypeEditor.js";
class TypeEditorRegistry {
  static #byType = /* @__PURE__ */ new Map();
  /**
   * Register a custom editor for a BaseType
   * @param {string} type
   * @param {typeof FormApplication} editorCtor
   */
  static register(type, editorCtor) {
    this.#byType.set(type, editorCtor);
  }
  /**
   * Create an editor for a given type
   * @param {string} type
   * @param {Actor} actor
   * @param {{ path: string }}
   */
  static create(type, actor, { path }) {
    const Ctor = this.#byType.get(type) ?? GenericBaseTypeEditor;
    return new Ctor(actor, { type, path });
  }
}
export {
  TypeEditorRegistry
};
