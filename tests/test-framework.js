/**
 * Lightweight Standalone Test Framework for CyberLinux
 */
export class TestRunner {
  constructor() {
    this.suites = [];
    this.currentSuite = null;
    this.passed = 0;
    this.failed = 0;
  }

  describe(name, fn) {
    const suite = { name, tests: [] };
    this.suites.push(suite);
    this.currentSuite = suite;
    fn();
    this.currentSuite = null;
  }

  it(description, testFn) {
    if (!this.currentSuite) throw new Error('it() must be called inside describe()');
    this.currentSuite.tests.push({ description, testFn });
  }

  async run(outputCallback) {
    this.passed = 0;
    this.failed = 0;

    for (const suite of this.suites) {
      if (outputCallback) outputCallback({ type: 'suite-start', name: suite.name });

      for (const test of suite.tests) {
        try {
          await test.testFn();
          this.passed++;
          if (outputCallback) outputCallback({ type: 'test-pass', description: test.description });
        } catch (err) {
          this.failed++;
          if (outputCallback) outputCallback({ type: 'test-fail', description: test.description, error: err.message || err });
        }
      }
    }

    const summary = { total: this.passed + this.failed, passed: this.passed, failed: this.failed };
    if (outputCallback) outputCallback({ type: 'summary', summary });
    return summary;
  }
}

export function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
      }
    },
    toEqual(expected) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected deep equality with ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toContain(expected) {
      if (!actual || !actual.includes(expected)) {
        throw new Error(`Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(expected)}`);
      }
    },
    toBeTruthy() {
      if (!actual) throw new Error(`Expected truthy value, got ${actual}`);
    },
    toBeFalsy() {
      if (actual) throw new Error(`Expected falsy value, got ${actual}`);
    },
    toBeGreaterThan(num) {
      if (actual <= num) throw new Error(`Expected ${actual} > ${num}`);
    }
  };
}

export const runner = new TestRunner();
export const describe = runner.describe.bind(runner);
export const it = runner.it.bind(runner);
