import L from 'leaflet';

export class ScreenshotExport {
  private map: L.Map;

  constructor(map: L.Map) {
    this.map = map;
  }

  async exportPNG(filename?: string): Promise<void> {
    const mapElement = this.map.getContainer();
    const width = mapElement.clientWidth;
    const height = mapElement.clientHeight;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);

    const tilePromises: Promise<void>[] = [];
    const tileLayer = this.map.getContainer().querySelector('.leaflet-tile-pane');

    if (tileLayer) {
      const tiles = tileLayer.querySelectorAll('img');
      for (const tile of tiles) {
        const img = tile as HTMLImageElement;
        const promise = new Promise<void>((resolve) => {
          const drawTile = () => {
            try {
              const style = window.getComputedStyle(img);
              const left = parseFloat(style.left);
              const top = parseFloat(style.top);
              ctx.globalAlpha = parseFloat(style.opacity || '1');
              ctx.drawImage(img, left, top, img.width, img.height);
              ctx.globalAlpha = 1;
            } catch {
              // Skip tiles that can't be drawn (CORS issues)
            }
            resolve();
          };

          if (img.complete) {
            drawTile();
          } else {
            img.onload = drawTile;
            img.onerror = () => resolve();
          }
        });
        tilePromises.push(promise);
      }
    }

    await Promise.all(tilePromises);

    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.width = width;
    overlayCanvas.height = height;
    const overlayCtx = overlayCanvas.getContext('2d');

    if (overlayCtx) {
      const svgData = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml">
              <div style="position: absolute; bottom: 10px; left: 10px; color: white; font-family: monospace; font-size: 12px; background: rgba(0,0,0,0.7); padding: 8px; border-radius: 4px;">
                Moon Explorer | ${new Date().toLocaleDateString()} | Zoom: ${this.map.getZoom()}
              </div>
            </div>
          </foreignObject>
        </svg>
      `;

      const img = new Image();
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      await new Promise<void>((resolve) => {
        img.onload = () => {
          overlayCtx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = url;
      });

      ctx.drawImage(overlayCanvas, 0, 0);
    }

    const finalName = filename || `moon-explorer-${Date.now()}.png`;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = finalName;
      a.click();
      URL.revokeObjectURL(a.href);
    }, 'image/png');
  }

  exportDataJSON(data: Record<string, unknown>, filename?: string): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `moon-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
