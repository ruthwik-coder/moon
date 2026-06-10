import { ImageViewer } from './image-viewer';
import { getOpenCVStatus, autoLoadOpenCV } from '../image-processing/opencv-loader';
import {
  captureViewport,
  toGrayscale,
  sobelEdgeDetection,
  histogramEqualization,
  gaussianBlur,
  sharpen,
  adjustBrightnessContrast,
  cannyWithOpenCV,
  claheWithOpenCV,
  DetectionOptions,
  getDetectionDefaults,
} from '../image-processing/processors';
import {
  detectCratersFromViewport,
  createDetectionOverlay,
  addDetectionToMap,
  removeDetectionFromMap,
} from '../image-processing/crater-detector';

export class ProcessingPanel {
  private container: HTMLElement;
  private isVisible = false;
  private map: L.Map;
  private originalCanvas: HTMLCanvasElement | null = null;
  private detectionOverlay: ReturnType<typeof createDetectionOverlay> | null = null;
  private opencvReady = false;
  private detectionRunning = false;
  private imageViewer: ImageViewer;

  constructor(map: L.Map) {
    this.map = map;
    this.imageViewer = new ImageViewer();
    this.container = document.createElement('div');
    this.container.className = 'processing-panel';
    this.buildPanel();
    document.body.appendChild(this.container);
    autoLoadOpenCV();
  }

  toggle() {
    this.isVisible = !this.isVisible;
    this.container.classList.toggle('visible', this.isVisible);
    if (this.isVisible) {
      this.refreshPreview();
      this.pollOpenCVStatus();
    }
  }

  private pollOpenCVStatus() {
    const check = () => {
      this.updateOpenCVStatus();
      if (!this.opencvReady) {
        setTimeout(check, 1000);
      }
    };
    setTimeout(check, 500);
  }

  private buildPanel() {
    this.container.innerHTML = `
      <div class="processing-header">
        <h3><span class="processing-icon">◉</span> Image Analysis</h3>
        <div class="processing-header-actions">
          <span class="opencv-status" id="opencv-status">CV: loading...</span>
          <button class="processing-close" id="processing-close">&times;</button>
        </div>
      </div>

      <div class="processing-tabs">
        <button class="processing-tab active" data-tab="enhance">1. Enhance</button>
        <button class="processing-tab" data-tab="detect">2. Detect</button>
        <button class="processing-tab" data-tab="edges">3. Edges</button>
      </div>

      <div class="processing-content">
        <!-- ===== TAB 1: ENHANCE ===== -->
        <div class="processing-tab-content active" id="process-tab-enhance">
          <div class="process-description">
            <strong>Improve moon imagery</strong> — Adjust brightness/contrast, convert to grayscale,
            or apply filters. The left canvas shows the original map view; the right shows your edits.
            Click <strong>"Apply to View"</strong> to overlay the result on the map.
          </div>

          <div class="processing-preview-area">
            <div class="preview-container">
              <canvas id="process-preview" width="400" height="300"></canvas>
              <span class="preview-label">Original</span>
            </div>
            <div class="preview-container">
              <canvas id="process-result" width="400" height="300"></canvas>
              <span class="preview-label">Processed</span>
            </div>
          </div>
          <p class="enhance-status process-status"></p>

          <button class="btn-primary btn-refresh" id="refresh-preview-btn">⟳ Refresh from Map</button>

          <div class="process-controls">
            <div class="control-group">
              <label>Brightness</label>
              <input type="range" id="ctrl-brightness" min="-100" max="100" value="0">
              <span class="ctrl-value" id="val-brightness">0</span>
            </div>
            <div class="control-group">
              <label>Contrast</label>
              <input type="range" id="ctrl-contrast" min="-100" max="100" value="0">
              <span class="ctrl-value" id="val-contrast">0</span>
            </div>
            <div class="control-group">
              <label>Grayscale</label>
              <input type="checkbox" id="ctrl-grayscale">
            </div>
            <div class="control-group">
              <label>Equalize (fix lighting)</label>
              <input type="checkbox" id="ctrl-hist-eq">
            </div>
            <div class="control-group">
              <label>Gaussian Blur (denoise)</label>
              <input type="checkbox" id="ctrl-blur">
            </div>
            <div class="control-group">
              <label>Sharpen (enhance edges)</label>
              <input type="checkbox" id="ctrl-sharpen">
            </div>
          </div>

          <button class="btn-primary" id="apply-enhance-btn">Apply to View</button>
        </div>

        <!-- ===== TAB 2: DETECT ===== -->
        <div class="processing-tab-content" id="process-tab-detect">
          <div class="process-description">
            <strong>Auto-detect craters</strong> from the current map view. The algorithm captures
            the visible area, runs edge detection, and finds circular features using
            <strong>OpenCV's Hough Circle Transform</strong> (if loaded) or a Canvas fallback.
            <br><br>
            <strong>Tips:</strong>
            <ul style="margin:4px 0 0 16px;font-size:11px;color:#9ca3af">
              <li>Zoom in on a crater-rich area (zoom 4-6) for best results</li>
              <li>Adjust "Min/Max radius" to match crater sizes you see</li>
              <li>Lower Canny thresholds = more edges detected</li>
              <li>Lower "param2" = more circles found (but more noise)</li>
            </ul>
          </div>

          <div class="process-controls">
            <div class="control-group">
              <label>Min radius (pixels)</label>
              <input type="number" id="detect-min-radius" value="5" min="3" max="200">
            </div>
            <div class="control-group">
              <label>Max radius (pixels)</label>
              <input type="number" id="detect-max-radius" value="80" min="5" max="300">
            </div>
            <div class="control-group">
              <label>Canny low threshold</label>
              <input type="number" id="detect-canny-low" value="50" min="10" max="300">
            </div>
            <div class="control-group">
              <label>Canny high threshold</label>
              <input type="number" id="detect-canny-high" value="150" min="50" max="500">
            </div>
            <div class="control-group">
              <label>Hough min distance</label>
              <input type="number" id="detect-min-dist" value="20" min="5" max="200">
            </div>
            <div class="control-group">
              <label>Hough sensitivity (param2)</label>
              <input type="number" id="detect-param2" value="30" min="10" max="200">
            </div>
          </div>

          <div style="display:flex;gap:8px;margin-bottom:12px">
            <button class="btn-primary" id="run-detection-btn" style="flex:2">🔍 Run Detection</button>
            <button class="btn-secondary" id="clear-detection-btn" style="flex:1">Clear</button>
          </div>

          <div class="detection-info" id="detection-info">
            <p class="detection-idle">Click <strong>"Run Detection"</strong> to analyze the current view for craters. Results will appear as colored circles on the map.</p>
          </div>

          <div class="detection-results-list" id="detection-results-list"></div>
        </div>

        <!-- ===== TAB 3: EDGES ===== -->
        <div class="processing-tab-content" id="process-tab-edges">
          <div class="process-description">
            <strong>Visualize edges</strong> in the moon imagery. Edge detection highlights boundaries
            between different terrain features — crater rims, ridges, and fault lines.
            <br><br>
            <strong>Methods:</strong>
            <ul style="margin:4px 0 0 16px;font-size:11px;color:#9ca3af">
              <li><strong>Sobel</strong> — Simple gradient-based; works without OpenCV</li>
              <li><strong>Canny</strong> — Multi-stage algorithm; needs OpenCV loaded</li>
            </ul>
          </div>

          <div class="process-controls">
            <div class="control-group">
              <label>Method</label>
              <select id="edge-method">
                <option value="sobel">Sobel (always available)</option>
                <option value="canny">Canny (needs OpenCV)</option>
              </select>
            </div>
            <div class="control-group" id="canny-low-controls" style="display:none">
              <label>Low threshold</label>
              <input type="range" id="canny-low" min="10" max="300" value="50">
              <span class="ctrl-value" id="val-canny-low">50</span>
            </div>
            <div class="control-group" id="canny-high-controls" style="display:none">
              <label>High threshold</label>
              <input type="range" id="canny-high" min="50" max="500" value="150">
              <span class="ctrl-value" id="val-canny-high">150</span>
            </div>
          </div>

          <div style="display:flex;gap:8px;margin-bottom:12px">
            <button class="btn-primary" id="run-edges-btn" style="flex:2">Show Edges</button>
            <button class="btn-secondary" id="clear-edges-btn" style="flex:1">Clear</button>
          </div>

          <div class="edges-result" id="edges-result">
            <canvas id="edges-canvas" width="400" height="300"></canvas>
          </div>
          <p class="edges-status process-status"></p>
        </div>
      </div>
    `;

    this.setupEventListeners();
    this.updateOpenCVStatus();
  }

  private setupEventListeners() {
    this.container.querySelector('#processing-close')?.addEventListener('click', () => this.toggle());

    this.container.querySelectorAll('.processing-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const target = (e.target as HTMLElement).dataset.tab;
        if (target) this.switchTab(target);
      });
    });

    const previewEl = this.container.querySelector('#process-preview') as HTMLElement;
    if (previewEl) {
      previewEl.addEventListener('click', () => {
        const preview = this.container.querySelector('#process-preview') as HTMLCanvasElement;
        if (preview) this.imageViewer.open(preview);
      });
      previewEl.style.cursor = 'pointer';
      previewEl.title = 'Click to view full size';
    }

    const resultPreview = this.container.querySelector('#process-result') as HTMLElement;
    if (resultPreview) {
      resultPreview.addEventListener('click', () => {
        const result = this.container.querySelector('#process-result') as HTMLCanvasElement;
        if (result) this.imageViewer.open(result);
      });
      resultPreview.style.cursor = 'pointer';
      resultPreview.title = 'Click to view full size';
    }

    this.container.querySelector('#refresh-preview-btn')?.addEventListener('click', () => this.refreshPreview());

    this.container.querySelector('#ctrl-brightness')?.addEventListener('input', () => this.applyEnhancements());
    this.container.querySelector('#ctrl-contrast')?.addEventListener('input', () => this.applyEnhancements());
    this.container.querySelector('#ctrl-grayscale')?.addEventListener('change', () => this.applyEnhancements());
    this.container.querySelector('#ctrl-hist-eq')?.addEventListener('change', () => this.applyEnhancements());
    this.container.querySelector('#ctrl-blur')?.addEventListener('change', () => this.applyEnhancements());
    this.container.querySelector('#ctrl-sharpen')?.addEventListener('change', () => this.applyEnhancements());

    this.container.querySelector('#apply-enhance-btn')?.addEventListener('click', () => this.applyToView());
    this.container.querySelector('#run-detection-btn')?.addEventListener('click', () => this.runDetection());
    this.container.querySelector('#clear-detection-btn')?.addEventListener('click', () => this.clearDetection());

    this.container.querySelector('#edge-method')?.addEventListener('change', (e) => {
      const method = (e.target as HTMLSelectElement).value;
      const low = this.container.querySelector('#canny-low-controls') as HTMLElement;
      const high = this.container.querySelector('#canny-high-controls') as HTMLElement;
      if (low) low.style.display = method === 'canny' ? 'flex' : 'none';
      if (high) high.style.display = method === 'canny' ? 'flex' : 'none';
    });

    this.container.querySelector('#canny-low')?.addEventListener('input', (e) => {
      const el = this.container.querySelector('#val-canny-low');
      if (el) el.textContent = (e.target as HTMLInputElement).value;
    });
    this.container.querySelector('#canny-high')?.addEventListener('input', (e) => {
      const el = this.container.querySelector('#val-canny-high');
      if (el) el.textContent = (e.target as HTMLInputElement).value;
    });

    this.container.querySelector('#run-edges-btn')?.addEventListener('click', () => this.showEdges());
    this.container.querySelector('#clear-edges-btn')?.addEventListener('click', () => this.clearEdges());
  }

  private updateOpenCVStatus() {
    const statusEl = this.container.querySelector('#opencv-status');
    if (!statusEl) return;

    const status = getOpenCVStatus();
    if (status === 'loaded') {
      statusEl.textContent = 'CV: ready ✓';
      statusEl.className = 'opencv-status opencv-ready';
      this.opencvReady = true;
    } else if (status === 'loading') {
      statusEl.textContent = 'CV: loading OpenCV.js (~8MB)...';
      statusEl.className = 'opencv-status opencv-loading';
    } else if (status === 'error') {
      statusEl.textContent = 'CV: unavailable (Canvas fallback)';
      statusEl.className = 'opencv-status opencv-unavailable';
    } else {
      statusEl.textContent = 'CV: starting...';
      statusEl.className = 'opencv-status opencv-loading';
    }
  }

  private async refreshPreview() {
    const canvas = await captureViewport(this.map, 400, 300);
    this.originalCanvas = canvas;

    const previewEl = this.container.querySelector('#process-preview') as HTMLCanvasElement;
    if (previewEl) {
      previewEl.getContext('2d')?.drawImage(canvas, 0, 0);
    }
    const resultEl = this.container.querySelector('#process-result') as HTMLCanvasElement;
    if (resultEl) {
      resultEl.getContext('2d')?.drawImage(canvas, 0, 0);
    }
    const edgesCanvas = this.container.querySelector('#edges-canvas') as HTMLCanvasElement;
    if (edgesCanvas) {
      edgesCanvas.getContext('2d')?.drawImage(canvas, 0, 0);
    }
  }

  private async applyEnhancements() {
    if (!this.originalCanvas) return;

    const brightness = parseInt(
      (this.container.querySelector('#ctrl-brightness') as HTMLInputElement)?.value || '0'
    );
    const contrast = parseInt(
      (this.container.querySelector('#ctrl-contrast') as HTMLInputElement)?.value || '0'
    );
    const grayscale = (this.container.querySelector('#ctrl-grayscale') as HTMLInputElement)?.checked || false;
    const histEq = (this.container.querySelector('#ctrl-hist-eq') as HTMLInputElement)?.checked || false;
    const blur = (this.container.querySelector('#ctrl-blur') as HTMLInputElement)?.checked || false;
    const doSharpen = (this.container.querySelector('#ctrl-sharpen') as HTMLInputElement)?.checked || false;

    const vB = this.container.querySelector('#val-brightness');
    const vC = this.container.querySelector('#val-contrast');
    if (vB) vB.textContent = brightness.toString();
    if (vC) vC.textContent = contrast.toString();

    const ctx = document.createElement('canvas').getContext('2d')!;
    ctx.canvas.width = this.originalCanvas.width;
    ctx.canvas.height = this.originalCanvas.height;
    ctx.drawImage(this.originalCanvas, 0, 0);

    let imageData: ImageData;
    try {
      imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    } catch (e) {
      const msg = this.container.querySelector('.enhance-status');
      if (msg) msg.textContent = 'Cannot process: map tiles blocked by browser (cross-origin).';
      return;
    }

    if (brightness !== 0 || contrast !== 0) {
      imageData = adjustBrightnessContrast(imageData, brightness, contrast);
    }
    if (grayscale) imageData = toGrayscale(imageData);
    if (histEq) imageData = histogramEqualization(imageData);
    if (blur) {
      ctx.putImageData(imageData, 0, 0);
      try { imageData = gaussianBlur(ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)); } catch {}
    }
    if (doSharpen) {
      ctx.putImageData(imageData, 0, 0);
      try { imageData = sharpen(ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)); } catch {}
    }

    ctx.putImageData(imageData, 0, 0);

    const resultEl = this.container.querySelector('#process-result') as HTMLCanvasElement;
    if (resultEl) {
      const rctx = resultEl.getContext('2d');
      if (rctx) {
        resultEl.width = ctx.canvas.width;
        resultEl.height = ctx.canvas.height;
        rctx.drawImage(ctx.canvas, 0, 0);
      }
    }
  }

  private applyToView() {
    const resultEl = this.container.querySelector('#process-result') as HTMLCanvasElement;
    if (!resultEl) return;

    let dataUrl: string;
    try {
      dataUrl = resultEl.toDataURL('image/png');
    } catch {
      const msg = this.container.querySelector('.enhance-status');
      if (msg) msg.textContent = 'Cannot overlay: cross-origin tiles blocked by browser.';
      return;
    }

    const img = document.createElement('img');
    img.src = dataUrl;
    img.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;opacity:0.65;pointer-events:none;object-fit:contain';
    img.id = 'process-overlay-img';

    const existing = document.getElementById('process-overlay-img');
    if (existing) existing.remove();

    document.body.appendChild(img);
  }

  private async runDetection() {
    if (this.detectionRunning) return;
    this.detectionRunning = true;

    const infoEl = this.container.querySelector('#detection-info');
    const listEl = this.container.querySelector('#detection-results-list');

    if (infoEl) {
      infoEl.innerHTML = `<p class="detection-running">⏳ Running detection on map viewport...</p>`;
    }
    if (listEl) listEl.innerHTML = '';

    const minRadius = parseInt((this.container.querySelector('#detect-min-radius') as HTMLInputElement)?.value || '5');
    const maxRadius = parseInt((this.container.querySelector('#detect-max-radius') as HTMLInputElement)?.value || '80');
    const cannyLow = parseInt((this.container.querySelector('#detect-canny-low') as HTMLInputElement)?.value || '50');
    const cannyHigh = parseInt((this.container.querySelector('#detect-canny-high') as HTMLInputElement)?.value || '150');
    const houghMinDist = parseInt((this.container.querySelector('#detect-min-dist') as HTMLInputElement)?.value || '20');
    const houghParam2 = parseInt((this.container.querySelector('#detect-param2') as HTMLInputElement)?.value || '30');

    const options: Partial<DetectionOptions> = { minRadius, maxRadius, cannyLow, cannyHigh, houghMinDist, houghParam2 };

    let result;
    try {
      result = await Promise.race([
        detectCratersFromViewport(this.map, options),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Detection timed out after 8s')), 8000)),
      ]);
    } catch (err: any) {
      if (infoEl) {
        infoEl.innerHTML = `<p class="detection-running" style="color:#f06292">Error: ${err.message || 'Detection failed'}</p>`;
      }
      this.detectionRunning = false;
      return;
    }

    if (!result) {
      if (infoEl) {
        infoEl.innerHTML = '<p class="detection-running" style="color:#ff9f43">No results returned. Try adjusting parameters.</p>';
      }
      this.detectionRunning = false;
      return;
    }

    this.clearDetection();
    this.detectionOverlay = createDetectionOverlay(result.craters, this.map);
    addDetectionToMap(this.detectionOverlay, this.map);

    if (infoEl) {
      infoEl.innerHTML = `
        <div class="detection-summary">
          <div class="detection-stat">
            <span class="detection-stat-value">${result.craters.length}</span>
            <span class="detection-stat-label">Craters found</span>
          </div>
          <div class="detection-stat">
            <span class="detection-stat-value">${result.processingTime}ms</span>
            <span class="detection-stat-label">Processing time</span>
          </div>
          <div class="detection-stat">
            <span class="detection-stat-value">${result.method === 'opencv-hough' ? 'OpenCV' : 'Canvas'}</span>
            <span class="detection-stat-label">Engine</span>
          </div>
        </div>
      `;
    }

    if (listEl) {
      if (result.craters.length === 0) {
        listEl.innerHTML = '<p class="detection-none">No craters detected. Try zooming in on a cratered area (zoom 4+) or adjusting parameters.</p>';
      } else {
        listEl.innerHTML = `
          <div class="detection-list-header">
            <span>Size</span>
            <span>Confidence</span>
            <span>Position</span>
          </div>
          ${result.craters.slice(0, 30).map(c => {
            const color = c.confidence > 0.8 ? '#42d9a8' : c.confidence > 0.6 ? '#ff9f43' : '#f06292';
            return `<div class="detection-list-item" data-lat="${c.lat}" data-lon="${c.lon}">
              <span class="detection-size">${c.diameterKm.toFixed(1)} km</span>
              <span class="detection-conf" style="color:${color}">${(c.confidence * 100).toFixed(0)}%</span>
              <span class="detection-pos">${c.lat.toFixed(2)}°, ${c.lon.toFixed(2)}°</span>
            </div>`;
          }).join('')}
          ${result.craters.length > 30 ? `<p class="detection-more-text">... and ${result.craters.length - 30} more</p>` : ''}
        `;

        listEl.querySelectorAll('.detection-list-item').forEach(el => {
          el.addEventListener('click', () => {
            this.map.flyTo([
              parseFloat(el.getAttribute('data-lat')!),
              parseFloat(el.getAttribute('data-lon')!),
            ], 6, { duration: 0.5 });
          });
        });
      }
    }

    this.detectionRunning = false;
  }

  private clearDetection() {
    if (this.detectionOverlay) {
      removeDetectionFromMap(this.detectionOverlay, this.map);
      this.detectionOverlay = null;
    }
    const infoEl = this.container.querySelector('#detection-info');
    if (infoEl) {
      infoEl.innerHTML = '<p class="detection-idle">Click <strong>"Run Detection"</strong> to analyze the current view.</p>';
    }
    const listEl = this.container.querySelector('#detection-results-list');
    if (listEl) listEl.innerHTML = '';
  }

  private async showEdges() {
    const method = (this.container.querySelector('#edge-method') as HTMLSelectElement)?.value || 'sobel';
    const edgesCanvas = this.container.querySelector('#edges-canvas') as HTMLCanvasElement;
    if (!edgesCanvas) return;

    const canvas = await captureViewport(this.map, 400, 300);

    if (method === 'canny' && this.opencvReady) {
      const low = parseInt((this.container.querySelector('#canny-low') as HTMLInputElement)?.value || '50');
      const high = parseInt((this.container.querySelector('#canny-high') as HTMLInputElement)?.value || '150');
      const result = await cannyWithOpenCV(canvas, low, high);
      if (result) {
        const ctx = edgesCanvas.getContext('2d');
        if (ctx) {
          edgesCanvas.width = result.width;
          edgesCanvas.height = result.height;
          ctx.drawImage(result, 0, 0);
        }
        return;
      }
    }

    const ctx = document.createElement('canvas').getContext('2d')!;
    ctx.canvas.width = canvas.width;
    ctx.canvas.height = canvas.height;
    ctx.drawImage(canvas, 0, 0);
    let imageData: ImageData;
    try {
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (e) {
      const msg = this.container.querySelector('.edges-status');
      if (msg) msg.textContent = 'Cannot process: cross-origin tiles blocked by browser.';
      return;
    }
    const edges = sobelEdgeDetection(imageData);
    ctx.putImageData(edges, 0, 0);

    const ectx = edgesCanvas.getContext('2d');
    if (ectx) {
      edgesCanvas.width = canvas.width;
      edgesCanvas.height = canvas.height;
      ectx.drawImage(ctx.canvas, 0, 0);
    }
  }

  private clearEdges() {
    const edgesCanvas = this.container.querySelector('#edges-canvas') as HTMLCanvasElement;
    if (!edgesCanvas) return;
    const ctx = edgesCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, edgesCanvas.width, edgesCanvas.height);
    }
  }

  private switchTab(tabId: string) {
    this.container.querySelectorAll('.processing-tab').forEach(t => t.classList.remove('active'));
    this.container.querySelectorAll('.processing-tab-content').forEach(c => c.classList.remove('active'));

    this.container.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');
    this.container.querySelector(`#process-tab-${tabId}`)?.classList.add('active');

    if (tabId === 'enhance') this.refreshPreview();
  }
}
