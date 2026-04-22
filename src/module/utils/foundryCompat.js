/**
 * Foundry v13+ compatibility helpers.
 * @see https://foundryvtt.com/kb/
 */

/** @returns {any} */
export function getTextEditor() {
  return foundry.applications?.ux?.TextEditor?.implementation ?? globalThis.TextEditor;
}

/** @returns {any} */
export function getContextMenu() {
  return foundry.applications?.ux?.ContextMenu?.implementation ?? globalThis.ContextMenu;
}

/** @returns {boolean} */
export function isV13Plus() {
  return !!foundry.applications?.ux?.TextEditor?.implementation;
}

/**
 * @param {string} content
 * @param {object} [options]
 * @returns {Promise<string>}
 */
export async function enrichHTML(content, options = {}) {
  const TE = getTextEditor();
  return TE.enrichHTML(content, { async: true, ...options });
}

/**
 * @param {HTMLElement|object} element
 * @param {string} selector
 * @param {Array} menuItems
 * @param {object} [extraOptions]
 * @returns {any}
 */
export function createContextMenu(element, selector, menuItems, extraOptions = {}) {
  const CM = getContextMenu();
  const el = element instanceof HTMLElement ? element : element[0] ?? element;
  const opts = isV13Plus() ? { jQuery: false, ...extraOptions } : extraOptions;
  return new CM(el, selector, menuItems, opts);
}
