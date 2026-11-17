/**
 * Virtual Permissions Manager
 * Simulates standard Linux POSIX permissions (numeric and symbolic modes,
 * owner/group/others, SUID/SGID/sticky bits, access checks).
 */
export class VirtualPermissions {
  /**
   * Convert octal permission mode to standard 10-character string (e.g. -rwxr-xr-x)
   * @param {number} mode Numeric mode, e.g. 0o755
   * @param {boolean} isDir Whether target is directory
   * @param {boolean} suid SUID flag
   * @param {boolean} sgid SGID flag
   * @param {boolean} sticky Sticky bit flag
   * @returns {string}
   */
  static modeToString(mode = 0o644, isDir = false, suid = false, sgid = false, sticky = false) {
    const typeChar = isDir ? 'd' : '-';
    
    // User bits
    const ur = (mode & 0o400) ? 'r' : '-';
    const uw = (mode & 0o200) ? 'w' : '-';
    let ux = (mode & 0o100) ? 'x' : '-';
    if (suid) ux = (ux === 'x') ? 's' : 'S';

    // Group bits
    const gr = (mode & 0o040) ? 'r' : '-';
    const gw = (mode & 0o020) ? 'w' : '-';
    let gx = (mode & 0o010) ? 'x' : '-';
    if (sgid) gx = (gx === 'x') ? 's' : 'S';

    // Other bits
    const or_ = (mode & 0o004) ? 'r' : '-';
    const ow = (mode & 0o002) ? 'w' : '-';
    let ox = (mode & 0o001) ? 'x' : '-';
    if (sticky) ox = (ox === 'x') ? 't' : 'T';

    return `${typeChar}${ur}${uw}${ux}${gr}${gw}${gx}${or_}${ow}${ox}`;
  }

  /**
   * Parse numeric octal or symbolic mode string into new mode number.
   * e.g. "755", "0755", "+x", "u=rwx,go=rx", "u+s"
   */
  static parseMode(modeStr, currentMode = 0o644) {
    if (!modeStr) return currentMode;
    const str = String(modeStr).trim();

    // Check octal mode
    if (/^[0-7]{3,4}$/.test(str)) {
      return parseInt(str, 8);
    }

    // Symbolic mode parsing (simple standard cases)
    let newMode = currentMode;
    const clauses = str.split(',');

    for (const clause of clauses) {
      const match = clause.match(/^([ugoa]*)([\+\-\=])([rwxXst]+)$/);
      if (!match) continue;

      let [, who, op, perms] = match;
      if (!who || who === 'a') who = 'ugo';

      let mask = 0;
      if (perms.includes('r')) mask |= 0o4;
      if (perms.includes('w')) mask |= 0o2;
      if (perms.includes('x') || perms.includes('X')) mask |= 0o1;

      let fullMask = 0;
      if (who.includes('u')) fullMask |= (mask << 6);
      if (who.includes('g')) fullMask |= (mask << 3);
      if (who.includes('o')) fullMask |= mask;

      if (op === '+') {
        newMode |= fullMask;
      } else if (op === '-') {
        newMode &= ~fullMask;
      } else if (op === '=') {
        let clearMask = 0;
        if (who.includes('u')) clearMask |= 0o700;
        if (who.includes('g')) clearMask |= 0o070;
        if (who.includes('o')) clearMask |= 0o007;
        newMode = (newMode & ~clearMask) | fullMask;
      }
    }

    return newMode;
  }

  /**
   * Check if user has permission to read/write/execute node
   * @param {Object} node VFS node
   * @param {Object} user User object from VirtualUsers
   * @param {'r'|'w'|'x'} accessType
   * @returns {boolean}
   */
  static checkAccess(node, user, accessType) {
    if (!node || !user) return false;

    // Root user has full read/write, and execute if any execute bit is set
    if (user.uid === 0) {
      if (accessType === 'x') {
        // Root can execute any file if at least one execute bit is set or if it is a directory
        if (node.type === 'dir') return true;
        return (node.permissions & 0o111) !== 0;
      }
      return true;
    }

    const mode = node.permissions || 0o644;
    let bit = 0;
    if (accessType === 'r') bit = 4;
    else if (accessType === 'w') bit = 2;
    else if (accessType === 'x') bit = 1;

    // Check if user is owner
    if (node.owner === user.name || node.owner === user.uid) {
      return (mode & (bit << 6)) !== 0;
    }

    // Check group
    const userGroups = user.groups || [];
    if (userGroups.includes(node.group)) {
      return (mode & (bit << 3)) !== 0;
    }

    // Check others
    return (mode & bit) !== 0;
  }
}
