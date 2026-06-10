import type { LandingZone } from './types';

export const LANDING_ZONES: LandingZone[] = [
  {
    name: 'Mare Tranquillitatis',
    type: 'mare',
    coordinates: [
      [10, 20], [10, 35], [5, 40], [0, 42], [-5, 40],
      [-8, 35], [-8, 25], [-5, 20], [0, 18], [5, 18],
    ],
    description: 'Site of Apollo 11 landing. Extensive flat basaltic plains with minimal crater density. Well-characterized terrain with decades of orbital and surface data.',
    hazards: 'Scattered secondary craters, small (<50m) impact pits, moderate temperature swings',
    suitability: 'High — proven safe landing zone, flat terrain, equator-adjacent (good solar illumination)',
  },
  {
    name: 'Oceanus Procellarum',
    type: 'mare',
    coordinates: [
      [20, -60], [18, -50], [15, -40], [10, -35], [5, -35],
      [0, -40], [-5, -45], [-5, -55], [0, -65], [10, -70],
      [18, -68], [20, -60],
    ],
    description: 'Largest lunar mare. Site of Apollo 12, Surveyor 1 & 3 landings. Vast flat lava plains with diverse geological features.',
    hazards: 'Some wrinkle ridges, pyroclastic deposits in northern regions, uneven surface near Marius Hills',
    suitability: 'High — multiple proven landing sites, excellent equatorial location, varied scientific targets',
  },
  {
    name: 'Mare Imbrium Basin',
    type: 'mare',
    coordinates: [
      [35, -25], [35, -10], [30, -5], [25, -5], [20, -10],
      [18, -20], [20, -30], [25, -35], [30, -35], [35, -30],
    ],
    description: 'Large impact basin flooded with mare basalt. Luna 17 (Lunokhod 1) landing site. Exceptionally flat floor with visible flow fronts.',
    hazards: 'Proximal to Apennine mountains, scattered crater rays from Copernicus, some highland massifs at margins',
    suitability: 'High — very flat interior, well-studied, multiple rover traverse routes documented',
  },
  {
    name: 'Mare Serenitatis',
    type: 'mare',
    coordinates: [
      [28, 15], [28, 25], [25, 30], [22, 32], [18, 30],
      [16, 25], [16, 18], [18, 13], [22, 11], [26, 12],
    ],
    description: 'Circular mare basin with very smooth floor. Luna 21 (Lunokhod 2) landing site. Excellent dark mantle deposits at margins.',
    hazards: 'Proximity to Posidonius crater, some mass wasting on ring scarps',
    suitability: 'High — smooth interior, well-characterized by Lunokhod 2 traverse, good for polar-orbiter visibility',
  },
  {
    name: 'South Pole Highlands — Artemis Candidates',
    type: 'highland',
    coordinates: [
      [-84, -45], [-83, -20], [-82, 0], [-83, 20], [-84, 45],
      [-86, 60], [-88, 45], [-89, 0], [-88, -45], [-86, -60],
    ],
    description: 'Multiple candidate landing zones for NASA Artemis program. Peaks of near-eternal light provide solar power. Permanently shadowed craters nearby for ice resources.',
    hazards: 'Extreme cold in shadowed regions, complex topography, communication challenges (low Earth visibility), unknown surface properties at poles',
    suitability: 'Medium-High — strategic importance for ISRU, unique science, but challenging environment',
  },
  {
    name: 'Mare Fecunditatis',
    type: 'mare',
    coordinates: [
      [-2, 45], [-2, 55], [-5, 60], [-10, 62], [-15, 60],
      [-18, 55], [-18, 48], [-15, 43], [-10, 42], [-5, 43],
    ],
    description: 'Eastern equatorial mare. Luna 16 sample return site. Relatively flat with moderate crater density and interesting dark halo craters.',
    hazards: 'Some rough terrain near Langrenus crater, scattered secondary crater chains',
    suitability: 'Medium-High — equatorial location, proven robotic landing site, diverse geology',
  },
  {
    name: 'Sinus Medii',
    type: 'mare',
    coordinates: [
      [4, -5], [4, 5], [2, 8], [-2, 8], [-4, 5],
      [-4, -2], [-2, -5], [1, -6],
    ],
    description: 'Central lunar bay at the Moon\'s sub-Earth point. Surveyor 6 landing site. Optimal location for Earth-communication relay.',
    hazards: 'Limited area, proximity to small craters, some mare ridges',
    suitability: 'Medium — excellent communication geometry, small landing footprint',
  },
  {
    name: 'Mare Nubium',
    type: 'mare',
    coordinates: [
      [-16, -20], [-18, -12], [-20, -5], [-24, -5], [-28, -10],
      [-30, -18], [-28, -25], [-24, -28], [-20, -28],
    ],
    description: 'Southern mare region. Surveyor 7 landing site. Contains the Straight Wall (Rupes Recta), a 110m high fault scarp. Diverse basalt compositions.',
    hazards: 'Rima Birt and other sinuous rilles, proximity to Straight Wall scarp, some ejecta from Tycho',
    suitability: 'Medium-High — scientifically rich, proven robotic landing, varied terrain for exploration',
  },
  {
    name: 'Mare Crisium',
    type: 'mare',
    coordinates: [
      [12, 52], [14, 56], [14, 62], [12, 66], [8, 67],
      [5, 65], [3, 60], [3, 55], [5, 51], [8, 50],
    ],
    description: 'Small isolated mare basin northeast of Tranquillitatis. Luna 24 sample return site. Well-defined circular basin with distinct mare/highland boundary.',
    hazards: 'Steep basin walls, restricted landing footprint, some rough ejecta from Giordano Bruno',
    suitability: 'Medium — unique isolated basin, good for mare chronology studies, restricted area',
  },
  {
    name: 'Mare Frigoris',
    type: 'mare',
    coordinates: [
      [52, -10], [50, 5], [48, 20], [46, 35], [48, 50],
      [50, 60], [52, 65], [56, 60], [58, 45], [58, 30],
      [56, 15], [54, 0],
    ],
    description: 'Northern mare stretching across the lunar north. Long narrow basalt plain with diverse volcanic features. Potential resource-rich region.',
    hazards: 'Higher latitude (reduced solar power), proximity to north polar cold traps, some ridge belts',
    suitability: 'Medium — unique high-latitude mare science, water ice potential in nearby poles, reduced solar efficiency',
  },
];
