export type OpenCVStatus = 'unloaded' | 'loading' | 'loaded' | 'error';

let _status: OpenCVStatus = 'unloaded';
let _loadPromise: Promise<boolean> | null = null;

export function getOpenCVStatus(): OpenCVStatus {
  return _status;
}

export async function loadOpenCV(): Promise<boolean> {
  if (_status === 'loaded') return true;
  if (_status === 'loading' && _loadPromise) return _loadPromise;

  _status = 'loading';

  _loadPromise = new Promise<boolean>((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.9.0/opencv.js';
    script.async = true;
    script.onload = () => {
      const checkReady = () => {
        const cv = (window as any).cv;
        if (cv && cv.Mat && typeof cv.Mat === 'function') {
          _status = 'loaded';
          resolve(true);
        } else {
          setTimeout(checkReady, 200);
        }
      };
      setTimeout(checkReady, 1000);
    };
    script.onerror = () => {
      _status = 'error';
      console.warn('OpenCV.js failed to load from CDN — Canvas fallback will be used.');
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return _loadPromise;
}

let autoLoadStarted = false;

export function autoLoadOpenCV(): void {
  if (autoLoadStarted) return;
  autoLoadStarted = true;
  loadOpenCV();
}
