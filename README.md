# Moon Explorer

Interactive zoomable Moon map using CesiumJS with NASA Trek WMTS imagery.

## Features

- **Equidistant Cylindrical Projection**: Full globe view using GeographicTilingScheme
- **Hybrid Imagery**: 
  - WAC (Wide Angle Camera) for global overview
  - NAC (Narrow Angle Camera) for high-resolution detail when zoomed in
- **Coordinate Display**: Real-time latitude/longitude on mouse hover
- **Feature Search**: Search and navigate to lunar craters, maria, and other features
- **Keyboard Controls**: Zoom with +/- keys, Home to reset view

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Usage

1. **Pan**: Click and drag to rotate the Moon
2. **Zoom**: Use mouse wheel or +/- keys
3. **Search**: Type in the search box to find features
4. **Coordinates**: Move mouse over surface to see lat/lon
5. **Home**: Press Home key to return to default view

## Technology Stack

- **CesiumJS 1.113+**: 3D globe visualization
- **Vite**: Build tool and dev server
- **TypeScript**: Type safety
- **NASA Trek WMTS**: Lunar imagery from LROC NAC and WAC mosaics

## Data Sources

- Imagery: [NASA Trek](https://trek.nasa.gov/) WMTS services
- LROC WAC Mosaic: Global 303ppd coverage
- LROC NAC Mosaic: High-resolution 40ppd coverage

## Project Structure

```
moon-explorer/
├── src/
│   ├── main.ts              # Entry point
│   ├── moon-viewer.ts       # CesiumJS configuration
│   ├── layers/              # WAC/NAC layer management
│   ├── ui/                  # UI components
│   └── features/            # Lunar feature database
├── index.html
└── package.json
```

## Browser Support

Modern browsers with WebGL support (Chrome, Firefox, Edge, Safari).

## License

MIT
