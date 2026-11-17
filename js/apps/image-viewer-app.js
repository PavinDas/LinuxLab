import { Sanitizer } from '../security/sanitizer.js';
import { sysEvents } from '../core/event-bus.js';

const IMAGE_ASSETS = Object.freeze({
  'img-5555': './assets/pictures/IMG_5555.jpg',
  'img-5693': './assets/pictures/IMG_5693.jpg'
});

/**
 * ImageViewerApp
 * Safe viewer for images and SVG graphics stored in the virtual filesystem.
 */
export class ImageViewerApp {
  constructor(vfs, users) {
    this.vfs = vfs;
    this.users = users;
    this.scale = 1.0;
    this.rotation = 0;
    this.imageDimensions = null;
    this.windowResizeHandler = null;
    this.currentSvgUrl = null;
  }

  createUI(imagePath) {
    imagePath ||= `${this.users.getCurrentUser().home}/Pictures/mascot.svg`;
    this.container = Sanitizer.createElement('div', { className: 'image-viewer-container' });

    // Toolbar
    const toolbar = Sanitizer.createElement('div', { className: 'iv-toolbar' });
    
    const zoomInBtn = Sanitizer.createElement('button', {
      className: 'iv-btn',
      title: 'Zoom In',
      onClick: () => this.zoom(0.2)
    }, '🔍+');

    const zoomOutBtn = Sanitizer.createElement('button', {
      className: 'iv-btn',
      title: 'Zoom Out',
      onClick: () => this.zoom(-0.2)
    }, '🔍-');

    const rotateBtn = Sanitizer.createElement('button', {
      className: 'iv-btn',
      title: 'Rotate 90°',
      onClick: () => this.rotate()
    }, '🔄');

    const resetBtn = Sanitizer.createElement('button', {
      className: 'iv-btn',
      title: 'Reset View',
      onClick: () => this.reset()
    }, '↺ Reset');

    this.titleLabel = Sanitizer.createElement('span', { className: 'iv-title' }, imagePath.split('/').pop());

    toolbar.appendChild(zoomInBtn);
    toolbar.appendChild(zoomOutBtn);
    toolbar.appendChild(rotateBtn);
    toolbar.appendChild(resetBtn);
    toolbar.appendChild(this.titleLabel);

    // Canvas / Display Stage
    this.stage = Sanitizer.createElement('div', { className: 'iv-stage' });
    this.imgWrapper = Sanitizer.createElement('div', { className: 'iv-img-wrapper' });
    this.stage.appendChild(this.imgWrapper);

    this.container.appendChild(toolbar);
    this.container.appendChild(this.stage);

    this.loadImage(imagePath);
    return this.container;
  }

  loadImage(path) {
    const res = this.vfs.readFile(path, '/', this.users.getCurrentUser());
    if (this.currentSvgUrl) {
      URL.revokeObjectURL(this.currentSvgUrl);
      this.currentSvgUrl = null;
    }
    this.imgWrapper.innerHTML = '';

    if (!res.success) {
      // Default cute Mascot SVG fallback
      this.renderMascotSVG();
      return;
    }

    const assetPath = Object.prototype.hasOwnProperty.call(IMAGE_ASSETS, res.node.assetId)
      ? IMAGE_ASSETS[res.node.assetId]
      : null;
    if (assetPath) {
      const image = Sanitizer.createElement('img', {
        className: 'iv-raster-image',
        src: assetPath,
        alt: res.node.name,
        onLoad: (event) => this.reportImageDimensions(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)
      });
      this.imgWrapper.appendChild(image);
      if (image.complete && image.naturalWidth > 0) {
        this.reportImageDimensions(image.naturalWidth, image.naturalHeight);
      }
      return;
    }

    if (res.content.includes('<svg')) {
      const svgUrl = URL.createObjectURL(new Blob([res.content], { type: 'image/svg+xml' }));
      this.currentSvgUrl = svgUrl;
      const image = Sanitizer.createElement('img', {
        className: 'iv-raster-image',
        src: svgUrl,
        alt: res.node.name,
        onLoad: (event) => {
          this.reportImageDimensions(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight);
          if (this.currentSvgUrl === svgUrl) {
            URL.revokeObjectURL(svgUrl);
            this.currentSvgUrl = null;
          }
        },
        onError: () => {
          if (this.currentSvgUrl === svgUrl) {
            URL.revokeObjectURL(svgUrl);
            this.currentSvgUrl = null;
          }
          this.renderMascotSVG();
          sysEvents.emit('notify', {
            title: 'Could Not Open SVG',
            message: 'The selected SVG is invalid or could not be rendered safely.',
            type: 'error'
          });
        }
      });
      this.imgWrapper.appendChild(image);
    } else {
      this.renderMascotSVG();
    }
  }

  renderMascotSVG() {
    this.imgWrapper.innerHTML = `
      <svg width="240" height="240" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <!-- Cute Cyber Panda Mascot -->
        <circle cx="100" cy="100" r="75" fill="#f8fafc" stroke="#334155" stroke-width="4"/>
        <!-- Ears -->
        <circle cx="45" cy="50" r="22" fill="#1e293b"/>
        <circle cx="155" cy="50" r="22" fill="#1e293b"/>
        <!-- Eye Patches -->
        <ellipse cx="75" cy="95" rx="18" ry="24" fill="#1e293b" transform="rotate(-15 75 95)"/>
        <ellipse cx="125" cy="95" rx="18" ry="24" fill="#1e293b" transform="rotate(15 125 95)"/>
        <!-- Eyes -->
        <circle cx="78" cy="95" r="7" fill="#22c55e"/>
        <circle cx="122" cy="95" r="7" fill="#22c55e"/>
        <circle cx="80" cy="93" r="2.5" fill="#ffffff"/>
        <circle cx="124" cy="93" r="2.5" fill="#ffffff"/>
        <!-- Cute Hacker Glasses / Visor -->
        <rect x="52" y="85" width="96" height="22" rx="6" fill="#10b981" fill-opacity="0.35" stroke="#10b981" stroke-width="2"/>
        <line x1="90" y1="96" x2="110" y2="96" stroke="#10b981" stroke-width="2"/>
        <!-- Nose -->
        <ellipse cx="100" cy="120" rx="9" ry="6" fill="#1e293b"/>
        <!-- Smile -->
        <path d="M 92 130 Q 100 138 108 130" stroke="#334155" stroke-width="3" fill="none" stroke-linecap="round"/>
        <!-- Cheeks -->
        <circle cx="58" cy="118" r="8" fill="#fda4af" fill-opacity="0.6"/>
        <circle cx="142" cy="118" r="8" fill="#fda4af" fill-opacity="0.6"/>
      </svg>
    `;
    this.reportImageDimensions(240, 240);
  }

  setWindowResizeHandler(handler) {
    this.windowResizeHandler = handler;
    if (this.imageDimensions) {
      handler(this.imageDimensions.width, this.imageDimensions.height);
    }
  }

  reportImageDimensions(width, height) {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return;
    this.imageDimensions = { width, height };
    this.windowResizeHandler?.(width, height);
  }

  zoom(delta) {
    this.scale = Math.max(0.4, Math.min(3.0, this.scale + delta));
    this.updateTransform();
  }

  rotate() {
    this.rotation = (this.rotation + 90) % 360;
    this.updateTransform();
  }

  reset() {
    this.scale = 1.0;
    this.rotation = 0;
    this.updateTransform();
  }

  updateTransform() {
    this.imgWrapper.style.transform = `scale(${this.scale}) rotate(${this.rotation}deg)`;
  }
}
