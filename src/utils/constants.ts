export const LAYER_CONFIG = {
  wac: {
    name: 'LRO_WAC_Mosaic_Global_303ppd_v02',
    url: 'https://trek.nasa.gov/tiles/Moon/EQ/{layer}/1.0.0/default/{tileMatrixSet}/{tileMatrix}/{tileRow}/{tileCol}.png',
    format: 'image/png',
    tileMatrixSetID: 'default028mm',
    minimumLevel: 0,
    maximumLevel: 6,
  },
  nac: {
    name: 'LRO_NAC_AvgMosaic_Global_40ppd',
    url: 'https://trek.nasa.gov/tiles/Moon/EQ/{layer}/1.0.0/default/{tileMatrixSet}/{tileMatrix}/{tileRow}/{tileCol}.png',
    format: 'image/png',
    tileMatrixSetID: 'default028mm',
    minimumLevel: 5,
    maximumLevel: 14,
  },
};

export const MIN_ZOOM_FOR_NAC = 5000000;
export const MAX_ZOOM_FOR_WAC = 3000000;

export const CACHE_NAME = 'moon-tiles-v1';
export const CACHE_EXPIRY_DAYS = 30;
