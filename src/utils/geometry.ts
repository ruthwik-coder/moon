import type { CraterMetadata, CraterGeoJSON } from '../features/types';

function deg2rad(deg: number): number {
  return deg * Math.PI / 180;
}

function rad2deg(rad: number): number {
  return rad * 180 / Math.PI;
}

export function circleToPolygon(
  lat: number,
  lon: number,
  diameterKm: number,
  numPoints: number = 32
): [number, number][] {
  const R = 1737.4;
  const radiusRad = (diameterKm / 2) / R;
  const latRad = deg2rad(lat);
  const lonRad = deg2rad(lon);
  const points: [number, number][] = [];

  for (let i = 0; i < numPoints; i++) {
    const angle = (2 * Math.PI * i) / numPoints;
    const newLat = Math.asin(
      Math.sin(latRad) * Math.cos(radiusRad) +
      Math.cos(latRad) * Math.sin(radiusRad) * Math.cos(angle)
    );
    const newLon = lonRad + Math.atan2(
      Math.sin(angle) * Math.sin(radiusRad) * Math.cos(latRad),
      Math.cos(radiusRad) - Math.sin(latRad) * Math.sin(newLat)
    );
    points.push([rad2deg(newLon), rad2deg(newLat)]);
  }

  points.push(points[0]);
  return points;
}

export function generateCraterGeoJSON(craters: CraterMetadata[]): CraterGeoJSON[] {
  return craters.map(crater => ({
    type: 'Feature',
    properties: crater,
    geometry: {
      type: 'Polygon',
      coordinates: [circleToPolygon(crater.lat, crater.lon, crater.diameter)],
    },
  }));
}

export function classifyCraterByDiameter(diameter: number): 'simple' | 'complex' | 'multiring' {
  if (diameter >= 300) return 'multiring';
  if (diameter >= 15) return 'complex';
  return 'simple';
}

export function estimateDepth(diameter: number, craterClass: string): number {
  if (craterClass === 'simple') return diameter * 0.2;
  if (craterClass === 'complex') return diameter * 0.04 + 1.5;
  return diameter * 0.015 + 3;
}

export function calcDDRatio(diameter: number, depth: number): number {
  return parseFloat((depth / diameter).toFixed(4));
}
