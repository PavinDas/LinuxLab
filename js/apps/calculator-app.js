import { Sanitizer } from '../security/sanitizer.js';
import { SafeMath } from '../security/safe-math.js';

/**
 * CalculatorApp (GNOME Calculator style)
 * Safe mathematical calculator powered strictly by SafeMath (Zero eval).
 */
export class CalculatorApp {
  constructor() {
    this.expression = '';
    this.lastResult = '';
    this.hasEvaluated = false;
  }

  createUI() {
    this.container = Sanitizer.createElement('div', { className: 'calculator-container' });

    // Display
    const displayArea = Sanitizer.createElement('div', { className: 'calc-display' });
    this.historyEl = Sanitizer.createElement('div', { className: 'calc-history' }, '');
    this.inputEl = Sanitizer.createElement('div', { className: 'calc-input' }, '0');

    displayArea.appendChild(this.historyEl);
    displayArea.appendChild(this.inputEl);

    // Keypad
    const keypad = Sanitizer.createElement('div', { className: 'calc-keypad' });
    const buttons = [
      ['C', 'calc-btn-action', () => this.clearAll()],
      ['CE', 'calc-btn-action', () => this.clearEntry()],
      ['(', 'calc-btn-op', () => this.appendChar('(')],
      [')', 'calc-btn-op', () => this.appendChar(')')],
      ['^', 'calc-btn-op', () => this.appendChar('^')],

      ['7', 'calc-btn-num', () => this.appendChar('7')],
      ['8', 'calc-btn-num', () => this.appendChar('8')],
      ['9', 'calc-btn-num', () => this.appendChar('9')],
      ['/', 'calc-btn-op', () => this.appendChar('/')],
      ['%', 'calc-btn-op', () => this.appendChar('%')],

      ['4', 'calc-btn-num', () => this.appendChar('4')],
      ['5', 'calc-btn-num', () => this.appendChar('5')],
      ['6', 'calc-btn-num', () => this.appendChar('6')],
      ['*', 'calc-btn-op', () => this.appendChar('*')],
      ['±', 'calc-btn-op', () => this.toggleSign()],

      ['1', 'calc-btn-num', () => this.appendChar('1')],
      ['2', 'calc-btn-num', () => this.appendChar('2')],
      ['3', 'calc-btn-num', () => this.appendChar('3')],
      ['-', 'calc-btn-op', () => this.appendChar('-')],
      ['=', 'calc-btn-equals', () => this.compute()],

      ['0', 'calc-btn-num calc-zero', () => this.appendChar('0')],
      ['.', 'calc-btn-num', () => this.appendChar('.')],
      ['+', 'calc-btn-op', () => this.appendChar('+')]
    ];

    for (const [label, cls, action] of buttons) {
      const btn = Sanitizer.createElement('button', {
        className: `calc-btn ${cls}`,
        onClick: action
      }, label);
      keypad.appendChild(btn);
    }

    this.container.appendChild(displayArea);
    this.container.appendChild(keypad);

    this.setupKeyboard();
    return this.container;
  }

  appendChar(char) {
    const isOp = '+-*/%^'.includes(char);

    // If calculation just completed
    if (this.hasEvaluated) {
      this.hasEvaluated = false;
      if (isOp) {
        this.expression = (this.lastResult || '0') + char;
        this.updateDisplay();
        return;
      } else {
        this.expression = '';
      }
    }

    if (char === '.') {
      // Prevent multiple dots in the same number token
      const lastToken = this.expression.split(/[\+\-\*\/\%\^\(\)]/).pop();
      if (lastToken.includes('.')) return;
      if (!this.expression || '+-*/%^('.includes(this.expression.slice(-1))) {
        this.expression += '0.';
        this.updateDisplay();
        return;
      }
    }

    if (isOp && '+-*/%^'.includes(this.expression.slice(-1))) {
      // Avoid duplicate consecutive binary operators (allow unary minus after op)
      if (char === '-' && !'+-*/%^'.includes(this.expression.slice(-2, -1))) {
        this.expression += char;
      } else {
        this.expression = this.expression.slice(0, -1) + char;
      }
      this.updateDisplay();
      return;
    }

    if (this.expression === '0' && !isNaN(char)) {
      this.expression = char;
    } else {
      this.expression += char;
    }
    this.updateDisplay();
  }

  clearAll() {
    this.expression = '';
    this.lastResult = '';
    this.hasEvaluated = false;
    this.historyEl.textContent = '';
    this.updateDisplay();
  }

  clearEntry() {
    this.expression = this.expression.slice(0, -1);
    this.hasEvaluated = false;
    this.updateDisplay();
  }

  toggleSign() {
    if (this.expression.startsWith('-')) {
      this.expression = this.expression.slice(1);
    } else if (this.expression) {
      this.expression = '-' + this.expression;
    }
    this.updateDisplay();
  }

  compute() {
    if (!this.expression) return;
    let expr = this.expression.trim();
    // Strip trailing operators before evaluation
    while (expr.length > 0 && '+-*/%^'.includes(expr[expr.length - 1])) {
      expr = expr.slice(0, -1).trim();
    }
    if (!expr) return;

    const res = SafeMath.evaluate(expr);
    if (res.success) {
      this.historyEl.textContent = `${expr} =`;
      // Clean display of accurate mathematical number
      const cleanNum = parseFloat(Number(res.value).toPrecision(12));
      this.expression = String(cleanNum);
      this.lastResult = this.expression;
      this.hasEvaluated = true;
      this.updateDisplay();
    } else {
      this.inputEl.textContent = res.error || 'Error';
      this.hasEvaluated = true;
    }
  }

  updateDisplay() {
    this.inputEl.textContent = this.expression || '0';
  }

  setupKeyboard() {
    this.container.addEventListener('keydown', (e) => {
      if ('0123456789+-*/%^().'.includes(e.key)) {
        this.appendChar(e.key);
      } else if (e.key === 'Enter' || e.key === '=') {
        this.compute();
      } else if (e.key === 'Backspace') {
        this.clearEntry();
      } else if (e.key === 'Escape') {
        this.clearAll();
      }
    });
  }
}
