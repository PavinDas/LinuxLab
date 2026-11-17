import { describe, it, expect } from './test-framework.js';
import { DialogManager } from '../js/desktop/dialogs.js';

describe('In-app Dialog Tests', () => {
  it('collects prompt input through the modal and resolves the submitted value', async () => {
    const dialogs = new DialogManager();
    const result = dialogs.prompt({
      title: 'Create Folder',
      message: 'Enter a folder name.'
    });

    const dialog = document.querySelector('.app-dialog');
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.querySelector('.app-dialog-cancel').textContent).toBe('Cancel');
    const input = dialog.querySelector('input');
    input.value = 'Pictures';
    dialog.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(await result).toBe('Pictures');
    expect(document.querySelector('.app-dialog-backdrop')).toBeFalsy();
  });

  it('resolves confirmation through modal buttons', async () => {
    const dialogs = new DialogManager();
    const result = dialogs.confirm({
      title: 'Reset Panda OS?',
      message: 'This action cannot be undone.'
    });

    document.querySelector('.app-dialog-confirm').click();
    expect(await result).toBe(true);
    expect(document.querySelector('.app-dialog-backdrop')).toBeFalsy();
  });

  it('keeps invalid values in the modal and exposes validation feedback', async () => {
    const dialogs = new DialogManager();
    const result = dialogs.prompt({
      title: 'Create File',
      maxLength: 16,
      validate: (value) => value === 'safe.txt' ? null : 'Use a safe filename.'
    });
    const input = document.querySelector('.app-dialog-input');
    input.value = '../unsafe';
    document.querySelector('.app-dialog-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(document.querySelector('.app-dialog').getAttribute('role')).toBe('dialog');
    expect(document.querySelector('.app-dialog-error').textContent).toBe('Use a safe filename.');

    input.value = 'safe.txt';
    document.querySelector('.app-dialog-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(await result).toBe('safe.txt');
  });
});
