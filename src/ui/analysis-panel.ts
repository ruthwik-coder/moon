import { CraterMetadata } from '../features/types';
import {
  calculateSizeDistribution,
  calculateAgeDistribution,
  calculateDepthDiameterRatio,
  templateMatchDemo,
  DetectionResult,
  DetectionStats,
} from '../algorithms/crater-detection';

const AGE_PERIODS = ['Copernican', 'Eratosthenian', 'Late Imbrian', 'Early Imbrian', 'Nectarian', 'Pre-Nectarian', 'Unknown'];

const AGE_COLORS: Record<string, string> = {
  'Copernican': '#2a9df4',
  'Eratosthenian': '#42d9a8',
  'Late Imbrian': '#ff9f43',
  'Early Imbrian': '#f06292',
  'Nectarian': '#ab47bc',
  'Pre-Nectarian': '#78909c',
  'Unknown': '#666',
};

export class AnalysisPanel {
  private container: HTMLElement;
  private isVisible = false;
  private craters: CraterMetadata[];
  private detections: DetectionResult[] = [];
  private currentStats: DetectionStats | null = null;
  private selectedAges = new Set<string>(AGE_PERIODS);
  private onAgeFilterChange: ((ages: string[]) => void) | null = null;

  constructor(craters: CraterMetadata[], onAgeFilterChange?: (ages: string[]) => void) {
    this.craters = craters;
    this.onAgeFilterChange = onAgeFilterChange || null;
    this.container = document.createElement('div');
    this.container.className = 'analysis-panel';
    this.buildPanel();
    document.body.appendChild(this.container);
    this.render();
  }

  toggle() {
    this.isVisible = !this.isVisible;
    this.container.classList.toggle('visible', this.isVisible);
  }

  updateCraters(craters: CraterMetadata[]) {
    this.craters = craters;
    this.render();
  }

  private buildPanel() {
    this.container.innerHTML = `
      <div class="analysis-panel-header">
        <h3>Crater Analysis</h3>
        <button class="analysis-close-btn" id="analysis-close">&times;</button>
      </div>
      <div class="analysis-tabs">
        <button class="analysis-tab active" data-tab="overview">Overview</button>
        <button class="analysis-tab" data-tab="distribution">Distribution</button>
        <button class="analysis-tab" data-tab="detection">Detection Demo</button>
      </div>
      <div class="analysis-content">
        <div class="analysis-tab-content active" id="tab-overview">
          <div class="analysis-section">
            <h4>Age Filter</h4>
            <div class="age-filter-grid" id="age-filter-grid">
              ${AGE_PERIODS.map(age => `
                <label class="age-filter-item">
                  <input type="checkbox" class="age-filter-checkbox" data-age="${age}" ${this.selectedAges.has(age) ? 'checked' : ''}>
                  <span class="age-filter-color" style="background: ${AGE_COLORS[age]}"></span>
                  <span class="age-filter-label">${age}</span>
                </label>
              `).join('')}
            </div>
          </div>
          <div class="analysis-stats-grid">
            <div class="analysis-stat-card">
              <span class="stat-value" id="stat-total">0</span>
              <span class="stat-label">Total Craters</span>
            </div>
            <div class="analysis-stat-card">
              <span class="stat-value" id="stat-simple">0</span>
              <span class="stat-label">Simple</span>
            </div>
            <div class="analysis-stat-card">
              <span class="stat-value" id="stat-complex">0</span>
              <span class="stat-label">Complex</span>
            </div>
            <div class="analysis-stat-card">
              <span class="stat-value" id="stat-multiring">0</span>
              <span class="stat-label">Multi-ring</span>
            </div>
          </div>
          <div class="analysis-section">
            <h4>Size Distribution</h4>
            <div class="bar-chart" id="size-chart"></div>
          </div>
          <div class="analysis-section">
            <h4>Age Distribution</h4>
            <div class="bar-chart" id="age-chart"></div>
          </div>
        </div>
        <div class="analysis-tab-content" id="tab-distribution">
          <div class="analysis-section">
            <h4>Depth-Diameter Ratio</h4>
            <canvas id="dd-ratio-plot" width="400" height="250"></canvas>
          </div>
          <div class="analysis-section">
            <h4>Crater Density by Region</h4>
            <div id="density-grid" class="density-grid"></div>
          </div>
        </div>
        <div class="analysis-tab-content" id="tab-detection">
          <div class="analysis-section">
            <h4>Template Matching Demo</h4>
            <p class="demo-description">
              Demonstrates circular edge detection algorithm adapted from DeepMoon's template matching approach.
              The algorithm uses a circular kernel to scan for crater-like patterns.
            </p>
            <div class="detection-controls">
              <div class="control-group">
                <label>Min Diameter (km):</label>
                <input type="number" id="detect-min-diam" value="10" min="5" max="200">
              </div>
              <div class="control-group">
                <label>Max Diameter (km):</label>
                <input type="number" id="detect-max-diam" value="100" min="10" max="500">
              </div>
              <div class="control-group">
                <label>Search Radius (km):</label>
                <input type="number" id="detect-radius" value="200" min="50" max="1000">
              </div>
              <button id="run-detection" class="btn-primary">Run Detection</button>
            </div>
            <div id="detection-results" class="detection-results"></div>
            <div id="detection-stats" class="detection-stats"></div>
          </div>
        </div>
      </div>
    `;

    this.container.querySelector('#analysis-close')?.addEventListener('click', () => this.toggle());

    this.container.querySelectorAll('.analysis-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const target = (e.target as HTMLElement).dataset.tab;
        if (!target) return;
        this.switchTab(target);
      });
    });

    this.container.querySelector('#run-detection')?.addEventListener('click', () => this.runDetection());

    this.container.querySelectorAll('.age-filter-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const age = target.dataset.age || '';
        if (target.checked) {
          this.selectedAges.add(age);
        } else {
          this.selectedAges.delete(age);
        }
        this.onAgeFilterChange?.(Array.from(this.selectedAges));
        this.render();
      });
    });
  }

  private switchTab(tabId: string) {
    this.container.querySelectorAll('.analysis-tab').forEach(t => t.classList.remove('active'));
    this.container.querySelectorAll('.analysis-tab-content').forEach(c => c.classList.remove('active'));

    this.container.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');
    this.container.querySelector(`#tab-${tabId}`)?.classList.add('active');

    if (tabId === 'distribution') {
      this.renderDDRatioPlot();
      this.renderDensityGrid();
    }
  }

  private render() {
    const total = this.craters.length;
    const simple = this.craters.filter(c => c.craterClass === 'simple').length;
    const complex = this.craters.filter(c => c.craterClass === 'complex').length;
    const multiring = this.craters.filter(c => c.craterClass === 'multiring').length;

    this.container.querySelector('#stat-total')!.textContent = total.toLocaleString();
    this.container.querySelector('#stat-simple')!.textContent = simple.toLocaleString();
    this.container.querySelector('#stat-complex')!.textContent = complex.toLocaleString();
    this.container.querySelector('#stat-multiring')!.textContent = multiring.toLocaleString();

    this.renderSizeChart();
    this.renderAgeChart();
  }

  private renderSizeChart() {
    const sizeDist = calculateSizeDistribution(this.craters);
    const chart = this.container.querySelector('#size-chart');
    if (!chart) return;

    const maxVal = Math.max(...Object.values(sizeDist), 1);

    chart.innerHTML = Object.entries(sizeDist).map(([bin, count]) => {
      const pct = (count / maxVal) * 100;
      return `
        <div class="bar-row">
          <span class="bar-label">${bin}</span>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${pct}%">
              <span class="bar-value">${count.toLocaleString()}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  private renderAgeChart() {
    const ageDist = calculateAgeDistribution(this.craters);
    const chart = this.container.querySelector('#age-chart');
    if (!chart) return;

    const maxVal = Math.max(...Object.values(ageDist), 1);

    const ageColors: Record<string, string> = {
      'Copernican': '#2a9df4',
      'Eratosthenian': '#42d9a8',
      'Late Imbrian': '#ff9f43',
      'Early Imbrian': '#f06292',
      'Nectarian': '#ab47bc',
      'Pre-Nectarian': '#78909c',
      'Unknown': '#666',
    };

    chart.innerHTML = Object.entries(ageDist).map(([age, count]) => {
      const pct = (count / maxVal) * 100;
      const color = ageColors[age] || '#666';
      return `
        <div class="bar-row">
          <span class="bar-label">${age}</span>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${pct}%; background: ${color}">
              <span class="bar-value">${count.toLocaleString()}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  private renderDDRatioPlot() {
    const canvas = this.container.querySelector('#dd-ratio-plot') as HTMLCanvasElement | null;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = calculateDepthDiameterRatio(this.craters.slice(0, 500));

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#14161e';
    ctx.fillRect(0, 0, width, height);

    const maxDiam = Math.max(...data.map(d => d.diameter), 1);
    const maxRatio = Math.max(...data.map(d => d.dDRatio), 0.2);

    const classColors: Record<string, string> = {
      simple: '#4a9eff',
      complex: '#42d9a8',
      multiring: '#ff9f43',
    };

    for (const point of data) {
      const x = padding + (point.diameter / maxDiam) * (width - 2 * padding);
      const y = height - padding - (point.dDRatio / maxRatio) * (height - 2 * padding);
      const color = classColors[point.craterClass] || '#fff';

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding, padding, width - 2 * padding, height - 2 * padding);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px monospace';
    ctx.fillText('Diameter (km)', width / 2 - 30, height - 10);
    ctx.save();
    ctx.translate(12, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Depth/Diameter', 0, 0);
    ctx.restore();
  }

  private renderDensityGrid() {
    const grid = this.container.querySelector('#density-grid');
    if (!grid) return;

    const step = 30;
    const rows: { lat: number; lon: number; count: number }[] = [];

    for (let lat = -90; lat <= 90; lat += step) {
      for (let lon = -180; lon <= 180; lon += step) {
        const count = this.craters.filter(c =>
          c.lat >= lat && c.lat < lat + step &&
          c.lon >= lon && c.lon < lon + step
        ).length;
        rows.push({ lat, lon, count });
      }
    }

    const maxCount = Math.max(...rows.map(r => r.count), 1);

    grid.innerHTML = rows.map(r => {
      const intensity = r.count / maxCount;
      const bg = `rgba(42, 157, 244, ${intensity * 0.8})`;
      return `<div class="density-cell" style="background: ${bg}" title="${r.lat}° to ${r.lat + step}°, ${r.lon}° to ${r.lon + step}°: ${r.count} craters"></div>`;
    }).join('');

    (grid as HTMLElement).style.gridTemplateColumns = `repeat(${Math.ceil(360 / step)}, 1fr)`;
  }

  private runDetection() {
    const minDiam = parseFloat(this.container.querySelector('#detect-min-diam')?.getAttribute('value') || '10');
    const maxDiam = parseFloat(this.container.querySelector('#detect-max-diam')?.getAttribute('value') || '100');
    const radius = parseFloat(this.container.querySelector('#detect-radius')?.getAttribute('value') || '200');

    const centerLat = 0;
    const centerLon = 0;

    const { detections, stats } = templateMatchDemo(this.craters, centerLat, centerLon, radius, minDiam, maxDiam);
    this.detections = detections;
    this.currentStats = stats;

    const resultsEl = this.container.querySelector('#detection-results');
    const statsEl = this.container.querySelector('#detection-stats');

    if (resultsEl) {
      resultsEl.innerHTML = `
        <h5>Detections (${detections.length})</h5>
        <div class="detection-list">
          ${detections.slice(0, 20).map(d => `
            <div class="detection-item">
              <span class="detection-name">${d.diameter.toFixed(1)} km</span>
              <span class="detection-conf" style="color: ${d.confidence > 0.8 ? '#42d9a8' : d.confidence > 0.6 ? '#ff9f43' : '#f06292'}">${(d.confidence * 100).toFixed(1)}%</span>
              <span class="detection-coords">${d.lat.toFixed(2)}°, ${d.lon.toFixed(2)}°</span>
            </div>
          `).join('')}
          ${detections.length > 20 ? `<div class="detection-more">... and ${detections.length - 20} more</div>` : ''}
        </div>
      `;
    }

    if (statsEl && stats) {
      statsEl.innerHTML = `
        <div class="stats-row">
          <span>Area scanned:</span>
          <span>${stats.totalScanned.toLocaleString()} points</span>
        </div>
        <div class="stats-row">
          <span>Craters detected:</span>
          <span>${stats.detected}</span>
        </div>
        <div class="stats-row">
          <span>Processing time:</span>
          <span>${stats.processingTime.toFixed(2)} ms</span>
        </div>
        <div class="stats-row">
          <span>Avg confidence:</span>
          <span>${(stats.avgConfidence * 100).toFixed(1)}%</span>
        </div>
      `;
    }
  }
}
