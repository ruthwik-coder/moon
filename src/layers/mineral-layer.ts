import L from 'leaflet';
import { MineralDeposit, MINERAL_DEPOSITS, MINERAL_COLORS } from '../features/mineral-data';

export class MineralLayer {
  private layerGroup: L.LayerGroup;
  private visible = true;
  private typeVisibility: Map<string, boolean>;
  private map: L.Map | null = null;

  constructor() {
    this.layerGroup = L.layerGroup();
    this.typeVisibility = new Map();
    for (const type of [...new Set(MINERAL_DEPOSITS.map(d => d.type))]) {
      this.typeVisibility.set(type, true);
    }
    this.build();
  }

  private build() {
    this.layerGroup.clearLayers();

    for (const deposit of MINERAL_DEPOSITS) {
      if (!this.typeVisibility.get(deposit.type)) continue;

      const latLng = L.latLng(deposit.lat, deposit.lng);
      const color = MINERAL_COLORS[deposit.type] || '#fff';

      const circle = L.circle(latLng, {
        radius: deposit.radiusKm * 1000,
        color,
        weight: 2,
        opacity: 0.6,
        fillColor: color,
        fillOpacity: 0.15,
      });

      const popupContent = `
        <div class="mineral-popup-content">
          <h4 style="color:${color};margin:0 0 8px 0">${deposit.name}</h4>
          <div class="popup-section">
            <span class="popup-label">Type</span>
            <span style="color:${color};font-weight:600">${deposit.type}</span>
          </div>
          <div class="popup-section">
            <span class="popup-label">Abundance</span>
            <span style="font-family:monospace;font-size:13px">${deposit.abundance}</span>
          </div>
          <div class="popup-section">
            <span class="popup-label">Region radius</span>
            <span style="font-family:monospace">${deposit.radiusKm.toLocaleString()} km</span>
          </div>
          <div class="popup-section" style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.1)">
            <span class="popup-label">Geologic Context</span>
            <span style="font-size:12px;color:#9ca3af;font-style:italic">${deposit.geologicContext}</span>
          </div>
        </div>
      `;

      circle.bindPopup(popupContent, { className: 'mineral-popup', maxWidth: 300 });
      this.layerGroup.addLayer(circle);
    }
  }

  setTypeVisibility(type: string, visible: boolean) {
    this.typeVisibility.set(type, visible);
    this.build();
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
