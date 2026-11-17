import { Sanitizer } from '../security/sanitizer.js';
import { SYSTEM_INFO } from '../core/system-info.js';

/**
 * AboutApp
 * About Panda OS desktop info, architecture specs, and security assurance.
 */
export class AboutApp {
  createUI() {
    const container = Sanitizer.createElement('div', { className: 'about-container' });

    const mascotBox = Sanitizer.createElement('div', { className: 'about-mascot-box' }, [
      Sanitizer.createElement('div', { className: 'about-avatar' }, '🐼')
    ]);

    const title = Sanitizer.createElement('h2', { className: 'about-title' }, SYSTEM_INFO.osName);
    const subtitle = Sanitizer.createElement('div', { className: 'about-subtitle' }, 'A cute, colorful Linux desktop simulator');

    const infoList = Sanitizer.createElement('div', { className: 'about-info-list' }, [
      Sanitizer.createElement('div', { className: 'about-row' }, [
        Sanitizer.createElement('strong', {}, 'Hostname:'),
        Sanitizer.createElement('span', {}, SYSTEM_INFO.hostname)
      ]),
      Sanitizer.createElement('div', { className: 'about-row' }, [
        Sanitizer.createElement('strong', {}, 'Username:'),
        Sanitizer.createElement('span', {}, SYSTEM_INFO.username)
      ]),
      Sanitizer.createElement('div', { className: 'about-row' }, [
        Sanitizer.createElement('strong', {}, 'CPU:'),
        Sanitizer.createElement('span', {}, `${SYSTEM_INFO.cpuCount} virtual CPUs`)
      ]),
      Sanitizer.createElement('div', { className: 'about-row' }, [
        Sanitizer.createElement('strong', {}, 'Memory:'),
        Sanitizer.createElement('span', {}, `${SYSTEM_INFO.memoryMB / 1024} GB RAM`)
      ]),
      Sanitizer.createElement('div', { className: 'about-row' }, [
        Sanitizer.createElement('strong', {}, 'Storage:'),
        Sanitizer.createElement('span', {}, `${SYSTEM_INFO.storageGB} GB virtual disk`)
      ]),
      Sanitizer.createElement('div', { className: 'about-row' }, [
        Sanitizer.createElement('strong', {}, 'Kernel:'),
        Sanitizer.createElement('span', {}, '6.8.0-cyber-generic (Virtual WASM/JS Sandbox)')
      ]),
      Sanitizer.createElement('div', { className: 'about-row' }, [
        Sanitizer.createElement('strong', {}, 'Desktop Environment:'),
        Sanitizer.createElement('span', {}, 'Panda desktop')
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
