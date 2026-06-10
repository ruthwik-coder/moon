import L from 'leaflet';
import type { CraterMetadata } from '../features/types';
import { generateCraterGeoJSON } from '../utils/geometry';
import { createCraterPopup } from './metadata-popup';

const CLASS_COLORS: Record<string, { fill: string; border: string }> = {
  simple: { fill: '#4a9eff', border: '#2a7de1' },
  complex: { fill: '#42d9a8', border: '#2eb88a' },
  multiring: { fill: '#ff9f43', border: '#e5882f' },
};

const AGE_COLORS: Record<string, { fill: string; border: string }> = {
  'Copernican': { fill: '#2a9df4', border: '#1a7dc4' },
  'Eratosthenian': { fill: '#42d9a8', border: '#2eb88a' },
  'Late Imbrian': { fill: '#ff9f43', border: '#e5882f' },
  'Early Imbrian': { fill: '#f06292', border: '#d0417a' },
  'Nectarian': { fill: '#ab47bc', border: '#9334a0' },
  'Pre-Nectarian': { fill: '#78909c', border: '#5a7078' },
  'Unknown': { fill: '#666', border: '#444' },
};

const ZOOM_THRESHOLDS: Record<number, { minDiameter: number; maxCount: number }> = {
  0: { minDiameter: 500, maxCount: 30 },
  1: { minDiameter: 300, maxCount: 50 },
  2: { minDiameter: 200, maxCount: 100 },
  3: { minDiameter: 100, maxCount: 200 },
  4: { minDiameter: 50, maxCount: 500 },
  5: { minDiameter: 25, maxCount: 1000 },
  6: { minDiameter: 10, maxCount: 2000 },
  7: { minDiameter: 5, maxCount: 5000 },
};

export type ColorMode = 'class' | 'age';

export class CraterLayer {
  private geoJsonLayer: L.GeoJSON | null = null;
  private craters: CraterMetadata[] = [];
  private visibility = { simple: true, complex: true, multiring: true };
  private labelLayer: L.LayerGroup;
  private currentZoom = 2;
  private map: L.Map | null = null;
  private useViewportFilter = false;
  private colorMode: ColorMode = 'class';
  private ageFilter: Set<string> = new Set();

  constructor() {
    this.labelLayer = L.layerGroup();
  }

  bindMap(map: L.Map) {
    this.map = map;
    map.on('zoomend moveend', () => {
      this.currentZoom = map.getZoom();
      this.useViewportFilter = map.getZoom() >= 5;
      this.updateLayer();
    });
  }

  loadCraters(craters: CraterMetadata[]) {
    this.craters = craters;
    this.updateLayer();
  }

  setVisibility(type: 'simple' | 'complex' | 'multiring', visible: boolean) {
    this.visibility[type] = visible;
    this.updateLayer();
  }

  getVisibility() {
    return { ...this.visibility };
  }

  setColorMode(mode: ColorMode) {
    this.colorMode = mode;
    this.updateLayer();
  }

  getColorMode(): ColorMode {
    return this.colorMode;
  }

  setAgeFilter(ages: string[]) {
    this.ageFilter = new Set(ages);
    this.updateLayer();
  }

  getAgeFilter(): string[] {
    return Array.from(this.ageFilter);
  }

  private getZoomThresholds(zoom: number) {
    let best = ZOOM_THRESHOLDS[0];
    for (const [z, threshold] of Object.entries(ZOOM_THRESHOLDS)) {
      if (zoom >= parseInt(z)) {
        best = threshold;
      }
    }
    return best;
  }

  private isInViewport(crater: CraterMetadata): boolean {
    if (!this.map || !this.useViewportFilter) return true;
    const bounds = this.map.getBounds();
    return (
      crater.lat >= bounds.getSouth() &&
      crater.lat <= bounds.getNorth() &&
      crater.lon >= bounds.getWest() &&
      crater.lon <= bounds.getEast()
    );
  }

  private filterByZoom(craters: CraterMetadata[]): CraterMetadata[] {
    const { minDiameter, maxCount } = this.getZoomThresholds(this.currentZoom);

    let filtered = craters.filter(
      c => this.visibility[c.craterClass] && c.diameter >= minDiameter
    );

    if (this.ageFilter.size > 0) {
      filtered = filtered.filter(c => {
        const age = c.age || 'Unknown';
        return this.ageFilter.has(age);
      });
    }

    if (this.useViewportFilter) {
      filtered = filtered.filter(c => this.isInViewport(c));
    }

    if (filtered.length > maxCount) {
      filtered = filtered
        .sort((a, b) => b.diameter - a.diameter)
        .slice(0, maxCount);
    }

    return filtered;
  }

  private updateLayer() {
    if (this.geoJsonLayer) {
      if (this.map) this.geoJsonLayer.removeFrom(this.map);
    }

    const filtered = this.filterByZoom(this.craters);
    const features = generateCraterGeoJSON(filtered);

    this.geoJsonLayer = L.geoJSON(
      { type: 'FeatureCollection', features: features as any },
      {
        style: (feature: any) => {
          const props = feature.properties as CraterMetadata;
          let colors;

          if (this.colorMode === 'age') {
            const age = props.age || 'Unknown';
            colors = AGE_COLORS[age] || AGE_COLORS['Unknown'];
          } else {
            const craterClass = props.craterClass;
            colors = CLASS_COLORS[craterClass] || CLASS_COLORS.simple;
          }

          return {
            color: colors.border,
            fillColor: colors.fill,
            fillOpacity: 0.15,
            weight: 1.2,
            opacity: 0.8,
          };
        },
        onEachFeature: (feature: any, layer: L.Layer) => {
          const props = feature.properties as CraterMetadata;
          layer.on('click', () => {
            (layer as any).openPopup();
          });
          layer.bindPopup(createCraterPopup(props), {
            maxWidth: 280,
            className: 'crater-popup',
          });
        },
      }
    );

    if (this.map) {
      this.geoJsonLayer.addTo(this.map);
    }

    this.updateLabels(filtered);
  }

  private updateLabels(filteredCraters: CraterMetadata[]) {
    this.labelLayer.clearLayers();

    const labeled = filteredCraters.filter(c => c.diameter >= 50);

    labeled.forEach(crater => {
      const icon = L.divIcon({
        className: 'crater-label',
        html: `<span>${crater.name}</span>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      this.labelLayer.addLayer(L.marker([crater.lat, crater.lon], { icon }));
    });
  }

  getGeoJsonLayer(): L.GeoJSON | null {
    return this.geoJsonLayer;
  }

  getLabelLayer(): L.LayerGroup {
    return this.labelLayer;
  }

  getCraterCount(): number {
    if (!this.geoJsonLayer) return 0;
    return this.geoJsonLayer.getLayers().length;
  }
}
