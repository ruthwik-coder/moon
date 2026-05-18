import L from 'leaflet';

export interface MeasurementResult {
  type: 'distance' | 'area';
  value: number;
  unit: string;
  coordinates: [number, number][];
}

export class MeasurementTool {
  private map: L.Map;
  private drawing = false;
  private currentMode: 'distance' | 'area' | null = null;
  private markers: L.Marker[] = [];
  private lines: L.Polyline[] = [];
  private polygons: L.Polygon[] = [];
  private tooltips: L.Tooltip[] = [];
  private results: MeasurementResult[] = [];
  private panel: HTMLElement | null = null;
  private active = false;

  constructor(map: L.Map) {
    this.map = map;
  }

  activate() {
    if (this.active) return;
    this.active = true;
    this.createPanel();
    this.map.on('click', this.handleClick);
    this.map.on('dblclick', this.handleDoubleClick);
    this.map.on('contextmenu', this.handleRightClick);
    this.map.doubleClickZoom.disable();
  }

  deactivate() {
    if (!this.active) return;
    this.active = false;
    this.currentMode = null;
    this.drawing = false;
    this.map.off('click', this.handleClick);
    this.map.off('dblclick', this.handleDoubleClick);
    this.map.off('contextmenu', this.handleRightClick);
    this.map.doubleClickZoom.enable();
    this.clearCurrentDrawing();
    this.panel?.remove();
    this.panel = null;
  }

  toggle() {
    if (this.active) {
      this.deactivate();
    } else {
      this.activate();
    }
  }

  private createPanel() {
    this.panel = document.createElement('div');
    this.panel.className = 'measurement-panel';
    this.panel.innerHTML = `
      <div class="measurement-header">
        <h3>Measure</h3>
        <button class="measurement-close-btn" id="measure-close">&times;</button>
      </div>
      <div class="measurement-buttons">
        <button id="measure-distance" class="measure-btn">Distance</button>
        <button id="measure-area" class="measure-btn">Area</button>
        <button id="measure-clear" class="measure-btn measure-clear">Clear</button>
        <button id="measure-export" class="measure-btn measure-export">Export</button>
      </div>
      <div class="measurement-results" id="measure-results"></div>
    `;

    this.panel.querySelector('#measure-close')?.addEventListener('click', () => this.deactivate());
    this.panel.querySelector('#measure-distance')?.addEventListener('click', () => this.setMode('distance'));
    this.panel.querySelector('#measure-area')?.addEventListener('click', () => this.setMode('area'));
    this.panel.querySelector('#measure-clear')?.addEventListener('click', () => this.clearAll());
    this.panel.querySelector('#measure-export')?.addEventListener('click', () => this.exportMeasurements());

    document.body.appendChild(this.panel);
  }

  private setMode(mode: 'distance' | 'area') {
    this.currentMode = mode;
    this.drawing = true;
    this.clearCurrentDrawing();

    this.panel?.querySelectorAll('.measure-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    this.panel?.querySelector(`#measure-${mode}`)?.classList.add('active');
  }

  private handleClick = (e: L.LeafletMouseEvent) => {
    if (!this.drawing || !this.currentMode) return;

    const marker = L.marker(e.latlng, {
      icon: L.divIcon({
        className: 'measure-point',
        html: `<div class="measure-point-inner">${this.markers.length + 1}</div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
    }).addTo(this.map);

    this.markers.push(marker);

    if (this.markers.length > 1) {
      const coords = this.markers.map(m => m.getLatLng());
      const line = L.polyline(coords, {
        color: '#2a9df4',
        weight: 2,
        dashArray: '5, 5',
      }).addTo(this.map);
      this.lines.push(line);
    }

    if (this.currentMode === 'distance' && this.markers.length >= 2) {
      const totalDist = this.calculateTotalDistance();
      this.updateResultDisplay([{
        type: 'distance',
        value: totalDist,
        unit: totalDist > 1000 ? 'km' : 'm',
        coordinates: this.markers.map(m => [m.getLatLng().lat, m.getLatLng().lng]),
      }]);
    }
  };

  private handleDoubleClick = (e: L.LeafletMouseEvent) => {
    if (!this.drawing || !this.currentMode || this.markers.length < 2) return;

    L.DomEvent.stopPropagation(e);

    if (this.currentMode === 'distance') {
      const totalDist = this.calculateTotalDistance();
      const value = totalDist;
      const unit = value > 1000 ? 'km' : 'm';
      this.results.push({
        type: 'distance',
        value: value / (unit === 'km' ? 1000 : 1),
        unit,
        coordinates: this.markers.map(m => [m.getLatLng().lat, m.getLatLng().lng]),
      });
    } else if (this.currentMode === 'area' && this.markers.length >= 3) {
      const coords = this.markers.map(m => m.getLatLng());
      const polygon = L.polygon(coords, {
        color: '#42d9a8',
        fillColor: '#42d9a8',
        fillOpacity: 0.2,
        weight: 2,
      }).addTo(this.map);
      this.polygons.push(polygon);

      const area = this.calculateArea(coords);
      const value = area;
      const unit = value > 1000000 ? 'km²' : 'm²';
      this.results.push({
        type: 'area',
        value: value / (unit === 'km²' ? 1000000 : 1),
        unit,
        coordinates: coords.map(c => [c.lat, c.lng]),
      });
    }

    this.drawing = false;
    this.updateResultsPanel();
    this.markers = [];
    this.lines = [];
  };

  private handleRightClick = (e: L.LeafletMouseEvent) => {
    if (this.drawing) {
      this.drawing = false;
      L.DomEvent.stopPropagation(e);
    }
  };

  private calculateTotalDistance(): number {
    let total = 0;
    for (let i = 1; i < this.markers.length; i++) {
      total += this.map.distance(
        this.markers[i - 1].getLatLng(),
        this.markers[i].getLatLng()
      );
    }
    return total;
  }

  private calculateArea(coords: L.LatLng[]): number {
    if (coords.length < 3) return 0;

    const R = 6371000;
    const n = coords.length;
    let area = 0;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const lat1 = coords[i].lat * Math.PI / 180;
      const lat2 = coords[j].lat * Math.PI / 180;
      const dLon = (coords[j].lng - coords[i].lng) * Math.PI / 180;
      area += dLon * (2 + Math.sin(lat1) + Math.sin(lat2));
    }

    area = Math.abs(area * R * R / 2);
    return area;
  }

  private updateResultDisplay(results: MeasurementResult[]) {
    const container = this.panel?.querySelector('#measure-results');
    if (!container) return;

    container.innerHTML = results.map(r => {
      const displayValue = r.unit === 'km' || r.unit === 'km²' ? r.value.toFixed(2) : r.value.toFixed(0);
      return `<div class="measure-result-item">
        <span class="measure-result-type">${r.type === 'distance' ? 'Distance' : 'Area'}:</span>
        <span class="measure-result-value">${displayValue} ${r.unit}</span>
      </div>`;
    }).join('');
  }

  private updateResultsPanel() {
    this.updateResultDisplay(this.results);
  }

  private clearCurrentDrawing() {
    this.markers.forEach(m => this.map.removeLayer(m));
    this.lines.forEach(l => this.map.removeLayer(l));
    this.markers = [];
    this.lines = [];
  }

  private clearAll() {
    this.clearCurrentDrawing();
    this.polygons.forEach(p => this.map.removeLayer(p));
    this.polygons = [];
    this.results = [];
    this.updateResultsPanel();
  }

  exportMeasurements() {
    if (this.results.length === 0) return;

    const data = {
      exportDate: new Date().toISOString(),
      measurements: this.results.map(r => ({
        type: r.type,
        value: `${r.value.toFixed(2)} ${r.unit}`,
        coordinates: r.coordinates,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moon-measurements-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  getResults(): MeasurementResult[] {
    return [...this.results];
  }
}
