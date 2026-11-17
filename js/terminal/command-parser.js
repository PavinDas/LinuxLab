import { SecurityLimits } from '../security/limits.js';

/**
 * CommandParser
 * Tokenizes and parses shell command lines deterministically without using eval() or shell exec.
 * Supports:
 * - Single quotes ('...'), double quotes ("...")
 * - Variable expansion ($VAR, ${VAR})
 * - Pipeline operators (|)
 * - Redirection operators (>, >>, <)
 * - Command separators and chaining (&&, ||, ;)
 * - Option and argument extraction
 */
export class CommandParser {
  /**
   * Split command line into chained commands and pipeline stages
   * @param {string} inputLine 
   * @param {Object} env 
   * @returns {{ chains: Array<{ condition: 'always'|'and'|'or', pipelines: Array<CommandAst> }> }}
   */
  static parse(inputLine, env = {}) {
    if (!inputLine || typeof inputLine !== 'string') {
      return { chains: [] };
    }

    const trimmed = inputLine.trim();
    if (trimmed.length > SecurityLimits.MAX_INPUT_LENGTH) {
      throw new Error(`Command exceeds maximum allowed length of ${SecurityLimits.MAX_INPUT_LENGTH} characters`);
    }

    const tokens = this.tokenize(trimmed, env);
    return this.buildAst(tokens);
  }

  /**
   * Tokenize shell input string
   */
  static tokenize(input, env = {}) {
    const tokens = [];
    let i = 0;
    const len = input.length;

    while (i < len) {
      const ch = input[i];

      // Whitespace
      if (/\s/.test(ch)) {
        i++;
        continue;
      }

      // Comment
      if (ch === '#') {
        break; // Ignore rest of line
      }

      // Operators
      if (ch === '&' && input[i + 1] === '&') {
        tokens.push({ type: 'AND', value: '&&' });
        i += 2;
        continue;
      }
      if (ch === '|' && input[i + 1] === '|') {
        tokens.push({ type: 'OR', value: '||' });
        i += 2;
        continue;
      }
      if (ch === '>') {
        if (input[i + 1] === '>') {
          tokens.push({ type: 'APPEND_OUT', value: '>>' });
          i += 2;
        } else {
          tokens.push({ type: 'REDIRECT_OUT', value: '>' });
          i++;
        }
        continue;
      }
      if (ch === '<') {
        tokens.push({ type: 'REDIRECT_IN', value: '<' });
        i++;
        continue;
      }
      if (ch === '|') {
        tokens.push({ type: 'PIPE', value: '|' });
        i++;
        continue;
      }
      if (ch === ';') {
        tokens.push({ type: 'SEMICOLON', value: ';' });
        i++;
        continue;
      }

      // Word or quoted string
      let word = '';
      while (i < len && !/\s/.test(input[i]) && !'|&;<>()'.includes(input[i])) {
        const char = input[i];
        if (char === '\\') {
          // Escaped char
          if (i + 1 < len) {
            word += input[i + 1];
            i += 2;
          } else {
            i++;
          }
        } else if (char === "'") {
          // Single-quoted: literal string, no expansion
          i++;
          while (i < len && input[i] !== "'") {
            word += input[i];
            i++;
          }
          if (i < len && input[i] === "'") i++; // Consume closing quote
        } else if (char === '"') {
          // Double-quoted: expands variables
          i++;
          while (i < len && input[i] !== '"') {
            if (input[i] === '\\' && i + 1 < len && '\"$\\'.includes(input[i + 1])) {
              word += input[i + 1];
              i += 2;
            } else if (input[i] === '$') {
              const { varValue, nextIdx } = this.expandVariable(input, i, env);
              word += varValue;
              i = nextIdx;
            } else {
              word += input[i];
              i++;
            }
          }
          if (i < len && input[i] === '"') i++; // Consume closing quote
        } else if (char === '$') {
          // Variable expansion outside quotes
          const { varValue, nextIdx } = this.expandVariable(input, i, env);
          word += varValue;
          i = nextIdx;
        } else {
          word += char;
          i++;
        }
      }

      if (word.length > 0) {
        tokens.push({ type: 'WORD', value: word });
      }
    }

    return tokens;
  }

  static expandVariable(input, startIndex, env) {
    let i = startIndex + 1; // Skip '$'
    if (i >= input.length) {
      return { varValue: '$', nextIdx: i };
    }

    // Special variable $?
    if (input[i] === '?') {
      return { varValue: String(env['?'] !== undefined ? env['?'] : '0'), nextIdx: i + 1 };
    }

    // ${VAR}
    if (input[i] === '{') {
      const close = input.indexOf('}', i);
      if (close !== -1) {
        const varName = input.substring(i + 1, close);
        const val = env[varName] !== undefined ? env[varName] : '';
        return { varValue: val, nextIdx: close + 1 };
      }
    }

    // $VAR
    let varName = '';
    while (i < input.length && /[a-zA-Z0-9_]/.test(input[i])) {
      varName += input[i];
      i++;
    }

    const val = env[varName] !== undefined ? env[varName] : '';
    return { varValue: val, nextIdx: i };
  }

  /**
   * Convert tokens into executable command chains and pipelines
   */
  static buildAst(tokens) {
    const chains = [];
    let currentCondition = 'always';
    let currentPipeline = [];
    let currentCommand = { name: '', args: [], redirects: [] };

    const flushCommand = () => {
      if (currentCommand.name) {
        currentPipeline.push(currentCommand);
        currentCommand = { name: '', args: [], redirects: [] };
      }
    };

    const flushPipeline = (nextCondition) => {
      flushCommand();
      if (currentPipeline.length > 0) {
        if (currentPipeline.length > SecurityLimits.MAX_PIPE_STAGES) {
          throw new Error(`Pipeline exceeds maximum allowed stages of ${SecurityLimits.MAX_PIPE_STAGES}`);
        }
        chains.push({ condition: currentCondition, pipeline: currentPipeline });
        currentPipeline = [];
      }
      currentCondition = nextCondition;
    };

    let i = 0;
    while (i < tokens.length) {
      const token = tokens[i];

      if (token.type === 'SEMICOLON') {
        flushPipeline('always');
      } else if (token.type === 'AND') {
        flushPipeline('and');
      } else if (token.type === 'OR') {
        flushPipeline('or');
      } else if (token.type === 'PIPE') {
        flushCommand();
      } else if (token.type === 'REDIRECT_OUT' || token.type === 'APPEND_OUT' || token.type === 'REDIRECT_IN') {
        const nextToken = tokens[i + 1];
        if (nextToken && nextToken.type === 'WORD') {
          currentCommand.redirects.push({
            type: token.type,
            target: nextToken.value
          });
          i++; // Skip the target token
        }
      } else if (token.type === 'WORD') {
        if (!currentCommand.name) {
          currentCommand.name = token.value;
        } else {
          currentCommand.args.push(token.value);
        }
      }
      i++;
    }

    flushPipeline('always');
    return { chains };
  }
}
