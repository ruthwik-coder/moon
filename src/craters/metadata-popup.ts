import type { CraterMetadata } from '../features/types';

export function createCraterPopup(crater: CraterMetadata): string {
  const classLabels: Record<string, string> = {
    simple: 'Simple (Bowl-shaped)',
    complex: 'Complex (Central peak/terraced)',
    multiring: 'Multi-ring Basin',
  };

  return `
    <div class="crater-popup-content">
      <h3>${crater.name}</h3>
      <div class="popup-section">
        <span class="popup-label">Classification</span>
        <span class="crater-class crater-class-${crater.craterClass}">${classLabels[crater.craterClass]}</span>
      </div>
      <div class="popup-grid">
        <div class="popup-item">
          <span class="popup-label">Diameter</span>
          <span class="popup-value">${crater.diameter} km</span>
        </div>
        ${crater.depth !== undefined ? `
        <div class="popup-item">
          <span class="popup-label">Depth</span>
          <span class="popup-value">${crater.depth} km</span>
        </div>` : ''}
        ${crater.dDRatio !== undefined ? `
        <div class="popup-item">
          <span class="popup-label">d/D Ratio</span>
          <span class="popup-value">${crater.dDRatio}</span>
        </div>` : ''}
        <div class="popup-item">
          <span class="popup-label">Confidence</span>
          <span class="popup-value">${(crater.confidence * 100).toFixed(1)}%</span>
        </div>
        <div class="popup-item">
          <span class="popup-label">Coordinates</span>
          <span class="popup-value">${crater.lat.toFixed(2)}°, ${crater.lon.toFixed(2)}°</span>
        </div>
        ${crater.age ? `
        <div class="popup-item">
          <span class="popup-label">Age</span>
          <span class="popup-value">${crater.age}</span>
        </div>` : ''}
      </div>
      ${crater.significance ? `
      <div class="popup-significance">
        ${crater.significance}
      </div>` : ''}
    </div>
  `;
}
