# Moon Explorer

Interactive Moon map with crater analysis, image processing, mineral overlay data, and vision computing tools powered by Leaflet and OpenCV.js.

## Features

### Map & Navigation
- **Equidistant Cylindrical Projection**: Full lunar map using `L.CRS.EPSG4326`
- **Multi-source Imagery**: NASA Trek WAC, USGS WMS WAC/NAC layers, plus iron abundance and Clementine mineral ratio overlays
- **Zoom-based Rendering**: Features auto-filter by zoom level for smooth performance
- **Coordinate Display**: Real-time lat/lon on mouse hover

### Crater Visualization
- **300+ Named Craters**: Tycho, Copernicus, South Pole-Aitken, and more
- **Classification**: Simple, Complex, and Multi-ring craters with distinct colors
- **Zoom-Dependent Loading**: Only visible craters render at each zoom level
- **Dynamic Color Modes**: Color by crater class or by geological age

### Analysis Panel
- **Statistics**: Total craters, counts by type
- **Size Distribution**: Histogram of crater diameters
- **Age Distribution**: Breakdown by geological period (Copernican through Pre-Nectarian)
- **Depth-Diameter Plot**: Scatter plot of d/d ratio vs diameter
- **Density Grid**: Crater density heatmap by lunar region

### Image Processing (Process panel)
- **OpenCV.js Integration**: Auto-loads OpenCV (~8MB WASM from CDN) on page start for accelerated vision processing
- **Image Enhancement**: Adjust brightness/contrast, grayscale conversion, histogram equalization, Gaussian blur, sharpen filters
- **Edge Detection**: Sobel (always available) and Canny (requires OpenCV) edge detection on the current map viewport
- **Full-resolution Viewer**: Click processed previews to view in a full-screen modal
- **Apply to View**: Overlay processed results on the map as a semi-transparent layer

### Crater Detection
- **Real Tile-based Detection**: Captures the current map viewport and runs Hough Circle Transform (OpenCV) or Sobel + RANSAC circle fitting (Canvas fallback)
- **Confidence Scoring**: Results color-coded by confidence (green >80%, orange >60%, pink <60%)
- **Adjustable Parameters**: Min/max radius, Canny thresholds, Hough distance and sensitivity
- **Click-to-Fly**: Click detected craters in the results list to navigate to them
- **Detection Timeout**: 8-second safety cutoff prevents hanging

### Mineral Data Layers
- **6 Lunar Deposit Sites**: Titanium, Thorium, Olivine, Iron, Pyroxene, Anorthosite with abundance and geologic context
- **Colored Overlays**: Per-type colored circles on the map, toggleable via Layer panel
- **Popup Info**: Click deposits for type, abundance, and geologic context
- **WMS Overlays**: Lunar Prospector GRS Iron Abundance and Clementine Color Ratio as toggleable map layers

### Measurement Tool
- **Distance Measurement**: Multi-point distance on lunar surface
- **Area Measurement**: Polygon area calculation
- **JSON Export**: Save measurements with coordinates

### Additional Tools
- **Screenshot Export**: PNG capture with timestamp overlay
- **Legend Panel**: Dynamic legend updates with color mode
- **Age Filtering**: Toggle visibility by geological period
- **Search**: Find craters, lunar features, and mineral deposits by name

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

1. **Pan**: Click and drag to move across the Moon
2. **Zoom**: Mouse wheel or +/- keys
3. **Search**: Type in search box to find features, click to fly to
4. **Layers**: Toggle base maps and overlays (top-right layer control)
5. **Analysis**: Click "Analysis" button for charts, detection demo
6. **Process**: Click "Process" button to open image enhancement, crater detection, and edge detection tools
7. **Measure**: Click "Measure" button, select Distance or Area mode
8. **Color Mode**: Toggle between class-based and age-based coloring
9. **Screenshot**: Click "Screenshot" to export current view as PNG
10. **Mineral Deposits**: Toggle under "Overlays" in the Layer panel, or via WMS layers in the top-right control

## CORS Notes

Map tiles are loaded from external servers (NASA Trek, USGS). When using the Process panel, tile images are drawn to a canvas for pixel-level analysis. If the tile server supports CORS (with `crossOrigin: 'anonymous'`), all features work seamlessly. If not, the app gracefully shows an error message instead of crashing.

## Technology Stack

- **Leaflet 1.9.4**: Interactive map library
- **Vite 5**: Build tool and dev server
- **TypeScript 5**: Type safety
- **OpenCV.js**: Computer vision (lazy-loaded from CDN, not bundled)
- **DeepMoon Integration**: Head & LROC crater catalogues
- **NASA Trek WMTS / USGS WMS**: Lunar imagery

## Project Structure

```
moon-explorer/
├── src/
│   ├── main.ts                    # Entry point
│   ├── craters/
│   │   ├── crater-layer.ts        # Zoom-dependent crater rendering
│   │   ├── density-heatmap.ts     # Canvas-based heatmap overlay
│   │   └── metadata-popup.ts      # Crater popup content
│   ├── features/
│   │   ├── crater-database.ts     # Named crater metadata
│   │   ├── feature-data.ts        # Lunar features (maria, mountains)
│   │   ├── mineral-data.ts        # Lunar mineral deposit sites
│   │   └── types.ts               # TypeScript interfaces
│   ├── image-processing/
│   │   ├── opencv-loader.ts       # Auto-loads OpenCV.js from CDN
│   │   ├── processors.ts          # Canvas/OpenCV image operations
│   │   └── crater-detector.ts     # Viewport capture + detection pipeline
│   ├── layers/
│   │   ├── layer-toggle.ts        # Layer visibility panel
│   │   ├── mineral-layer.ts       # Mineral deposit overlays
│   │   ├── topo-overlay.ts        # Topographic overlay
│   │   └── hazard-zones.ts        # Hazard zone polygons
│   ├── tools/
│   │   ├── measurement-tool.ts    # Distance/area measurement
│   │   └── screenshot-export.ts   # PNG/JSON export
│   ├── types/
│   │   └── opencv.d.ts            # TypeScript declarations for OpenCV.js
│   ├── ui/
│   │   ├── analysis-panel.ts      # Analysis dashboard
│   │   ├── image-viewer.ts        # Full-screen canvas preview modal
│   │   ├── processing-panel.ts    # Image processing, detection, edges UI
│   │   └── legend-panel.ts        # Dynamic legend
│   ├── utils/
│   │   ├── geometry.ts            # Circle polygons, classification
│   │   └── csv-parser.ts          # DeepMoon CSV import
│   └── styles/
│       └── main.css               # All styles
├── DeepMoon/
│   ├── catalogues/                # HeadCraters.csv, LROCCraters.csv
│   └── utils/                     # Reference algorithms
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Performance

- **Zoom thresholds**: Craters filtered by diameter per zoom level (zoom 0 shows only >500km, zoom 7 shows >5km)
- **Viewport filtering**: At zoom 5+, only craters in visible bounds render
- **Canvas heatmap**: Throttled rendering with debounced updates
- **Max crater cap**: Limits rendered features to prevent DOM overload
- **OpenCV.js**: Loaded lazily from CDN (~8MB), not bundled in the output
- **Detection**: Canvas fallback uses stride sampling (3px) and limited RANSAC iterations (20 attempts, 60 votes)

## Data Sources

- **Named Craters**: 300+ manually curated craters with diameter, depth, age, classification
- **DeepMoon Catalogues**: HeadCraters.csv (~5,100 craters) and LROCCraters.csv (~19,300 craters) for database reference
- **Imagery**: NASA Trek LRO WAC Mosaic, USGS Astrogeology LROC WAC/NAC WMS
- **Mineral Data**: Lunar Prospector GRS (Iron Abundance), Clementine UVVIS (Color Ratio), published lunar geology references
- **OpenCV.js**: Loaded from CDN at runtime (not bundled)

## Browser Support

Modern browsers with WebGL and WASM support (Chrome, Firefox, Edge, Safari).

## License

MIT
