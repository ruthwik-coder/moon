import L from 'leaflet';
import type { LandingZone } from '../features/types';
import { LANDING_ZONES } from '../features/landing-data';

const ZONE_COLORS: Record<string, { border: string; fill: string }> = {
  mare: { border: '#42d9a8', fill: '#42d9a8' },
  highland: { border: '#ff9f43', fill: '#ff9f43' },
};

export class SafeLandingLayer {
  private layerGroup: L.LayerGroup;
  private visible = true;
  private map: L.Map | null = null;

  constructor() {
    this.layerGroup = L.layerGroup();
    this.build();
  }

  private build() {
    this.layerGroup.clearLayers();

    for (const zone of LANDING_ZONES) {
      const colors = ZONE_COLORS[zone.type] || ZONE_COLORS.mare;

      const polygon = L.polygon(zone.coordinates.map(([lat, lon]) => [lat, lon]), {
        color: colors.border,
        fillColor: colors.fill,
        fillOpacity: 0.12,
        weight: 2,
        opacity: 0.7,
      });

      const popupContent = `
        <div class="landing-popup-content">
          <h4 style="color:${colors.border};margin:0 0 6px 0">${zone.name}</h4>
          <div class="popup-section">
            <span class="popup-label">Type</span>
            <span style="text-transform:capitalize">${zone.type}</span>
          </div>
          <div class="popup-section">
            <span class="popup-label">Description</span>
            <span style="font-size:12px;color:#9ca3af">${zone.description}</span>
          </div>
          <div class="popup-section">
            <span class="popup-label">Hazards</span>
            <span style="font-size:12px;color:#ff9f43">${zone.hazards}</span>
          </div>
          <div class="popup-section" style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1)">
            <span class="popup-label">Suitability</span>
            <span style="font-size:12px;color:#9ca3af;font-style:italic">${zone.suitability}</span>
          </div>
        </div>
      `;

      polygon.bindPopup(popupContent, { className: 'landing-popup', maxWidth: 320 });
      this.layerGroup.addLayer(polygon);
    }
  }

  addTo(map: L.Map) {
    this.map = map;
    this.layerGroup.addTo(map);
  }

  removeFrom() {
    this.map = null;
    this.layerGroup.remove();
  }

  setVisible(visible: boolean) {
    this.visible = visible;
    if (visible && this.map) {
      this.layerGroup.addTo(this.map);
    } else {
      this.layerGroup.remove();
    }
  }

  getLayerGroup(): L.LayerGroup {
    return this.layerGroup;
  }
}
