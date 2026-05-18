import { CraterMetadata, CraterClass } from '../features/types';
import { classifyCraterByDiameter, estimateDepth } from './geometry';

interface ParsedCrater {
  lat: number;
  lon: number;
  diameter: number;
  source: string;
}

export function parseHeadCratersCSV(csv: string): ParsedCrater[] {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  const latIdx = headers.findIndex(h => h.toLowerCase() === 'lat');
  const lonIdx = headers.findIndex(h => h.toLowerCase() === 'lon');
  const diamIdx = headers.findIndex(h => h.toLowerCase().includes('diam'));

  if (latIdx === -1 || lonIdx === -1 || diamIdx === -1) {
    return [];
  }

  const results: ParsedCrater[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length <= Math.max(latIdx, lonIdx, diamIdx)) continue;

    const lat = parseFloat(cols[latIdx]);
    const lon = parseFloat(cols[lonIdx]);
    const diameter = parseFloat(cols[diamIdx]);

    if (!isNaN(lat) && !isNaN(lon) && !isNaN(diameter) && diameter > 0) {
      results.push({ lat, lon, diameter, source: 'Head' });
    }
  }
  return results;
}

export function parseLROCCratersCSV(csv: string): ParsedCrater[] {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  const latIdx = headers.findIndex(h => h.toLowerCase() === 'lat');
  const lonIdx = headers.findIndex(h => h.toLowerCase() === 'long');
  const diamIdx = headers.findIndex(h => h.toLowerCase().includes('diameter'));

  if (latIdx === -1 || lonIdx === -1 || diamIdx === -1) {
    return [];
  }

  const results: ParsedCrater[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length <= Math.max(latIdx, lonIdx, diamIdx)) continue;

    const lat = parseFloat(cols[latIdx]);
    const lon = parseFloat(cols[lonIdx]);
    const diameter = parseFloat(cols[diamIdx]);

    if (!isNaN(lat) && !isNaN(lon) && !isNaN(diameter) && diameter > 0) {
      results.push({ lat, lon, diameter, source: 'LROC' });
    }
  }
  return results;
}

export function mergeCraterCatalogues(
  existing: CraterMetadata[],
  parsedCraters: ParsedCrater[]
): CraterMetadata[] {
  const merged = [...existing];
  const existingSet = new Set(existing.map(c => `${c.name}`));
  const seenCoords = new Set(existing.map(c => `${c.lat.toFixed(2)},${c.lon.toFixed(2)}`));

  let unnamedCounter = 1;

  for (const pc of parsedCraters) {
    const coordKey = `${pc.lat.toFixed(2)},${pc.lon.toFixed(2)}`;
    if (seenCoords.has(coordKey)) continue;

    const craterClass = classifyCraterByDiameter(pc.diameter);
    const depth = parseFloat(estimateDepth(pc.diameter, craterClass).toFixed(2));
    const dDRatio = parseFloat((depth / pc.diameter).toFixed(4));

    const confidence = pc.source === 'LROC' ? 0.92 : 0.85;

    let name = `Crater-${unnamedCounter}`;
    unnamedCounter++;

    if (pc.diameter >= 100) {
      const dirs = ['N', 'S', 'E', 'W'];
      const dir = dirs[Math.floor(Math.abs(pc.lat + pc.lon) % 4)];
      name = `${pc.source} ${dir}-${Math.abs(Math.round(pc.lat))}${Math.abs(Math.round(pc.lon))}`;
    }

    const crater: CraterMetadata = {
      name,
      lat: pc.lat,
      lon: pc.lon,
      diameter: pc.diameter,
      depth,
      dDRatio,
      craterClass: craterClass as CraterClass,
      confidence,
      significance: `${pc.source} catalogue detection`,
    };

    merged.push(crater);
    seenCoords.add(coordKey);
  }

  return merged;
}

export function parseAndMergeCatalogues(
  existing: CraterMetadata[],
  headCSV: string,
  lrocCSV: string
): CraterMetadata[] {
  const headCraters = parseHeadCratersCSV(headCSV);
  const lrocCraters = parseLROCCratersCSV(lrocCSV);

  const allParsed = [...headCraters, ...lrocCraters];

  return mergeCraterCatalogues(existing, allParsed);
}
