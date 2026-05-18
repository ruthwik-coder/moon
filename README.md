# Moon Explorer

Interactive Moon map with crater analysis, detection algorithms, and vision computing tools powered by Leaflet and DeepMoon crater catalogues.

## Features

### Map & Navigation
- **Equidistant Cylindrical Projection**: Full lunar map using `L.CRS.EPSG4326`
- **Multi-source Imagery**: NASA Trek WAC, USGS WMS WAC/NAC layers
- **Zoom-based Rendering**: Craters auto-filter by zoom level for smooth performance
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

### Crater Detection Demo
- **Template Matching**: Circular edge detection algorithm adapted from DeepMoon
- **Coordinate Transforms**: `coord2pix` / `pix2coord` conversions
- **Circular Kernel**: Generates template kernels for crater pattern matching
- **Configurable Parameters**: Min/max diameter, search radius controls
- **Detection Statistics**: Processing time, confidence scores, area scanned

### Measurement Tool
- **Distance Measurement**: Multi-point distance on lunar surface
- **Area Measurement**: Polygon area calculation
- **JSON Export**: Save measurements with coordinates

### Additional Tools
- **Screenshot Export**: PNG capture with timestamp overlay
- **Legend Panel**: Dynamic legend updates with color mode
- **Age Filtering**: Toggle visibility by geological period
- **Search**: Find craters and lunar features by name

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
4. **Analysis**: Click "Analysis" button for charts, detection demo
5. **Measure**: Click "Measure" button, select Distance or Area mode
6. **Color Mode**: Toggle between class-based and age-based coloring
7. **Screenshot**: Click "Screenshot" to export current view as PNG

## Technology Stack

- **Leaflet 1.9.4**: Interactive map library
- **Vite 5**: Build tool and dev server
- **TypeScript 5**: Type safety
- **DeepMoon Integration**: Head & LROC crater catalogues, detection algorithms
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
│   ├── algorithms/
│   │   └── crater-detection.ts    # Template matching, coord transforms
│   ├── features/
│   │   ├── crater-database.ts     # Named crater metadata
│   │   ├── feature-data.ts        # Lunar features (maria, mountains)
│   │   └── types.ts               # TypeScript interfaces
│   ├── layers/
│   │   ├── layer-toggle.ts        # Layer visibility panel
│   │   ├── topo-overlay.ts        # Topographic overlay
│   │   └── hazard-zones.ts        # Hazard zone polygons
│   ├── tools/
│   │   ├── measurement-tool.ts    # Distance/area measurement
│   │   └── screenshot-export.ts   # PNG/JSON export
│   ├── ui/
│   │   ├── analysis-panel.ts      # Analysis dashboard
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
└── tsconfig.json
```

## Performance

- **Zoom thresholds**: Craters filtered by diameter per zoom level (zoom 0 shows only >500km, zoom 7 shows >5km)
- **Viewport filtering**: At zoom 5+, only craters in visible bounds render
- **Canvas heatmap**: Throttled rendering with debounced updates
- **Max crater cap**: Limits rendered features to prevent DOM overload

## Data Sources

- **Named Craters**: 300+ manually curated craters with diameter, depth, age, classification
- **DeepMoon Catalogues**: HeadCraters.csv (~5,100 craters) and LROCCraters.csv (~19,300 craters) for detection algorithm reference
- **Imagery**: NASA Trek LRO WAC Mosaic, USGS Astrogeology LROC WAC/NAC WMS

## Browser Support

Modern browsers with WebGL support (Chrome, Firefox, Edge, Safari).

## License

MIT
