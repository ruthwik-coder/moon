import { CraterMetadata } from '../features/types';

export interface DetectionResult {
  lat: number;
  lon: number;
  diameter: number;
  confidence: number;
}

export interface DetectionStats {
  totalScanned: number;
  detected: number;
  processingTime: number;
  minDiameter: number;
  maxDiameter: number;
  avgConfidence: number;
}

export function coord2pix(lat: number, lon: number, imageWidth: number, imageHeight: number, bounds: [number, number, number, number]): [number, number] {
  const [minLon, maxLon, maxLat, minLat] = bounds;
  const x = ((lon - minLon) / (maxLon - minLon)) * imageWidth;
  const y = ((maxLat - lat) / (maxLat - minLat)) * imageHeight;
  return [x, y];
}

export function pix2coord(x: number, y: number, imageWidth: number, imageHeight: number, bounds: [number, number, number, number]): [number, number] {
  const [minLon, maxLon, maxLat, minLat] = bounds;
  const lon = (x / imageWidth) * (maxLon - minLon) + minLon;
  const lat = maxLat - (y / imageHeight) * (maxLat - minLat);
  return [lat, lon];
}

export function generateCircularKernel(radius: number): number[][] {
  const size = radius * 2 + 1;
  const kernel: number[][] = [];

  for (let y = 0; y < size; y++) {
    kernel[y] = [];
    for (let x = 0; x < size; x++) {
      const dx = x - radius;
      const dy = y - radius;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (Math.abs(dist - radius) < 1.5) {
        kernel[y][x] = 1;
      } else if (dist < radius - 1) {
        kernel[y][x] = -0.5;
      } else if (dist > radius + 1 && dist < radius + 3) {
        kernel[y][x] = 0.3;
      } else {
        kernel[y][x] = 0;
      }
    }
  }

  return kernel;
}

export function circularEdgeDetector(
  craters: CraterMetadata[],
  latRange: [number, number],
  lonRange: [number, number],
  diameterRange: [number, number],
  gridStep: number = 2
): DetectionResult[] {
  const results: DetectionResult[] = [];
  const [minDiam, maxDiam] = diameterRange;

  const knownCraters = craters.filter(c =>
    c.lat >= latRange[0] && c.lat <= latRange[1] &&
    c.lon >= lonRange[0] && c.lon <= lonRange[1] &&
    c.diameter >= minDiam && c.diameter <= maxDiam
  );

  const step = gridStep;
  for (let lat = latRange[0]; lat <= latRange[1]; lat += step) {
    for (let lon = lonRange[0]; lon <= lonRange[1]; lon += step) {
      let bestMatch: DetectionResult | null = null;
      let bestScore = 0;

      for (const crater of knownCraters) {
        const dist = Math.sqrt(
          Math.pow(lat - crater.lat, 2) + Math.pow(lon - crater.lon, 2)
        );

        const sizeScore = 1 - Math.abs(crater.diameter - (minDiam + maxDiam) / 2) / ((maxDiam - minDiam) / 2);
        const proximityScore = Math.max(0, 1 - dist / (crater.diameter / 2));
        const score = (proximityScore * 0.7 + sizeScore * 0.3) * crater.confidence;

        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            lat: crater.lat,
            lon: crater.lon,
            diameter: crater.diameter,
            confidence: score,
          };
        }
      }

      if (bestMatch && bestMatch.confidence > 0.5) {
        results.push(bestMatch);
      }
    }
  }

  return deduplicateDetections(results, minDiam / 4);
}

export function templateMatchDemo(
  craters: CraterMetadata[],
  centerLat: number,
  centerLon: number,
  searchRadiusKm: number,
  minDiameter: number = 10,
  maxDiameter: number = 100
): { detections: DetectionResult[]; stats: DetectionStats } {
  const startTime = performance.now();

  const latRange = [centerLat - searchRadiusKm / 1737.4 * (180 / Math.PI), centerLat + searchRadiusKm / 1737.4 * (180 / Math.PI)];
  const lonRange = [centerLon - searchRadiusKm / 1737.4 * (180 / Math.PI) / Math.cos(centerLat * Math.PI / 180), centerLon + searchRadiusKm / 1737.4 * (180 / Math.PI) / Math.cos(centerLat * Math.PI / 180)];

  const detections = circularEdgeDetector(craters, latRange as [number, number], lonRange as [number, number], [minDiameter, maxDiameter]);

  const processingTime = performance.now() - startTime;

  const stats: DetectionStats = {
    totalScanned: Math.floor((latRange[1] - latRange[0]) * (lonRange[1] - lonRange[0]) * 100),
    detected: detections.length,
    processingTime: parseFloat(processingTime.toFixed(2)),
    minDiameter: minDiameter,
    maxDiameter: maxDiameter,
    avgConfidence: detections.length > 0 ? parseFloat((detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length).toFixed(3)) : 0,
  };

  return { detections, stats };
}

function deduplicateDetections(detections: DetectionResult[], minDistance: number): DetectionResult[] {
  const deduped: DetectionResult[] = [];

  for (const det of detections) {
    const isDuplicate = deduped.some(existing => {
      const dist = Math.sqrt(
        Math.pow(det.lat - existing.lat, 2) + Math.pow(det.lon - existing.lon, 2)
      );
      return dist < minDistance;
    });

    if (!isDuplicate) {
      deduped.push(det);
    }
  }

  return deduped.sort((a, b) => b.confidence - a.confidence);
}

export function calculateSizeDistribution(craters: CraterMetadata[]): Record<string, number> {
  const bins: Record<string, number> = {
    '< 5 km': 0,
    '5-15 km': 0,
    '15-30 km': 0,
    '30-50 km': 0,
    '50-100 km': 0,
    '100-200 km': 0,
    '> 200 km': 0,
  };

  for (const crater of craters) {
    if (crater.diameter < 5) bins['< 5 km']++;
    else if (crater.diameter < 15) bins['5-15 km']++;
    else if (crater.diameter < 30) bins['15-30 km']++;
    else if (crater.diameter < 50) bins['30-50 km']++;
    else if (crater.diameter < 100) bins['50-100 km']++;
    else if (crater.diameter < 200) bins['100-200 km']++;
    else bins['> 200 km']++;
  }

  return bins;
}

export function calculateAgeDistribution(craters: CraterMetadata[]): Record<string, number> {
  const bins: Record<string, number> = {
    'Copernican': 0,
    'Eratosthenian': 0,
    'Late Imbrian': 0,
    'Early Imbrian': 0,
    'Nectarian': 0,
    'Pre-Nectarian': 0,
    'Unknown': 0,
  };

  for (const crater of craters) {
    if (crater.age && bins[crater.age] !== undefined) {
      bins[crater.age]++;
    } else {
      bins['Unknown']++;
    }
  }

  return bins;
}

export function calculateDepthDiameterRatio(craters: CraterMetadata[]): { diameter: number; dDRatio: number; craterClass: string }[] {
  return craters
    .filter(c => c.dDRatio !== undefined && c.dDRatio !== null)
    .map(c => ({
      diameter: c.diameter,
      dDRatio: c.dDRatio!,
      craterClass: c.craterClass,
    }));
}
