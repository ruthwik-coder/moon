export class ImageViewer {
  private overlay: HTMLElement;
  private imgEl: HTMLImageElement;

  constructor() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'image-viewer-overlay';
    this.overlay.style.display = 'none';

    const container = document.createElement('div');
    container.className = 'image-viewer-container';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'image-viewer-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => this.close());

    this.imgEl = document.createElement('img');
    this.imgEl.className = 'image-viewer-image';

    container.appendChild(closeBtn);
    container.appendChild(this.imgEl);
    this.overlay.appendChild(container);

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });

    document.body.appendChild(this.overlay);
  }

  open(canvas: HTMLCanvasElement) {
    this.imgEl.src = canvas.toDataURL('image/png');
    this.imgEl.alt = 'Full-resolution map view';
    this.overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  private close() {
    this.overlay.style.display = 'none';
    document.body.style.overflow = '';
  }
}
