import { SecurityLimits } from './limits.js';
import { SYSTEM_INFO } from '../core/system-info.js';

/**
 * PathValidator
 * Ensures all virtual paths are strictly contained within virtual root "/"
 * and handles relative path resolution, canonical normalization, and depth checking.
 */
export class PathValidator {
  /**
   * Normalize an absolute or relative path against a current working directory.
   * Resolves '.', '..', redundant slashes, and ensures boundary safety.
   *
   * @param {string} rawPath The path provided by user or command.
   * @param {string} cwd The current working directory.
   * @param {string} homePath The active user's home directory.
   * @returns {string} Normalized absolute virtual path.
   */
  static normalize(rawPath, cwd = '/', homePath = SYSTEM_INFO.home) {
    if (typeof rawPath !== 'string') {
      return '/';
    }

    let trimmed = rawPath.trim();
    if (trimmed.length > SecurityLimits.MAX_PATH_LENGTH) {
      trimmed = trimmed.substring(0, SecurityLimits.MAX_PATH_LENGTH);
    }

    // Expand the active user's home directory.
    if (trimmed === '~' || trimmed.startsWith('~/')) {
      trimmed = trimmed === '~' ? homePath : `${homePath}/${trimmed.slice(2)}`;
    }

    // Determine base: if path starts with '/', it's absolute; otherwise relative to cwd
    const isAbsolute = trimmed.startsWith('/');
    const basePath = isAbsolute ? '/' : (cwd.startsWith('/') ? cwd : '/' + cwd);
    
    // Combine base and path
    const combined = isAbsolute ? trimmed : (basePath === '/' ? '/' + trimmed : basePath + '/' + trimmed);

    // Split on slashes and resolve segments
    const segments = combined.split('/');
    const resolved = [];

    for (const segment of segments) {
      if (!segment || segment === '.') {
        continue;
      }
      if (segment === '..') {
        if (resolved.length > 0) {
          resolved.pop();
        }
        // At root, '..' remains at root
      } else {
        // Enforce max depth
        if (resolved.length < SecurityLimits.MAX_PATH_DEPTH) {
          resolved.push(segment);
        }
      }
    }

    const result = '/' + resolved.join('/');
    return result;
  }

  /**
   * Split path into dirname and basename
   * @param {string} path 
   * @returns {{ dirname: string, basename: string }}
   */
  static split(path) {
    const norm = this.normalize(path);
    if (norm === '/') {
      return { dirname: '/', basename: '' };
    }
    const idx = norm.lastIndexOf('/');
    const dirname = idx === 0 ? '/' : norm.substring(0, idx);
    const basename = norm.substring(idx + 1);
    return { dirname, basename };
  }

  /**
   * Validate a single path segment with no separators or control characters.
   * @param {string} name 
   * @returns {boolean}
   */
  static isValidFilename(name) {
    if (!name || typeof name !== 'string') return false;
    if (/[\/\\\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/.test(name)) return false;
    if (name === '.' || name === '..') return false;
    if (!name.trim()) return false;
    return name.length <= SecurityLimits.MAX_FILENAME_LENGTH;
  }
}
