import type { LayerVisibility } from '../features/types';

type VisibilityCallback = (layer: keyof LayerVisibility, visible: boolean) => void;

const LAYER_LABELS: Record<keyof LayerVisibility, string> = {
  simple: 'Simple Craters',
  complex: 'Complex Craters',
  multiring: 'Multi-ring Basins',
  heatmap: 'Density Heatmap',
  topo: 'Topographic Overlay',
  hazard: 'Hazard Zones',
  minerals: 'Mineral Deposits',
  landing: 'Safe Landing Zones',
};

const LAYER_ICONS: Record<keyof LayerVisibility, string> = {
  simple: '●',
  complex: '●',
  multiring: '●',
  heatmap: '◐',
  topo: '▨',
  hazard: '⚠',
  minerals: '◆',
  landing: '⬟',
};

export class LayerTogglePanel {
  private panel: HTMLDivElement;
  private collapsed = false;
  private onToggle: VisibilityCallback;
  private checkboxes: Record<string, HTMLInputElement> = {};

  constructor(onToggle: VisibilityCallback) {
    this.onToggle = onToggle;
    this.panel = this.createPanel();
    this.setupCollapse();
  }

  private createPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.id = 'layer-toggle-panel';
    panel.className = 'layer-panel';

    panel.innerHTML = `
      <div class="layer-panel-header">
        <span>Scientific Layers</span>
        <button id="layer-panel-collapse" class="layer-panel-toggle">−</button>
      </div>
      <div class="layer-panel-content" id="layer-panel-content">
        <div class="layer-section">
          <h4>Crater Outlines</h4>
          ${(Object.keys(LAYER_LABELS) as Array<keyof LayerVisibility>)
            .filter(k => ['simple', 'complex', 'multiring'].includes(k))
            .map(key => this.createCheckbox(key, true))
            .join('')}
        </div>
        <div class="layer-section">
          <h4>Analysis Layers</h4>
          ${(Object.keys(LAYER_LABELS) as Array<keyof LayerVisibility>)
            .filter(k => ['heatmap', 'topo', 'hazard', 'minerals', 'landing'].includes(k))
            .map(key => this.createCheckbox(key, true))
            .join('')}
        </div>
      </div>
    `;

    panel.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      const layer = checkbox.getAttribute('data-layer') as keyof LayerVisibility;
      checkbox.addEventListener('change', () => {
        this.onToggle(layer, checkbox.checked);
      });
    });

    return panel;
  }

  private createCheckbox(layer: keyof LayerVisibility, checked: boolean): string {
    const colorClass = layer === 'simple' ? 'color-simple' :
                       layer === 'complex' ? 'color-complex' :
                       layer === 'multiring' ? 'color-multiring' : '';
    return `
      <label class="layer-checkbox">
        <input type="checkbox" data-layer="${layer}" ${checked ? 'checked' : ''}>
        <span class="layer-icon ${colorClass}">${LAYER_ICONS[layer]}</span>
        <span class="layer-label">${LAYER_LABELS[layer]}</span>
      </label>
    `;
  }

  private setupCollapse() {
    const toggleBtn = this.panel.querySelector('#layer-panel-collapse') as HTMLButtonElement;
    const content = this.panel.querySelector('#layer-panel-content') as HTMLElement;

    toggleBtn.addEventListener('click', () => {
      this.collapsed = !this.collapsed;
      toggleBtn.textContent = this.collapsed ? '+' : '−';
      content.style.display = this.collapsed ? 'none' : 'block';
    });
  }

  addTo(container: HTMLElement) {
    container.appendChild(this.panel);
  }

  updateCheckbox(layer: keyof LayerVisibility, checked: boolean) {
    const checkbox = this.panel.querySelector(`input[data-layer="${layer}"]`) as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = checked;
    }
  }

  remove() {
    this.panel.remove();
  }
}
