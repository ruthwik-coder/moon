import './styles/main.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LUNAR_FEATURES } from './features/feature-data';
import { DEEPMOON_CATALOGUES } from './features/crater-database';
import { CraterLayer } from './craters/crater-layer';
import { DensityHeatmap } from './craters/density-heatmap';
import { LayerTogglePanel } from './layers/layer-toggle';
import { TopoOverlay } from './layers/topo-overlay';
import { HazardZonesLayer } from './layers/hazard-zones';
import { MineralLayer } from './layers/mineral-layer';
import { AnalysisPanel } from './ui/analysis-panel';
import { LegendPanel } from './ui/legend-panel';
import { MeasurementTool } from './tools/measurement-tool';
import { ScreenshotExport } from './tools/screenshot-export';
import { ProcessingPanel } from './ui/processing-panel';
import { SafeLandingLayer } from './layers/landing-layer';
import { autoLoadOpenCV } from './image-processing/opencv-loader';
import type { LayerVisibility } from './features/types';

autoLoadOpenCV();

const map = L.map('map', {
  center: [0, 0],
  zoom: 2,
  minZoom: 0,
  maxZoom: 7,
  crs: L.CRS.EPSG4326,
  continuousWorld: true,
  worldCopyJump: false,
  maxBounds: [[-90, -180], [90, 180]],
  zoomControl: true,
});

const TRANSPARENT_1PX = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

const trekWacLayer = L.tileLayer(
  'https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
  {
    attribution: 'NASA/GSFC/ASU LRO LROC WAC',
    tms: false,
    opacity: 1,
    minZoom: 0,
    maxZoom: 7,
    errorTileUrl: TRANSPARENT_1PX,
    crossOrigin: 'anonymous',
  }
);

const usgsNAC = L.tileLayer.wms(
  'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/earth/moon_simp_cyl.map',
  {
    layers: 'LROC_NAC_MONO',
    format: 'image/png',
    transparent: true,
    minZoom: 6,
    maxZoom: 7,
    attribution: 'USGS Astrogeology LROC NAC',
    crossOrigin: 'anonymous',
  }
);

const usgsWAC = L.tileLayer.wms(
  'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/earth/moon_simp_cyl.map',
  {
    layers: 'LROC_WAC_GLOBAL',
    format: 'image/png',
    transparent: false,
    minZoom: 0,
    maxZoom: 6,
    attribution: 'USGS Astrogeology LROC WAC',
    crossOrigin: 'anonymous',
  }
);

const ironAbundance = L.tileLayer.wms(
  'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/earth/moon_simp_cyl.map',
  {
    layers: 'Lunar_Prospector_GRS_Iron',
    format: 'image/png',
    transparent: true,
    opacity: 0.6,
    attribution: 'USGS/NASA Lunar Prospector GRS',
    crossOrigin: 'anonymous',
  }
);

const clementineMineral = L.tileLayer.wms(
  'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/earth/moon_simp_cyl.map',
  {
    layers: 'Clementine_Color_Ratio',
    format: 'image/png',
    transparent: true,
    opacity: 0.6,
    attribution: 'USGS/NASA Clementine',
    crossOrigin: 'anonymous',
  }
);

const baseLayers = {
  'WAC (NASA Trek)': trekWacLayer,
  'WAC (USGS WMS)': usgsWAC,
  'NAC (USGS WMS)': usgsNAC,
};

const overlayLayers = {
  'Iron Abundance (GRS)': ironAbundance,
  'Clementine Mineral Ratio': clementineMineral,
};

L.control.layers(baseLayers, overlayLayers, { position: 'topright' }).addTo(map);

trekWacLayer.addTo(map);

let activeLayer = 'WAC';

const craterLayer = new CraterLayer();
const densityHeatmap = new DensityHeatmap();
const topoOverlay = new TopoOverlay();
const hazardZones = new HazardZonesLayer();
const mineralLayer = new MineralLayer();
const safeLandingLayer = new SafeLandingLayer();

craterLayer.bindMap(map);
craterLayer.loadCraters(DEEPMOON_CATALOGUES);
densityHeatmap.loadCraters(DEEPMOON_CATALOGUES);

const geoJsonLayer = craterLayer.getGeoJsonLayer();
const labelLayer = craterLayer.getLabelLayer();

if (geoJsonLayer) geoJsonLayer.addTo(map);
if (labelLayer) labelLayer.addTo(map);
densityHeatmap.addTo(map);
hazardZones.addTo(map);
mineralLayer.addTo(map);
safeLandingLayer.addTo(map);

let layerVisibility: LayerVisibility = {
  simple: true,
  complex: true,
  multiring: true,
  heatmap: true,
  topo: false,
  hazard: false,
  minerals: true,
  landing: true,
};

topoOverlay.removeFrom();
densityHeatmap.setVisible(true);

const handleLayerToggle = (layer: keyof LayerVisibility, visible: boolean) => {
  layerVisibility[layer] = visible;

  if (layer === 'simple' || layer === 'complex' || layer === 'multiring') {
    craterLayer.setVisibility(layer, visible);
  } else if (layer === 'heatmap') {
    densityHeatmap.setVisible(visible);
  } else if (layer === 'topo') {
    if (visible) {
      topoOverlay.addTo(map);
    } else {
      topoOverlay.removeFrom();
    }
  } else if (layer === 'hazard') {
    hazardZones.setVisible(visible);
  } else if (layer === 'minerals') {
    mineralLayer.setVisible(visible);
  } else if (layer === 'landing') {
    safeLandingLayer.setVisible(visible);
  }
};

const overlayContainer = document.getElementById('ui-overlay')!;
const layerPanel = new LayerTogglePanel(handleLayerToggle);
layerPanel.addTo(overlayContainer);

const analysisPanel = new AnalysisPanel(DEEPMOON_CATALOGUES, (ages) => {
  craterLayer.setAgeFilter(ages);
});
const analysisToggleBtn = document.createElement('button');
analysisToggleBtn.id = 'analysis-toggle-btn';
analysisToggleBtn.textContent = 'Analysis';
analysisToggleBtn.addEventListener('click', () => analysisPanel.toggle());
document.body.appendChild(analysisToggleBtn);

const measurementTool = new MeasurementTool(map);
const measureToggleBtn = document.createElement('button');
measureToggleBtn.id = 'measure-toggle-btn';
measureToggleBtn.textContent = 'Measure';
measureToggleBtn.addEventListener('click', () => measurementTool.toggle());
document.body.appendChild(measureToggleBtn);

const legendPanel = new LegendPanel();

const colorModeBtn = document.createElement('button');
colorModeBtn.id = 'color-mode-btn';
colorModeBtn.textContent = 'Color: Class';
colorModeBtn.addEventListener('click', () => {
  const current = craterLayer.getColorMode();
  const newMode = current === 'class' ? 'age' : 'class';
  craterLayer.setColorMode(newMode);
  colorModeBtn.textContent = `Color: ${newMode === 'class' ? 'Class' : 'Age'}`;
  legendPanel.setColorMode(newMode);
});
document.body.appendChild(colorModeBtn);

const processingPanel = new ProcessingPanel(map);
const processToggleBtn = document.createElement('button');
processToggleBtn.id = 'process-toggle-btn';
processToggleBtn.textContent = 'Process';
processToggleBtn.addEventListener('click', () => processingPanel.toggle());
document.body.appendChild(processToggleBtn);

const screenshotExport = new ScreenshotExport(map);
const screenshotBtn = document.createElement('button');
screenshotBtn.id = 'screenshot-btn';
screenshotBtn.textContent = 'Screenshot';
screenshotBtn.addEventListener('click', () => screenshotExport.exportPNG());
document.body.appendChild(screenshotBtn);

map.on('mousemove', (e) => {
  const lat = e.latlng.lat.toFixed(4);
  const lon = e.latlng.lng.toFixed(4);
  document.getElementById('coordinates')!.textContent = `Lat: ${lat}°, Lon: ${lon}°`;
});

map.on('zoomend', () => {
  const zoom = map.getZoom();
  document.getElementById('zoom-level')!.textContent = `Zoom: ${zoom}`;
  const newLayer = zoom >= 6 ? 'NAC High-Res' : 'WAC Global';
  if (newLayer !== activeLayer) {
    activeLayer = newLayer;
  }
  document.getElementById('layer-info')!.textContent = `Layer: ${activeLayer}`;
  const count = craterLayer.getCraterCount();
  const el = document.getElementById('crater-count');
  if (el) el.textContent = `Craters: ${count}`;
});

const searchInput = document.getElementById('search-input') as HTMLInputElement;
const searchResults = document.getElementById('search-results')!;

const searchableItems = [
  ...LUNAR_FEATURES.map(f => ({ name: f.name, type: f.type, lat: f.lat, lon: f.lon })),
  ...DEEPMOON_CATALOGUES.map(c => ({ name: c.name, type: 'Crater', lat: c.lat, lon: c.lon })),
];

const uniqueSearchable = searchableItems.reduce<Array<{ name: string; type: string; lat: number; lon: number }>>((acc, item) => {
  if (!acc.some(existing => existing.name.toLowerCase() === item.name.toLowerCase())) {
    acc.push(item);
  }
  return acc;
}, []);

searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase().trim();
  
  if (query.length < 2) {
    searchResults.innerHTML = '';
    return;
  }

  const matches = uniqueSearchable.filter(f => 
    f.name.toLowerCase().includes(query) || 
    f.type.toLowerCase().includes(query)
  ).slice(0, 8);

  searchResults.innerHTML = matches.map(f => `
    <div class="search-result" data-lon="${f.lon}" data-lat="${f.lat}">
      <strong>${f.name}</strong>
      <span class="feature-type">${f.type}</span>
      <span class="feature-coords">${f.lat.toFixed(2)}°, ${f.lon.toFixed(2)}°</span>
    </div>
  `).join('') || '<div class="search-result">No results</div>';

  searchResults.querySelectorAll('.search-result[data-lon]').forEach(el => {
    el.addEventListener('click', () => {
      const lon = parseFloat(el.getAttribute('data-lon')!);
      const lat = parseFloat(el.getAttribute('data-lat')!);
      map.flyTo([lat, lon], 6, { duration: 1 });
      searchResults.innerHTML = '';
      searchInput.value = '';
    });
  });
});

document.addEventListener('click', (e) => {
  if (!searchInput.contains(e.target as Node) && !searchResults.contains(e.target as Node)) {
    searchResults.innerHTML = '';
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === '+' || e.key === '=') {
    map.zoomIn();
  } else if (e.key === '-') {
    map.zoomOut();
  } else if (e.key === 'Home') {
    map.flyTo([0, 0], 2, { duration: 1 });
  }
});

document.getElementById('loading-overlay')?.remove();
