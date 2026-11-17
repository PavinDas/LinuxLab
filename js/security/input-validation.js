import { PathValidator } from './path-validator.js';
import { SecurityLimits } from './limits.js';

const UNSAFE_TEXT_CHARACTERS = /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g;

export function filterTextInput(value) {
  return String(value).replace(UNSAFE_TEXT_CHARACTERS, '');
}

export function filterOctalModeInput(value) {
  return String(value).replace(/[^0-7]/g, '');
}

export function validateFilenameInput(value) {
  if (!PathValidator.isValidFilename(value)) {
    return `Use a single filename up to ${SecurityLimits.MAX_FILENAME_LENGTH} characters without path separators or control characters.`;
  }
  return null;
}

export function validateVirtualPathInput(value) {
  const path = filterTextInput(value);
  if (!path.trim()) return 'Enter a path.';
  if (path.length > SecurityLimits.MAX_PATH_LENGTH) {
    return `Path must be ${SecurityLimits.MAX_PATH_LENGTH} characters or fewer.`;
  }
  if (!(path.startsWith('/') || path === '~' || path.startsWith('~/'))) {
    return 'Enter an absolute path or a path beginning with ~/.';
  }
  if (path.split('/').includes('..')) {
    return 'Parent-directory (..) segments are not allowed.';
  }
  return null;
}

export function validateOctalModeInput(value) {
  if (!/^[0-7]{3,4}$/.test(value)) {
    return 'Enter exactly 3 or 4 octal digits (0-7).';
  }
  return null;
}
