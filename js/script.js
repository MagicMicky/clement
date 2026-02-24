/* ============================================
   Clement Savel — Portfolio Website
   ============================================ */

const ROTATION_INTERVAL = 8000;

// --- Manifest Loading ---

async function loadManifest() {
  try {
    const res = await fetch('site.manifest.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return { portfolios: [], backgrounds: [] };
  }
}

// --- Download Rendering (DOM-based, no innerHTML) ---

function createDownloadIcon() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'download-item__icon');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');

  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4');
  const polyline = document.createElementNS(ns, 'polyline');
  polyline.setAttribute('points', '7 10 12 15 17 10');
  const line = document.createElementNS(ns, 'line');
  line.setAttribute('x1', '12');
  line.setAttribute('y1', '15');
  line.setAttribute('x2', '12');
  line.setAttribute('y2', '3');

  svg.append(path, polyline, line);
  return svg;
}

function renderDownloads(portfolios, container) {
  container.textContent = '';

  if (!portfolios.length) {
    const empty = document.createElement('p');
    empty.className = 'card__empty';
    empty.textContent = 'Portfolio coming soon';
    container.appendChild(empty);
    return;
  }

  for (const p of portfolios) {
    const link = document.createElement('a');
    link.className = 'download-item';
    link.href = `portfolios/${encodeURIComponent(p.filename)}`;
    link.download = '';

    const label = document.createElement('span');
    label.className = 'download-item__label';
    label.textContent = p.label;

    const meta = document.createElement('span');
    meta.className = 'download-item__meta';

    const size = document.createElement('span');
    size.textContent = p.size;

    meta.append(size, createDownloadIcon());
    link.append(label, meta);
    container.appendChild(link);
  }
}

// --- Background Rotation ---

class BackgroundRotator {
  constructor(imageUrls) {
    this.images = imageUrls;
    this.currentIndex = 0;
    this.layerA = document.getElementById('bg-a');
    this.layerB = document.getElementById('bg-b');
    this.indicators = document.getElementById('bg-indicators');
    this.activeLayer = this.layerA;
    this.inactiveLayer = this.layerB;
    this.timer = null;
  }

  start() {
    if (!this.images.length) return;

    this.renderIndicators();

    // Load and show first image
    this.preload(this.images[0]).then(url => {
      this.activeLayer.style.backgroundImage = `url('${CSS.escape(url)}')`;
      this.activeLayer.classList.add('active');
      this.updateIndicators(0);
    });

    if (this.images.length <= 1) return;

    // Preload second image
    this.preload(this.images[1]);

    this.timer = setInterval(() => this.advance(), ROTATION_INTERVAL);
  }

  advance() {
    const nextIndex = (this.currentIndex + 1) % this.images.length;

    this.preload(this.images[nextIndex]).then(url => {
      this.inactiveLayer.style.backgroundImage = `url('${CSS.escape(url)}')`;
      this.inactiveLayer.classList.add('active');
      this.activeLayer.classList.remove('active');

      // Swap layer references
      const tmp = this.activeLayer;
      this.activeLayer = this.inactiveLayer;
      this.inactiveLayer = tmp;

      this.currentIndex = nextIndex;
      this.updateIndicators(nextIndex);

      // Preload the one after next
      const preloadIndex = (nextIndex + 1) % this.images.length;
      this.preload(this.images[preloadIndex]);
    });
  }

  preload(url) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => resolve(url);
      img.src = url;
    });
  }

  renderIndicators() {
    if (this.images.length <= 1) {
      this.indicators.style.display = 'none';
      return;
    }
    this.indicators.textContent = '';
    for (let i = 0; i < this.images.length; i++) {
      const dot = document.createElement('div');
      dot.className = 'bg-indicator';
      dot.dataset.index = i;
      this.indicators.appendChild(dot);
    }
  }

  updateIndicators(activeIndex) {
    const dots = this.indicators.querySelectorAll('.bg-indicator');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === activeIndex);
    });
  }
}

// --- Init ---

document.addEventListener('DOMContentLoaded', async () => {
  const manifest = await loadManifest();

  renderDownloads(manifest.portfolios, document.getElementById('downloads'));

  if (manifest.backgrounds.length) {
    const rotator = new BackgroundRotator(manifest.backgrounds);
    rotator.start();
  }
});
