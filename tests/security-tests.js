import { describe, it, expect } from './test-framework.js';
import { Sanitizer } from '../js/security/sanitizer.js';
import { PathValidator } from '../js/security/path-validator.js';
import { SafeMath } from '../js/security/safe-math.js';
import { SecurityLimits } from '../js/security/limits.js';
import { filterTextInput, validateFilenameInput, validateOctalModeInput, validateVirtualPathInput } from '../js/security/input-validation.js';
import { CommandParser } from '../js/terminal/command-parser.js';
import { ImageViewerApp } from '../js/apps/image-viewer-app.js';

describe('Panda OS Security Architecture Tests', () => {

  it('strictly escapes XSS payloads and HTML injection', () => {
    const raw = `<script>alert("xss")</script><img src=x onerror=alert(1)>`;
    const escaped = Sanitizer.escapeHTML(raw);
    expect(escaped).toContain('&lt;script&gt;');
    expect(escaped).toContain('&lt;img');
    expect(escaped.includes('<script>')).toBe(false);
  });

  it('prevents path traversal outside virtual root boundary', () => {
    const attempts = [
      '../../../../etc/passwd',
      '/home/student/../../../../etc/shadow',
      '../../../root',
      '///////etc//..//../var/log'
    ];

    for (const raw of attempts) {
      const norm = PathValidator.normalize(raw, '/home/student');
      // Must be an absolute normalized path starting with / and never containing '..'
      expect(norm.startsWith('/')).toBe(true);
      expect(norm.includes('..')).toBe(false);
    }
  });

  it('rejects filenames containing illegal characters or slashes', () => {
    expect(PathValidator.isValidFilename('valid_script.sh')).toBe(true);
    expect(PathValidator.isValidFilename('../hacked')).toBe(false);
    expect(PathValidator.isValidFilename('test/file')).toBe(false);
    expect(PathValidator.isValidFilename('line\nbreak')).toBe(false);
    expect(PathValidator.isValidFilename('hidden\u202eexe')).toBe(false);
    expect(PathValidator.isValidFilename('')).toBe(false);
    expect(PathValidator.isValidFilename('.')).toBe(false);
  });

  it('filters control characters and validates modal filename, path, and permission inputs', () => {
    expect(filterTextInput('safe\nname\u202e')).toBe('safename');
    expect(validateFilenameInput('report.txt')).toBe(null);
    expect(validateFilenameInput('../report.txt')).toBeTruthy();
    expect(validateVirtualPathInput('/home/kiddy/notes.txt')).toBe(null);
    expect(validateVirtualPathInput('/home/kiddy/../etc/shadow')).toBeTruthy();
    expect(validateVirtualPathInput('notes.txt')).toBeTruthy();
    expect(validateOctalModeInput('4755')).toBe(null);
    expect(validateOctalModeInput('999')).toBeTruthy();
  });

  it('keeps untrusted SVG markup out of the active document tree', async () => {
    const app = new ImageViewerApp({
      readFile: () => ({
        success: true,
        content: '<svg xmlns="http://www.w3.org/2000/svg"><script>window.pandaSvgPayload = true</script></svg>',
        node: { name: 'untrusted.svg', assetId: null }
      })
    }, {
      getCurrentUser: () => ({ home: '/home/kiddy' })
    });

    const viewer = app.createUI('/home/kiddy/Pictures/untrusted.svg');
    expect(viewer.querySelector('svg')).toBeFalsy();
    expect(viewer.querySelector('script')).toBeFalsy();
    const image = viewer.querySelector('img');
    expect(image.getAttribute('src').startsWith('blob:')).toBe(true);
    document.body.appendChild(viewer);
    await image.decode();
    expect(image.naturalWidth).toBeGreaterThan(0);
    viewer.remove();
  });

  it('protects against prototype pollution in JSON deserialization', () => {
    const evilPayload = '{"__proto__": {"polluted": "yes"}, "constructor": {"prototype": {"admin": true}}, "name": "safe"}';
    const parsed = Sanitizer.safeJSONParse(evilPayload);
    expect(parsed.name).toBe('safe');
    expect(Object.prototype.polluted).toBe(undefined);
    expect(Object.prototype.admin).toBe(undefined);
  });

  it('evaluates mathematics without eval() or new Function()', () => {
    const res1 = SafeMath.evaluate('2 + 3 * 4');
    expect(res1.success).toBe(true);
    expect(res1.value).toBe(14);

    const res2 = SafeMath.evaluate('(10 - 2) / 2');
    expect(res2.success).toBe(true);
    expect(res2.value).toBe(4);

    // Div by zero handling
    const divZero = SafeMath.evaluate('10 / 0');
    expect(divZero.success).toBe(false);
  });

  it('enforces maximum command input length to prevent DoS', () => {
    const massiveInput = 'a'.repeat(SecurityLimits.MAX_INPUT_LENGTH + 100);
    let errorCaught = false;
    try {
      CommandParser.parse(massiveInput);
    } catch (e) {
      errorCaught = true;
    }
    expect(errorCaught).toBe(true);
  });

});
