declare namespace cv {
  class Mat {
    constructor(rows: number, cols: number, type: number);
    rows: number;
    cols: number;
    data: Uint8Array;
    data8S: Int8Array;
    data16U: Uint16Array;
    data16S: Int16Array;
    data32S: Int32Array;
    data32F: Float32Array;
    data64F: Float64Array;
    delete(): void;
    copyTo(dst: Mat): void;
    clone(): Mat;
    convertTo(m: Mat, rtype: number, alpha?: number, beta?: number): void;
  }

  class MatVector {
    constructor();
    push_back(mat: Mat): void;
    size(): number;
    get(index: number): Mat;
    delete(): void;
  }

  class Rect {
    constructor(x: number, y: number, w: number, h: number);
    x: number;
    y: number;
    width: number;
    height: number;
  }

  class Point {
    constructor(x: number, y: number);
    x: number;
    y: number;
  }

  class Scalar {
    constructor(v0: number, v1: number, v2: number, v3: number);
  }

  class Size {
    constructor(width: number, height: number);
    width: number;
    height: number;
  }

  function imread(canvasOrImage: HTMLCanvasElement | HTMLImageElement): Mat;
  function imshow(canvas: HTMLCanvasElement, mat: Mat): void;
  function cvtColor(src: Mat, dst: Mat, code: number): void;
  function GaussianBlur(src: Mat, dst: Mat, ksize: Size, sigmaX: number): void;
  function Canny(src: Mat, dst: Mat, lowThreshold: number, highThreshold: number): void;
  function HoughCircles(src: Mat, circles: Mat, method: number, dp: number, minDist: number, param1: number, param2: number, minRadius: number, maxRadius: number): void;
  function adaptiveThreshold(src: Mat, dst: Mat, maxValue: number, adaptiveMethod: number, thresholdType: number, blockSize: number, C: number): void;
  function equalizeHist(src: Mat, dst: Mat): void;
  function CLAHE(clipLimit?: number, tileGridSize?: Size): any;
  function addWeighted(src1: Mat, alpha: number, src2: Mat, beta: number, gamma: number, dst: Mat): void;
  function threshold(src: Mat, dst: Mat, thresh: number, maxval: number, type: number): void;
  function morphologyEx(src: Mat, dst: Mat, op: number, kernel: Mat): void;
  function getStructuringElement(shape: number, ksize: Size): Mat;
  function resize(src: Mat, dst: Mat, dsize: Size): void;
  function bitwise_not(src: Mat, dst: Mat): void;
  function erode(src: Mat, dst: Mat, kernel: Mat): void;
  function dilate(src: Mat, dst: Mat, kernel: Mat): void;

  const COLOR_RGBA2GRAY: number;
  const COLOR_RGB2GRAY: number;
  const COLOR_GRAY2RGBA: number;
  const COLOR_GRAY2RGB: number;
  const HOUGH_GRADIENT: number;
  const ADAPTIVE_THRESH_GAUSSIAN_C: number;
  const ADAPTIVE_THRESH_MEAN_C: number;
  const THRESH_BINARY: number;
  const THRESH_BINARY_INV: number;
  const MORPH_CLOSE: number;
  const MORPH_OPEN: number;
  const MORPH_ELLIPSE: number;
  const CV_8UC1: number;
  const CV_8UC3: number;
  const CV_8UC4: number;
}

interface Window {
  cv: typeof cv;
}
