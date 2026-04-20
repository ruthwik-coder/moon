import './styles/main.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LUNAR_FEATURES } from './features/feature-data';

const map = L.map('map', {
  center: [0, 0],
  zoom: 2,
  minZoom: 0,
  maxZoom: 12,
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
  }
);

const usgsNAC = L.tileLayer.wms(
  'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/earth/moon_simp_cyl.map',
  {
    layers: 'LROC_NAC_MONO',
    format: 'image/png',
    transparent: true,
    minZoom: 6,
    maxZoom: 12,
    attribution: 'USGS Astrogeology LROC NAC',
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
  }
);

const baseLayers = {
  'WAC (NASA Trek)': trekWacLayer,
  'WAC (USGS WMS)': usgsWAC,
  'NAC (USGS WMS)': usgsNAC,
};

L.control.layers(baseLayers, {}, { position: 'topright' }).addTo(map);

trekWacLayer.addTo(map);

let activeLayer = 'WAC';

map.on('mousemove', (e) => {
  const lat = e.latlng.lat.toFixed(4);
  const lon = e.latlng.lng.toFixed(4);
  document.getElementById('coordinates')!.textContent = `Lat: ${lat}°, Lon: ${lon}°`;
});

map.on('zoomend', () => {
  const zoom = map.getZoom();
  document.getElementById('zoom-level')!.textContent = `Zoom: ${zoom}`;
  const newLayer = zoom >= 7 ? 'NAC High-Res' : 'WAC Global';
  if (newLayer !== activeLayer) {
    activeLayer = newLayer;
  }
  document.getElementById('layer-info')!.textContent = `Layer: ${activeLayer}`;
});

const searchInput = document.getElementById('search-input') as HTMLInputElement;
const searchResults = document.getElementById('search-results')!;

searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase().trim();
  
  if (query.length < 2) {
    searchResults.innerHTML = '';
    return;
  }

  const matches = LUNAR_FEATURES.filter(f => 
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

document.getElementById('loading-overlay')?.remove();
