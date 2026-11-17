/**
 * SafeMath
 * A safe, deterministic recursive-descent math parser and evaluator.
 * Strictly avoids eval() and new Function().
 */
export class SafeMath {
  /**
   * Evaluate a mathematical string expression safely.
   * Supports: numbers, +, -, *, /, %, ^, unary -, parentheses.
   * @param {string} expr 
   * @returns {{ success: boolean, value?: number, error?: string }}
   */
  static evaluate(expr) {
    if (!expr || typeof expr !== 'string') {
      return { success: false, error: 'Empty expression' };
    }

    try {
      const tokens = this.tokenize(expr);
      if (tokens.length === 0) {
        return { success: false, error: 'No tokens found' };
      }
      const parser = new MathParser(tokens);
      const value = parser.parse();
      if (!Number.isFinite(value)) {
        return { success: false, error: 'Result is undefined or infinite' };
      }
      return { success: true, value };
    } catch (err) {
      return { success: false, error: err.message || 'Math evaluation error' };
    }
  }

  static tokenize(str) {
    const tokens = [];
    let i = 0;
    while (i < str.length) {
      const ch = str[i];
      if (/\s/.test(ch)) {
        i++;
        continue;
      }
      if (/[0-9.]/.test(ch)) {
        let numStr = '';
        let hasDot = false;
        while (i < str.length && /[0-9.]/.test(str[i])) {
          if (str[i] === '.') {
            if (hasDot) break;
            hasDot = true;
          }
          numStr += str[i];
          i++;
        }
        tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
        continue;
      }
      if ('+-*/%^()'.includes(ch)) {
        tokens.push({ type: 'OP', value: ch });
        i++;
        continue;
      }
      throw new Error(`Unexpected character: '${ch}'`);
    }
    return tokens;
  }
}

class MathParser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek() {
    return this.tokens[this.pos] || null;
  }

  consume() {
    return this.tokens[this.pos++];
  }

  parse() {
    const val = this.parseExpression();
    if (this.pos < this.tokens.length) {
      throw new Error(`Unexpected token at position ${this.pos}`);
    }
    return val;
  }

  // expr = term (( '+' | '-' ) term)*
  parseExpression() {
    let result = this.parseTerm();
    while (this.peek() && (this.peek().value === '+' || this.peek().value === '-')) {
      const op = this.consume().value;
      const right = this.parseTerm();
      if (op === '+') result += right;
      else result -= right;
    }
    return result;
  }

  // term = factor (( '*' | '/' | '%' ) factor)*
  parseTerm() {
    let result = this.parseExponent();
    while (this.peek() && (this.peek().value === '*' || this.peek().value === '/' || this.peek().value === '%')) {
      const op = this.consume().value;
      const right = this.parseExponent();
      if (op === '*') {
        result *= right;
      } else if (op === '/') {
        if (right === 0) throw new Error('Division by zero');
        result /= right;
      } else if (op === '%') {
        if (right === 0) throw new Error('Modulo by zero');
        result %= right;
      }
    }
    return result;
  }

  // exponent = unary ( '^' unary )*
  parseExponent() {
    let result = this.parseUnary();
    if (this.peek() && this.peek().value === '^') {
      this.consume();
      const right = this.parseExponent(); // right-associative
      result = Math.pow(result, right);
    }
    return result;
  }

  // unary = ('+' | '-')? primary
  parseUnary() {
    if (this.peek() && (this.peek().value === '+' || this.peek().value === '-')) {
      const op = this.consume().value;
      const operand = this.parseUnary();
      return op === '-' ? -operand : operand;
    }
    return this.parsePrimary();
  }

  // primary = NUMBER | '(' expr ')'
  parsePrimary() {
    const token = this.consume();
    if (!token) throw new Error('Unexpected end of expression');

    if (token.type === 'NUMBER') {
      return token.value;
    }

    if (token.value === '(') {
      const val = this.parseExpression();
      const closing = this.consume();
      if (!closing || closing.value !== ')') {
        throw new Error("Missing closing parenthesis ')'");
      }
      return val;
    }

    throw new Error(`Unexpected token: ${token.value}`);
  }
}
