export type CraterClass = 'simple' | 'complex' | 'multiring';

export interface LunarFeature {
  name: string;
  lat: number;
  lon: number;
  type: string;
  description: string;
}

export interface CraterMetadata {
  name: string;
  lat: number;
  lon: number;
  diameter: number;
  depth?: number;
  dDRatio?: number;
  craterClass: CraterClass;
  confidence: number;
  significance?: string;
  age?: string;
}

export interface CraterGeoJSON {
  type: 'Feature';
  properties: CraterMetadata;
  geometry: {
    type: 'Polygon';
    coordinates: [number, number][][];
  };
}

export interface LayerVisibility {
  simple: boolean;
  complex: boolean;
  multiring: boolean;
  heatmap: boolean;
  topo: boolean;
  hazard: boolean;
  minerals: boolean;
}

export interface HazardZone {
  name: string;
  type: 'steep_slope' | 'high_density' | 'shadow' | 'rough_terrain';
  coordinates: [number, number][];
  reason: string;
}
