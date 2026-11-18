/**
 * CommandRegistry
 * Central catalog and dispatcher for all CyberLinux commands.
 */
export class CommandRegistry {
  constructor() {
    this.commands = new Map();
    this.aliases = new Map();
  }

  /**
   * Register a command definition
   * @param {Object} def Command specification
   */
  register(def) {
    if (!def.name || typeof def.execute !== 'function') {
      throw new Error(`Invalid command registration: missing name or execute handler for '${def.name}'`);
    }

    const standardDef = {
      name: def.name,
      aliases: def.aliases || [],
      category: def.category || 'Fundamentals',
      description: def.description || '',
      syntax: def.syntax || def.name,
      options: def.options || [],
      practicalUse: def.practicalUse || '',
      example: def.example || def.name,
      expectedOutput: def.expectedOutput || '',
      isSimulation: def.isSimulation !== undefined ? def.isSimulation : false,
      execute: def.execute
    };

    this.commands.set(def.name, standardDef);

    if (Array.isArray(def.aliases)) {
      for (const alias of def.aliases) {
        this.aliases.set(alias, def.name);
      }
    }
  }

  get(name) {
    if (!name) return null;
    const resolvedName = this.aliases.get(name) || name;
    return this.commands.get(resolvedName) || null;
  }

  has(name) {
    return this.commands.has(name) || this.aliases.has(name);
  }

  getAll() {
    return Array.from(this.commands.values());
  }

  getCategories() {
    const cats = new Set();
    for (const cmd of this.commands.values()) {
      cats.add(cmd.category);
    }
    return Array.from(cats);
  }

  search(query = '', category = 'All') {
    const q = query.toLowerCase().trim();
    return this.getAll().filter(cmd => {
      const matchesCat = (category === 'All' || cmd.category === category);
      if (!matchesCat) return false;
      if (!q) return true;
      // List the command only if the command name (or its aliases) contains the searched keyword
      const nameMatch = cmd.name.toLowerCase().includes(q);
      const aliasMatch = Array.isArray(cmd.aliases) && cmd.aliases.some(a => a.toLowerCase().includes(q));
      return nameMatch || aliasMatch;
    });
  }
}
