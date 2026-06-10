import L from 'leaflet';
import { captureViewport, houghCirclesWithOpenCV, sobelEdgeDetection, DetectionOptions, getDetectionDefaults, Circle } from './processors';
import { getOpenCVStatus } from './opencv-loader';

export interface DetectedCrater {
  lat: number;
  lon: number;
  diameterKm: number;
  confidence: number;
  pixelX: number;
  pixelY: number;
  pixelRadius: number;
}

export interface DetectionRun {
  craters: DetectedCrater[];
  processingTime: number;
  method: 'opencv-hough' | 'canvas-sobel';
  opencvLoaded: boolean;
}

export interface DetectionOverlay {
  circles: L.Circle[];
  markers: L.Marker[];
}

function pixelToLatLon(
  px: number, py: number, map: L.Map, cw: number, ch: number
): L.LatLng {
  const b = map.getBounds();
  const lat = b.getNorth() - (py / ch) * (b.getNorth() - b.getSouth());
  const lon = b.getWest() + (px / cw) * (b.getEast() - b.getWest());
  return L.latLng(lat, lon);
}

function kmPerPixelAtLat(lat: number, zoom: number): number {
  const mpp = (40075 * 1000) / (Math.pow(2, zoom) * 256);
  return (mpp * Math.cos((lat * Math.PI) / 180)) / 1000;
}

export async function detectCratersFromViewport(
  map: L.Map,
  options: Partial<DetectionOptions> = {}
): Promise<DetectionRun> {
  const startTime = performance.now();
  const opts = { ...getDetectionDefaults(), ...options };
  const opencvLoaded = getOpenCVStatus() === 'loaded';

  const canvas = await captureViewport(map, opencvLoaded ? 512 : 256, opencvLoaded ? 512 : 256);
  let circles: Circle[] = [];

  if (opencvLoaded) {
    const result = await houghCirclesWithOpenCV(canvas, opts);
    circles = result.circles;
  }

  if (!opencvLoaded) {
    let imageData: ImageData;
    try {
      imageData = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
    } catch {
      return {
        craters: [],
        processingTime: parseFloat((performance.now() - startTime).toFixed(1)),
        method: 'canvas-sobel',
        opencvLoaded: false,
      };
    }
    const edges = sobelEdgeDetection(imageData);
    const ctx = document.createElement('canvas').getContext('2d')!;
    ctx.canvas.width = canvas.width;
    ctx.canvas.height = canvas.height;
    ctx.putImageData(edges, 0, 0);
    let edgeData: ImageData;
    try {
      edgeData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch {
      return {
        craters: [],
        processingTime: parseFloat((performance.now() - startTime).toFixed(1)),
        method: 'canvas-sobel',
        opencvLoaded: false,
      };
    }
    circles = detectCirclesFromEdgesFast(edgeData, opts, canvas.width, canvas.height);
  }

  const avgLat = map.getCenter().lat;
  const zoom = map.getZoom();
  const kpp = kmPerPixelAtLat(avgLat, zoom);
  const craters: DetectedCrater[] = [];

  for (const c of circles) {
    try {
      const ll = pixelToLatLon(c.x, c.y, map, canvas.width, canvas.height);
      if (ll.lat >= -90 && ll.lat <= 90 && ll.lng >= -180 && ll.lng <= 180) {
        craters.push({
          lat: ll.lat, lon: ll.lng,
          diameterKm: parseFloat((c.radius * 2 * kpp).toFixed(2)),
          confidence: parseFloat(c.confidence.toFixed(3)),
          pixelX: c.x, pixelY: c.y, pixelRadius: c.radius,
        });
      }
    } catch { /* skip */ }
  }

  const processingTime = parseFloat((performance.now() - startTime).toFixed(1));

  return {
    craters: craters.sort((a, b) => b.confidence - a.confidence),
    processingTime,
    method: opencvLoaded ? 'opencv-hough' : 'canvas-sobel',
    opencvLoaded,
  };
}

function detectCirclesFromEdgesFast(
  edgeData: ImageData,
  options: DetectionOptions,
  width: number,
  height: number
): Circle[] {
  const circles: Circle[] = [];
  const data = edgeData.data;

  const edgePixels: { x: number; y: number }[] = [];
  for (let y = 0; y < height; y += 3) {
    for (let x = 0; x < width; x += 3) {
      if (data[(y * width + x) * 4] > 128) {
        edgePixels.push({ x, y });
      }
    }
  }

  if (edgePixels.length < 10) return circles;

  const maxAttempts = 20;
  const sampleVote = Math.min(edgePixels.length, 60);

  for (let a = 0; a < maxAttempts; a++) {
    const p1 = edgePixels[Math.floor(Math.random() * edgePixels.length)];
    const p2 = edgePixels[Math.floor(Math.random() * edgePixels.length)];
    const p3 = edgePixels[Math.floor(Math.random() * edgePixels.length)];

    const circle = fitCircle(p1, p2, p3);
    if (!circle) continue;
    if (circle.radius < options.minRadius || circle.radius > options.maxRadius) continue;

    let vote = 0;
    for (let i = 0; i < sampleVote; i++) {
      const p = edgePixels[Math.floor(Math.random() * edgePixels.length)];
      const dist = Math.abs(Math.sqrt((p.x - circle.x) ** 2 + (p.y - circle.y) ** 2) - circle.radius);
      if (dist < circle.radius * 0.2) vote++;
    }

    const confidence = vote / sampleVote;
    if (confidence > 0.18) {
      circles.push({ x: circle.x, y: circle.y, radius: circle.radius, confidence });
    }
  }

  return deduplicateCircles(circles);
}

function fitCircle(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number }
): Circle | null {
  const d = 2 * (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y));
  if (Math.abs(d) < 1e-10) return null;

  const ux = ((p1.x * p1.x + p1.y * p1.y) * (p2.y - p3.y) + (p2.x * p2.x + p2.y * p2.y) * (p3.y - p1.y) + (p3.x * p3.x + p3.y * p3.y) * (p1.y - p2.y)) / d;
  const uy = ((p1.x * p1.x + p1.y * p1.y) * (p3.x - p2.x) + (p2.x * p2.x + p2.y * p2.y) * (p1.x - p3.x) + (p3.x * p3.x + p3.y * p3.y) * (p2.x - p1.x)) / d;
  const r = Math.sqrt((p1.x - ux) ** 2 + (p1.y - uy) ** 2);

  if (r > 500 || r < 3 || isNaN(r)) return null;
  return { x: ux, y: uy, radius: r, confidence: 0 };
}

function deduplicateCircles(circles: Circle[]): Circle[] {
  const result: Circle[] = [];
  for (const c of circles.sort((a, b) => b.confidence - a.confidence)) {
    if (!result.some(e => Math.sqrt((e.x - c.x) ** 2 + (e.y - c.y) ** 2) < 10)) {
      result.push(c);
    }
  }
  return result;
}

export function createDetectionOverlay(
  craters: DetectedCrater[],
  map: L.Map
): DetectionOverlay {
  const circles: L.Circle[] = [];
  const markers: L.Marker[] = [];

  for (const c of craters) {
    const ll = L.latLng(c.lat, c.lon);
    const color = c.confidence > 0.8 ? '#42d9a8' : c.confidence > 0.6 ? '#ff9f43' : '#f06292';

    const circle = L.circle(ll, {
      radius: c.diameterKm * 500,
      color,
      weight: 2,
      opacity: 0.8,
      fillOpacity: 0.08,
    });
    circle.bindTooltip(`${c.diameterKm.toFixed(1)} km (${(c.confidence * 100).toFixed(0)}%)`);
    circles.push(circle);

    const marker = L.marker(ll, {
      icon: L.divIcon({
        className: 'detection-marker',
        html: `<div class="detection-dot" style="background:${color}"></div>`,
        iconSize: [8, 8],
        iconAnchor: [4, 4],
      }),
    });
    markers.push(marker);
  }

  return { circles, markers };
}

export function addDetectionToMap(overlay: DetectionOverlay, map: L.Map) {
  overlay.circles.forEach(c => c.addTo(map));
  overlay.markers.forEach(m => m.addTo(map));
}

export function removeDetectionFromMap(overlay: DetectionOverlay, map: L.Map) {
  overlay.circles.forEach(c => c.removeFrom(map));
  overlay.markers.forEach(m => m.removeFrom(map));
  overlay.circles = [];
  overlay.markers = [];
}
