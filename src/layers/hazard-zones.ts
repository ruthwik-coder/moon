import L from 'leaflet';
import type { HazardZone } from '../features/types';

const HAZARD_COLORS: Record<string, string> = {
  steep_slope: '#ff4444',
  high_density: '#ffaa00',
  shadow: '#4444ff',
  rough_terrain: '#ff44aa',
};

const HAZARD_ZONES: HazardZone[] = [
  {
    name: 'Shackleton Permanent Shadow',
    type: 'shadow',
    coordinates: [
      [-89.5, 120], [-89.5, 132], [-89.7, 132], [-89.7, 120], [-89.5, 120]
    ],
    reason: 'Permanently shadowed region, extreme cold, no solar illumination',
  },
  {
    name: 'Tycho Ray Zone',
    type: 'high_density',
    coordinates: [
      [40, -15], [40, -7], [47, -7], [47, -15], [40, -15]
    ],
    reason: 'High secondary crater density from Tycho rays',
  },
  {
    name: 'Aristarchus Plateau',
    type: 'rough_terrain',
    coordinates: [
      [21, -52], [21, -43], [26, -43], [26, -52], [21, -52]
    ],
    reason: 'Complex volcanic terrain with numerous vents and grooves',
  },
  {
    name: 'South Pole-Aitken Steep Slopes',
    type: 'steep_slope',
    coordinates: [
      [-60, -180], [-60, -158], [-45, -158], [-45, -180], [-60, -180]
    ],
    reason: 'Extreme topographic relief, slopes > 30°',
  },
  {
    name: 'Mare Orientale Rim',
    type: 'steep_slope',
    coordinates: [
      [-24, -100], [-24, -89], [-14, -89], [-14, -100], [-24, -100]
    ],
    reason: 'Multi-ring basin rim with severe elevation changes',
  },
  {
    name: 'Clavius Chain Zone',
    type: 'high_density',
    coordinates: [
      [-61, -19], [-61, -9], [-55, -9], [-55, -19], [-61, -19]
    ],
    reason: 'Dense crater chain creates hazardous terrain',
  },
  {
    name: 'Copernicus Ejecta Blanket',
    type: 'rough_terrain',
    coordinates: [
      [6, -24], [6, -16], [13, -16], [13, -24], [6, -24]
    ],
    reason: 'Rough ejecta blanket with secondary impacts',
  },
  {
    name: 'Kepler Ray Zone',
    type: 'high_density',
    coordinates: [
      [29, -42], [29, -34], [35, -34], [35, -42], [29, -42]
    ],
    reason: 'Dense secondary crater field from Kepler impact',
  },
];

export class HazardZonesLayer {
  private layerGroup: L.LayerGroup;
  private visible = true;

  constructor() {
    this.layerGroup = L.layerGroup();
    this.loadZones();
  }

  private loadZones() {
    this.layerGroup.clearLayers();

    HAZARD_ZONES.forEach(zone => {
      const polygon = L.polygon(
        zone.coordinates.map(([lat, lon]) => [lat, lon]),
        {
          color: HAZARD_COLORS[zone.type] || '#ff0000',
          fillColor: HAZARD_COLORS[zone.type] || '#ff0000',
          fillOpacity: 0.15,
          weight: 2,
          opacity: 0.6,
          dashArray: '5, 5',
        }
      );

      polygon.bindPopup(`
        <div class="hazard-popup-content">
          <h4>⚠ ${zone.name}</h4>
          <p><strong>Type:</strong> ${zone.type.replace('_', ' ')}</p>
          <p>${zone.reason}</p>
        </div>
      `, { className: 'hazard-popup' });

      this.layerGroup.addLayer(polygon);
    });
  }

  addTo(map: L.Map) {
    this.layerGroup.addTo(map);
  }

  removeFrom() {
    this.layerGroup.remove();
  }

  setVisible(visible: boolean) {
    this.visible = visible;
    if (visible) {
      this.layerGroup.addTo((this.layerGroup as any)._map);
    } else {
      this.layerGroup.remove();
    }
  }

  getLayerGroup(): L.LayerGroup {
    return this.layerGroup;
  }
}
