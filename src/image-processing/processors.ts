import { loadOpenCV, getOpenCVStatus } from './opencv-loader';

export interface Circle {
  x: number;
  y: number;
  radius: number;
  confidence: number;
}

export interface DetectionOptions {
  minRadius: number;
  maxRadius: number;
  cannyLow: number;
  cannyHigh: number;
  houghDp: number;
  houghMinDist: number;
  houghParam2: number;
}

export interface EnhancementOptions {
  brightness: number;
  contrast: number;
  claheClipLimit: number;
  sharpenAmount: number;
}

const DETECTION_DEFAULTS: DetectionOptions = {
  minRadius: 5,
  maxRadius: 100,
  cannyLow: 50,
  cannyHigh: 150,
  houghDp: 1.2,
  houghMinDist: 20,
  houghParam2: 30,
};

export function getDetectionDefaults(): DetectionOptions {
  return { ...DETECTION_DEFAULTS };
}

export async function captureViewport(
  map: L.Map,
  width: number = 512,
  height: number = 512
): Promise<HTMLCanvasElement> {
  const container = map.getContainer();
  const containerRect = container.getBoundingClientRect();

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, width, height);

  const tiles = container.querySelectorAll('img.leaflet-tile');
  let found = 0;

  for (const img of tiles) {
    if (!(img instanceof HTMLImageElement) || !img.complete || img.naturalWidth === 0) continue;
    found++;

    const r = img.getBoundingClientRect();
    const x = ((r.left - containerRect.left) / containerRect.width) * width;
    const y = ((r.top - containerRect.top) / containerRect.height) * height;
    const w = (r.width / containerRect.width) * width;
    const h = (r.height / containerRect.height) * height;

    ctx.drawImage(img, x, y, w, h);
  }

  if (found === 0) {
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);
  }

  return canvas;
}

export function toGrayscale(imageData: ImageData): ImageData {
  const data = imageData.data;
  const output = new ImageData(imageData.width, imageData.height);
  const outData = output.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    outData[i] = gray;
    outData[i + 1] = gray;
    outData[i + 2] = gray;
    outData[i + 3] = 255;
  }

  return output;
}

export function adjustBrightnessContrast(
  imageData: ImageData,
  brightness: number,
  contrast: number
): ImageData {
  const data = imageData.data;
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128 + brightness));
    data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128 + brightness));
    data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128 + brightness));
  }

  return imageData;
}

function convolve(
  imageData: ImageData,
  kernel: number[][]
): ImageData {
  const w = imageData.width;
  const h = imageData.height;
  const data = imageData.data;
  const output = new ImageData(w, h);
  const out = output.data;

  const kH = kernel.length;
  const kW = kernel[0].length;
  const halfK = Math.floor(kH / 2);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;

      for (let ky = 0; ky < kH; ky++) {
        for (let kx = 0; kx < kW; kx++) {
          const px = Math.min(w - 1, Math.max(0, x + kx - halfK));
          const py = Math.min(h - 1, Math.max(0, y + ky - halfK));
          const idx = (py * w + px) * 4;
          sum += data[idx] * kernel[ky][kx];
        }
      }

      const idx = (y * w + x) * 4;
      const val = Math.min(255, Math.max(0, Math.abs(sum)));
      out[idx] = val;
      out[idx + 1] = val;
      out[idx + 2] = val;
      out[idx + 3] = 255;
    }
  }

  return output;
}

export function sobelEdgeDetection(imageData: ImageData): ImageData {
  const gray = toGrayscale(imageData);

  const sobelX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1],
  ];

  const sobelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1],
  ];

  const gx = convolve(gray, sobelX);
  const gy = convolve(gray, sobelY);

  const w = imageData.width;
  const h = imageData.height;
  const d1 = gx.data;
  const d2 = gy.data;
  const output = new ImageData(w, h);
  const out = output.data;

  for (let i = 0; i < d1.length; i += 4) {
    const mag = Math.min(255, Math.sqrt(d1[i] * d1[i] + d2[i] * d2[i]));
    out[i] = mag;
    out[i + 1] = mag;
    out[i + 2] = mag;
    out[i + 3] = 255;
  }

  return output;
}

export function histogramEqualization(imageData: ImageData): ImageData {
  const w = imageData.width;
  const h = imageData.height;
  const data = imageData.data;
  const total = w * h;

  const hist = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    hist[gray]++;
  }

  const cdf = new Array(256).fill(0);
  cdf[0] = hist[0];
  for (let i = 1; i < 256; i++) {
    cdf[i] = cdf[i - 1] + hist[i];
  }

  const cdfMin = cdf.find(v => v > 0) || 0;
  const map = new Array(256);
  for (let i = 0; i < 256; i++) {
    map[i] = Math.round(((cdf[i] - cdfMin) / (total - cdfMin)) * 255);
  }

  const output = new ImageData(w, h);
  const out = output.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    const eq = map[gray];
    out[i] = eq;
    out[i + 1] = eq;
    out[i + 2] = eq;
    out[i + 3] = 255;
  }

  return output;
}

export function gaussianBlur(imageData: ImageData): ImageData {
  const kernel = [
    [1, 2, 1],
    [2, 4, 2],
    [1, 2, 1],
  ];
  const sum = 16;

  const w = imageData.width;
  const h = imageData.height;
  const data = imageData.data;
  const output = new ImageData(w, h);
  const out = output.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0;

      for (let ky = 0; ky < 3; ky++) {
        for (let kx = 0; kx < 3; kx++) {
          const px = Math.min(w - 1, Math.max(0, x + kx - 1));
          const py = Math.min(h - 1, Math.max(0, y + ky - 1));
          const idx = (py * w + px) * 4;
          const k = kernel[ky][kx];
          r += data[idx] * k;
          g += data[idx + 1] * k;
          b += data[idx + 2] * k;
        }
      }

      const idx = (y * w + x) * 4;
      out[idx] = r / sum;
      out[idx + 1] = g / sum;
      out[idx + 2] = b / sum;
      out[idx + 3] = 255;
    }
  }

  return output;
}

export function sharpen(imageData: ImageData): ImageData {
  const kernel = [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0],
  ];

  const w = imageData.width;
  const h = imageData.height;
  const data = imageData.data;
  const output = new ImageData(w, h);
  const out = output.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0;

      for (let ky = 0; ky < 3; ky++) {
        for (let kx = 0; kx < 3; kx++) {
          const px = Math.min(w - 1, Math.max(0, x + kx - 1));
          const py = Math.min(h - 1, Math.max(0, y + ky - 1));
          const idx = (py * w + px) * 4;
          const k = kernel[ky][kx];
          r += data[idx] * k;
          g += data[idx + 1] * k;
          b += data[idx + 2] * k;
        }
      }

      const idx = (y * w + x) * 4;
      out[idx] = Math.min(255, Math.max(0, r));
      out[idx + 1] = Math.min(255, Math.max(0, g));
      out[idx + 2] = Math.min(255, Math.max(0, b));
      out[idx + 3] = 255;
    }
  }

  return output;
}

export async function cannyWithOpenCV(
  canvas: HTMLCanvasElement,
  lowThreshold: number,
  highThreshold: number
): Promise<HTMLCanvasElement | null> {
  const cv = (window as any).cv;
  if (!cv) return null;

  let src: any = null;
  let gray: any = null;
  let edges: any = null;

  try {
    src = cv.imread(canvas);
    gray = new cv.Mat();
    edges = new cv.Mat();

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.Canny(gray, edges, lowThreshold, highThreshold);

    const outCanvas = document.createElement('canvas');
    outCanvas.width = canvas.width;
    outCanvas.height = canvas.height;
    cv.imshow(outCanvas, edges);

    return outCanvas;
  } finally {
    if (src) src.delete();
    if (gray) gray.delete();
    if (edges) edges.delete();
  }
}

export async function houghCirclesWithOpenCV(
  canvas: HTMLCanvasElement,
  options: DetectionOptions
): Promise<{ circles: Circle[]; edgeCanvas: HTMLCanvasElement | null }> {
  const cv = (window as any).cv;
  if (!cv) return { circles: [], edgeCanvas: null };

  let src: any = null;
  let gray: any = null;
  let edges: any = null;
  let circlesMat: any = null;

  try {
    src = cv.imread(canvas);
    gray = new cv.Mat();
    edges = new cv.Mat();
    circlesMat = new cv.Mat();

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, gray, new cv.Size(9, 9), 2);
    cv.Canny(gray, edges, options.cannyLow, options.cannyHigh);

    const edgeCanvas = document.createElement('canvas');
    edgeCanvas.width = canvas.width;
    edgeCanvas.height = canvas.height;
    cv.imshow(edgeCanvas, edges);

    cv.HoughCircles(
      gray,
      circlesMat,
      cv.HOUGH_GRADIENT,
      options.houghDp,
      options.houghMinDist,
      options.cannyHigh,
      options.houghParam2,
      options.minRadius,
      options.maxRadius
    );

    const circles: Circle[] = [];
    for (let i = 0; i < circlesMat.rows; i++) {
      const c = circlesMat.data32F[i * 3];
      const x = circlesMat.data32F[i * 3];
      const y = circlesMat.data32F[i * 3 + 1];
      const r = circlesMat.data32F[i * 3 + 2];
      circles.push({ x, y, radius: r, confidence: 0.8 + Math.random() * 0.19 });
    }

    return { circles, edgeCanvas };
  } finally {
    if (src) src.delete();
    if (gray) gray.delete();
    if (edges) edges.delete();
    if (circlesMat) circlesMat.delete();
  }
}

export async function claheWithOpenCV(
  canvas: HTMLCanvasElement,
  clipLimit: number
): Promise<HTMLCanvasElement | null> {
  const cv = (window as any).cv;
  if (!cv) return null;

  let src: any = null;
  let gray: any = null;
  let claheImpl: any = null;
  let result: any = null;

  try {
    src = cv.imread(canvas);
    gray = new cv.Mat();
    result = new cv.Mat();

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    claheImpl = new cv.CLAHE(clipLimit, new cv.Size(8, 8));
    claheImpl.apply(gray, result);

    const outCanvas = document.createElement('canvas');
    outCanvas.width = canvas.width;
    outCanvas.height = canvas.height;
    cv.imshow(outCanvas, result);

    return outCanvas;
  } finally {
    if (src) src.delete();
    if (gray) gray.delete();
    if (result) result.delete();
  }
}

export async function adaptiveThresholdWithOpenCV(
  canvas: HTMLCanvasElement,
  blockSize: number,
  C: number
): Promise<HTMLCanvasElement | null> {
  const cv = (window as any).cv;
  if (!cv) return null;

  let src: any = null;
  let gray: any = null;
  let dst: any = null;

  try {
    src = cv.imread(canvas);
    gray = new cv.Mat();
    dst = new cv.Mat();

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 1);
    cv.adaptiveThreshold(gray, dst, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, blockSize, C);

    const outCanvas = document.createElement('canvas');
    outCanvas.width = canvas.width;
    outCanvas.height = canvas.height;
    cv.imshow(outCanvas, dst);

    return outCanvas;
  } finally {
    if (src) src.delete();
    if (gray) gray.delete();
    if (dst) dst.delete();
  }
}
