import { ColorMode } from '../craters/crater-layer';

const CLASS_LEGEND: { label: string; color: string }[] = [
  { label: 'Simple', color: '#4a9eff' },
  { label: 'Complex', color: '#42d9a8' },
  { label: 'Multi-ring', color: '#ff9f43' },
];

const AGE_LEGEND: { label: string; color: string }[] = [
  { label: 'Copernican', color: '#2a9df4' },
  { label: 'Eratosthenian', color: '#42d9a8' },
  { label: 'Late Imbrian', color: '#ff9f43' },
  { label: 'Early Imbrian', color: '#f06292' },
  { label: 'Nectarian', color: '#ab47bc' },
  { label: 'Pre-Nectarian', color: '#78909c' },
  { label: 'Unknown', color: '#666' },
];

export class LegendPanel {
  private container: HTMLElement;
  private colorMode: ColorMode = 'class';
  private isVisible = true;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'legend-panel';
    this.buildPanel();
    document.body.appendChild(this.container);
  }

  setColorMode(mode: ColorMode) {
    this.colorMode = mode;
    this.render();
  }

  toggle() {
    this.isVisible = !this.isVisible;
    this.container.classList.toggle('hidden', !this.isVisible);
  }

  private buildPanel() {
    this.container.innerHTML = `
      <div class="legend-header">
        <h4>Legend</h4>
        <button class="legend-toggle-btn" id="legend-toggle">&times;</button>
      </div>
      <div class="legend-content" id="legend-content"></div>
    `;

    this.container.querySelector('#legend-toggle')?.addEventListener('click', () => this.toggle());
    this.render();
  }

  private render() {
    const content = this.container.querySelector('#legend-content');
    if (!content) return;

    const legend = this.colorMode === 'age' ? AGE_LEGEND : CLASS_LEGEND;
    const title = this.colorMode === 'age' ? 'By Age Period' : 'By Crater Type';

    content.innerHTML = `
      <div class="legend-title">${title}</div>
      ${legend.map(item => `
        <div class="legend-item">
          <span class="legend-color" style="background: ${item.color}"></span>
          <span class="legend-label">${item.label}</span>
        </div>
      `).join('')}
    `;
  }
}
