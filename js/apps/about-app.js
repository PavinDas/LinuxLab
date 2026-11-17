import { Sanitizer } from '../security/sanitizer.js';

/**
 * AboutApp
 * About CyberLinux desktop info, architecture specs, and security assurance.
 */
export class AboutApp {
  createUI() {
    const container = Sanitizer.createElement('div', { className: 'about-container' });

    const mascotBox = Sanitizer.createElement('div', { className: 'about-mascot-box' }, [
      Sanitizer.createElement('div', { className: 'about-avatar' }, '🐼')
    ]);

    const title = Sanitizer.createElement('h2', { className: 'about-title' }, 'CyberLinux 2.0 LTS');
    const subtitle = Sanitizer.createElement('div', { className: 'about-subtitle' }, 'Secure Linux Desktop Simulator (Panda Edition)');

    const infoList = Sanitizer.createElement('div', { className: 'about-info-list' }, [
      Sanitizer.createElement('div', { className: 'about-row' }, [
        Sanitizer.createElement('strong', {}, 'Kernel:'),
        Sanitizer.createElement('span', {}, '6.8.0-cyber-generic (Virtual WASM/JS Sandbox)')
      ]),
      Sanitizer.createElement('div', { className: 'about-row' }, [
        Sanitizer.createElement('strong', {}, 'Desktop Environment:'),
        Sanitizer.createElement('span', {}, 'GNOME Pastel Cartoon Shell')
      ]),
      Sanitizer.createElement('div', { className: 'about-row' }, [
        Sanitizer.createElement('strong', {}, 'Security Model:'),
        Sanitizer.createElement('span', {}, 'Strict Sandbox (Zero OS eval, Zero host execution)')
      ]),
      Sanitizer.createElement('div', { className: 'about-row' }, [
        Sanitizer.createElement('strong', {}, 'Hosting:'),
        Sanitizer.createElement('span', {}, 'Static GitHub Pages (Pure Vanilla JS, HTML5, CSS3)')
      ]),
      Sanitizer.createElement('div', { className: 'about-row' }, [
        Sanitizer.createElement('strong', {}, 'Primary Objective:'),
        Sanitizer.createElement('span', {}, 'Safe, accessible cybersecurity & ethical hacking education')
      ])
    ]);

    container.appendChild(mascotBox);
    container.appendChild(title);
    container.appendChild(subtitle);
    container.appendChild(infoList);

    return container;
  }
}
