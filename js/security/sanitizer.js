/**
 * Sanitizer & Safe DOM Utility
 * Strictly prevents XSS by avoiding unsafe innerHTML injection and validating inputs.
 */
export class Sanitizer {
  /**
   * Escape HTML entities
   * @param {*} input 
   * @returns {string}
   */
  static escapeHTML(input) {
    if (input === null || input === undefined) return '';
    const str = String(input);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Safe element creation helper
   * @param {string} tag 
   * @param {Object} attributes 
   * @param {Array|string|Node} children 
   * @returns {HTMLElement}
   */
  static createElement(tag, attributes = {}, children = []) {
    const el = document.createElement(tag);
    for (const [key, val] of Object.entries(attributes)) {
      if (key === 'className') {
        el.className = val;
      } else if (key === 'dataset' && typeof val === 'object') {
        for (const [dKey, dVal] of Object.entries(val)) {
          el.dataset[dKey] = dVal;
        }
      } else if (key.startsWith('on') && typeof val === 'function') {
        const eventName = key.slice(2).toLowerCase();
        el.addEventListener(eventName, val);
      } else if (key === 'style' && typeof val === 'object') {
        Object.assign(el.style, val);
      } else {
        el.setAttribute(key, String(val));
      }
    }

    if (children) {
      const childArray = Array.isArray(children) ? children : [children];
      for (const child of childArray) {
        if (child === null || child === undefined) continue;
        if (typeof child === 'string' || typeof child === 'number') {
          el.appendChild(document.createTextNode(String(child)));
        } else if (child instanceof Node) {
          el.appendChild(child);
        }
      }
    }
    return el;
  }

  /**
   * Validate that imported JSON structure doesn't pollute prototype
   * @param {string} jsonString 
   * @returns {Object}
   */
  static safeJSONParse(jsonString) {
    const parsed = JSON.parse(jsonString, (key, value) => {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return undefined; // Drop dangerous keys
      }
      return value;
    });
    return parsed;
  }
}
