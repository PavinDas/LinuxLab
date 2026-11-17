import { Sanitizer } from '../security/sanitizer.js';
import { SecurityLimits } from '../security/limits.js';
import { filterTextInput } from '../security/input-validation.js';

export class DialogManager {
  constructor() {
    this.queue = [];
    this.isShowing = false;
    this.nextId = 0;
  }

  prompt({
    title = 'Enter a value',
    message = '',
    value = '',
    placeholder = '',
    confirmLabel = 'OK',
    cancelLabel = 'Cancel',
    maxLength = SecurityLimits.MAX_INPUT_LENGTH,
    filter = filterTextInput,
    validate = null
  } = {}) {
    const safeMaxLength = Number.isInteger(maxLength) && maxLength > 0
      ? Math.min(maxLength, SecurityLimits.MAX_INPUT_LENGTH)
      : SecurityLimits.MAX_INPUT_LENGTH;
    return this.enqueue({
      type: 'prompt',
      title,
      message,
      value,
      placeholder,
      confirmLabel,
      cancelLabel,
      maxLength: safeMaxLength,
      filter,
      validate
    });
  }

  confirm({ title = 'Please confirm', message = '', confirmLabel = 'Continue', cancelLabel = 'Cancel', danger = false } = {}) {
    return this.enqueue({ type: 'confirm', title, message, confirmLabel, cancelLabel, danger });
  }

  alert({ title = 'Notice', message = '', confirmLabel = 'OK' } = {}) {
    return this.enqueue({ type: 'alert', title, message, confirmLabel });
  }

  enqueue(options) {
    return new Promise((resolve) => {
      this.queue.push({ options, resolve });
      this.showNext();
    });
  }

  showNext() {
    if (this.isShowing) return;
    const request = this.queue.shift();
    if (!request) return;

    this.isShowing = true;
    const { options, resolve } = request;
    const previousFocus = document.activeElement;
    const titleId = `app-dialog-title-${++this.nextId}`;
    const descriptionId = `app-dialog-description-${this.nextId}`;
    const errorId = `app-dialog-error-${this.nextId}`;
    let input = null;
    let validationMessage = null;
    let cancelButton = null;
    let isFinished = false;

    const finish = (result) => {
      if (isFinished) return;
      isFinished = true;
      overlay.remove();
      this.isShowing = false;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
      resolve(result);
      Promise.resolve().then(() => this.showNext());
    };

    const overlay = Sanitizer.createElement('div', {
      className: 'app-dialog-backdrop',
      onClick: (event) => {
        if (event.target === overlay) {
          finish(options.type === 'prompt' ? null : options.type === 'confirm' ? false : undefined);
        }
      }
    });
    const dialogAttributes = {
      className: 'app-dialog',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': titleId
    };
    if (options.message) dialogAttributes['aria-describedby'] = descriptionId;
    const dialog = Sanitizer.createElement('section', dialogAttributes);
    const heading = Sanitizer.createElement('h2', { id: titleId, className: 'app-dialog-title' }, options.title);
    dialog.appendChild(heading);

    if (options.message) {
      dialog.appendChild(Sanitizer.createElement('p', {
        id: descriptionId,
        className: 'app-dialog-message'
      }, options.message));
    }

    const content = options.type === 'prompt'
      ? Sanitizer.createElement('form', {
        className: 'app-dialog-form',
        onSubmit: (event) => {
          event.preventDefault();
          filterInput();
          if (validateInput()) return;
          finish(input.value);
        }
      })
      : Sanitizer.createElement('div', { className: 'app-dialog-form' });

    if (options.type === 'prompt') {
      input = Sanitizer.createElement('input', {
        className: 'app-dialog-input',
        type: 'text',
        'aria-label': options.title,
        placeholder: options.placeholder,
        maxlength: options.maxLength,
        'aria-describedby': [options.message ? descriptionId : null, errorId].filter(Boolean).join(' ')
      });
      input.value = filterInputValue(options.filter, options.value);
      validationMessage = Sanitizer.createElement('p', {
        id: errorId,
        className: 'app-dialog-error',
        role: 'alert',
        'aria-live': 'polite',
        hidden: true
      });
      input.addEventListener('input', () => {
        filterInput();
        validateInput();
      });
      content.appendChild(input);
      content.appendChild(validationMessage);
      validateInput();
    }

    const actions = Sanitizer.createElement('div', { className: 'app-dialog-actions' });
    if (options.type !== 'alert') {
      cancelButton = Sanitizer.createElement('button', {
        className: 'app-dialog-button app-dialog-cancel',
        type: 'button',
        onClick: () => finish(options.type === 'prompt' ? null : false)
      }, options.cancelLabel);
      actions.appendChild(cancelButton);
    }

    const confirmButton = Sanitizer.createElement('button', {
      className: `app-dialog-button app-dialog-confirm${options.danger ? ' app-dialog-danger' : ''}`,
      type: options.type === 'prompt' ? 'submit' : 'button'
    }, options.confirmLabel);
    if (options.type !== 'prompt') {
      confirmButton.addEventListener('click', () => finish(options.type === 'confirm' ? true : undefined));
    }
    actions.appendChild(confirmButton);
    content.appendChild(actions);
    dialog.appendChild(content);

    overlay.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        finish(options.type === 'prompt' ? null : options.type === 'confirm' ? false : undefined);
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = [...dialog.querySelectorAll('input, button:not([disabled])')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    if (input) {
      input.focus();
      input.select();
    } else if (cancelButton) {
      cancelButton.focus();
    } else {
      confirmButton.focus();
    }

    function filterInput() {
      input.value = filterInputValue(options.filter, input.value);
    }

    function validateInput() {
      let error = input.value.length > options.maxLength
        ? `Input must be ${options.maxLength} characters or fewer.`
        : null;
      if (!error && typeof options.validate === 'function') {
        error = options.validate(input.value);
      }

      const message = typeof error === 'string' ? error : error ? 'Enter a valid value.' : '';
      validationMessage.textContent = message;
      validationMessage.hidden = !message;
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
      return Boolean(message);
    }
  }
}

function filterInputValue(filter, value) {
  const filtered = typeof filter === 'function' ? filter(String(value)) : filterTextInput(value);
  return String(filtered);
}
