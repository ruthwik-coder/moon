import L from 'leaflet';

export class TopoOverlay {
  private layerGroup: L.LayerGroup;
  private visible = true;

  constructor() {
    this.layerGroup = L.layerGroup();
    this.generatePlaceholderOverlay();
  }

  private generatePlaceholderOverlay() {
    const gridPoints: L.LatLngExpression[][] = [];

    for (let lat = -80; lat <= 80; lat += 20) {
      for (let lon = -180; lon < 180; lon += 20) {
        const elevation = this.sampleElevation(lat, lon);
        const color = this.elevationToColor(elevation);

        const polygon = L.polygon(
          [
            [lat, lon],
            [lat, lon + 20],
            [lat + 20, lon + 20],
            [lat + 20, lon],
          ],
          {
            color: 'transparent',
            fillColor: color,
            fillOpacity: 0.25,
            weight: 0,
          }
        );

        polygon.bindTooltip(`${lat}°, ${lon}°: ${elevation > 0 ? '+' : ''}${elevation.toFixed(0)} m`, {
          permanent: false,
          direction: 'center',
          className: 'topo-tooltip',
        });

        this.layerGroup.addLayer(polygon);
      }
    }
  }

  private sampleElevation(lat: number, lon: number): number {
    const simplified = Math.sin(lat * 0.05) * 2000 +
      Math.cos(lon * 0.03) * 1500 +
      Math.sin(lat * 0.1 + lon * 0.1) * 800;

    if (lat < -40 && lon < -150) return simplified + 3000;
    if (lat > 40 && lat < 60) return simplified + 1000;
    if (lat > -30 && lat < 30 && lon > 0 && lon < 90) return simplified - 2000;

    return simplified;
  }

  private elevationToColor(elevation: number): string {
    const normalized = (elevation + 5000) / 10000;

    if (normalized < 0.3) return '#1a237e';
    if (normalized < 0.4) return '#283593';
    if (normalized < 0.5) return '#1565c0';
    if (normalized < 0.6) return '#43a047';
    if (normalized < 0.7) return '#fdd835';
    if (normalized < 0.8) return '#fb8c00';
    return '#d32f2f';
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
