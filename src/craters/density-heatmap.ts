import L from 'leaflet';
import type { CraterMetadata } from '../features/types';

interface HeatmapOptions {
  radius: number;
  blur: number;
  maxOpacity: number;
  minZoom: number;
  maxZoom: number;
  gradient: Record<number, string>;
}

const DEFAULT_OPTIONS: HeatmapOptions = {
  radius: 25,
  blur: 12,
  maxOpacity: 0.5,
  minZoom: 1,
  maxZoom: 5,
  gradient: {
    0: 'rgba(0,0,255,0)',
    0.25: 'rgba(0,100,255,0.5)',
    0.5: 'rgba(0,255,100,0.7)',
    0.75: 'rgba(255,255,0,0.8)',
    1.0: 'rgba(255,50,0,0.9)',
  },
};

export class DensityHeatmap {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private container: HTMLDivElement;
  private map: L.Map | null = null;
  private craters: CraterMetadata[] = [];
  private visible = true;
  private options: HeatmapOptions;
  private renderTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastHash = '';

  constructor(options: Partial<HeatmapOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d')!;
    this.container = document.createElement('div');
    this.container.style.cssText = 'pointer-events:none;position:absolute;top:0;left:0;width:100%;height:100%;';
    this.container.appendChild(this.canvas);
  }

  addTo(map: L.Map) {
    this.map = map;
    const pane = map.getPanes().overlayPane;
    pane.appendChild(this.container);
    map.on('moveend zoomend resize', this.scheduleRender, this);
    this.updateCanvasSize();
    this.scheduleRender();
  }

  removeFrom() {
    if (this.map) {
      this.map.off('moveend zoomend resize', this.scheduleRender, this);
      if (this.renderTimeout) clearTimeout(this.renderTimeout);
      this.container.remove();
      this.map = null;
    }
  }

  setVisible(visible: boolean) {
    this.visible = visible;
    this.container.style.display = visible && this.shouldRender() ? 'block' : 'none';
    if (visible && this.map) this.scheduleRender();
  }

  loadCraters(craters: CraterMetadata[]) {
    this.craters = craters;
    this.scheduleRender();
  }

  private shouldRender(): boolean {
    if (!this.map || !this.visible) return false;
    const zoom = this.map.getZoom();
    return zoom >= this.options.minZoom && zoom <= this.options.maxZoom;
  }

  private getViewportCraters(): CraterMetadata[] {
    if (!this.map) return [];
    const zoom = this.map.getZoom();
    const bounds = this.map.getBounds();

    const minDiameter = zoom < 2 ? 200 : zoom < 3 ? 100 : zoom < 4 ? 50 : 15;

    const filtered = this.craters.filter(c => {
      if (c.diameter < minDiameter) return false;
      return (
        c.lat >= bounds.getSouth() - 5 &&
        c.lat <= bounds.getNorth() + 5 &&
        c.lon >= bounds.getWest() - 5 &&
        c.lon <= bounds.getEast() + 5
      );
    });

    if (filtered.length > 300) {
      return filtered.sort((a, b) => b.diameter - a.diameter).slice(0, 300);
    }
    return filtered;
  }

  private scheduleRender = () => {
    if (!this.map) return;

    if (!this.shouldRender()) {
      this.container.style.display = 'none';
      return;
    }
    this.container.style.display = 'block';

    const hash = `${this.map.getZoom()}-${this.map.getCenter().lat.toFixed(1)}-${this.map.getCenter().lng.toFixed(1)}`;
    if (hash === this.lastHash) return;
    this.lastHash = hash;

    if (this.renderTimeout) clearTimeout(this.renderTimeout);
    this.renderTimeout = setTimeout(this.render, 50);
  };

  private updateCanvasSize() {
    if (!this.map) return;
    const size = this.map.getSize();
    this.canvas.width = size.x;
    this.canvas.height = size.y;
    this.canvas.style.width = size.x + 'px';
    this.canvas.style.height = size.y + 'px';
  }

  private render = () => {
    if (!this.map || !this.visible || !this.shouldRender()) return;
    this.updateCanvasSize();

    const craters = this.getViewportCraters();
    if (craters.length === 0) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    const zoom = this.map.getZoom();
    const radius = this.options.radius * (1 + (4 - zoom) * 0.4);

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.filter = `blur(${this.options.blur}px)`;

    for (const crater of craters) {
      const point = this.map!.latLngToContainerPoint([crater.lat, crater.lon]);
      if (point.x < -radius * 2 || point.x > this.canvas.width + radius * 2 ||
          point.y < -radius * 2 || point.y > this.canvas.height + radius * 2) continue;

      const weight = Math.min(1, 0.3 + (crater.diameter / 300) * 0.7);

      this.context.fillStyle = `rgba(255,150,0,${weight * 0.6})`;
      this.context.beginPath();
      this.context.arc(point.x, point.y, radius, 0, Math.PI * 2);
      this.context.fill();
    }

    this.context.filter = 'none';

    const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.applyGradient(imageData);
    this.context.putImageData(imageData, 0, 0);
  };

  private applyGradient(imageData: ImageData) {
    const data = imageData.data;
    const maxAlpha = this.options.maxOpacity * 255;
    const stops = Object.keys(this.options.gradient).map(Number).sort((a, b) => a - b);

    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) {
        const intensity = Math.min(1, data[i] / 255);
        let color;
        if (intensity <= stops[0]) {
          color = this.parseColor(this.options.gradient[stops[0]]);
        } else if (intensity >= stops[stops.length - 1]) {
          color = this.parseColor(this.options.gradient[stops[stops.length - 1]]);
        } else {
          for (let j = 1; j < stops.length; j++) {
            if (intensity <= stops[j]) {
              const lower = this.parseColor(this.options.gradient[stops[j - 1]]);
              const upper = this.parseColor(this.options.gradient[stops[j]]);
              const t = (intensity - stops[j - 1]) / (stops[j] - stops[j - 1]);
              color = {
                r: lower.r + (upper.r - lower.r) * t,
                g: lower.g + (upper.g - lower.g) * t,
                b: lower.b + (upper.b - lower.b) * t,
                a: lower.a + (upper.a - lower.a) * t,
              };
              break;
            }
          }
        }
        if (color) {
          data[i - 3] = Math.round(color.r);
          data[i - 2] = Math.round(color.g);
          data[i - 1] = Math.round(color.b);
          data[i] = Math.round(color.a * maxAlpha);
        }
      }
    }
  }

  private parseColor(colorStr: string): { r: number; g: number; b: number; a: number } {
    const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) return { r: 0, g: 0, b: 0, a: 0 };
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3]),
      a: parseFloat(match[4] ?? '1'),
    };
  }
}
