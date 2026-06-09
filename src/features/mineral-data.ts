export interface MineralDeposit {
  name: string;
  type: 'Titanium' | 'Olivine' | 'Pyroxene' | 'Anorthosite' | 'Iron' | 'Thorium';
  lat: number;
  lng: number;
  abundance: string;
  radiusKm: number;
  geologicContext: string;
}

export const MINERAL_DEPOSITS: MineralDeposit[] = [
  {
    name: 'Mare Tranquillitatis High-Ti Basalts',
    type: 'Titanium',
    lat: 8.5,
    lng: 31.4,
    abundance: '8% – 13% TiO2',
    radiusKm: 400,
    geologicContext: 'High-titanium mare basalts, target area for early volcanic evolution studies.',
  },
  {
    name: 'Aristarchus Plateau Pyroclastic Glass',
    type: 'Thorium',
    lat: 26.3,
    lng: -47.4,
    abundance: 'Highly Elevated',
    radiusKm: 120,
    geologicContext: 'Explosive volcanic regional deposit rich in volatiles and incompatible elements.',
  },
  {
    name: 'Copernicus Crater Central Peak',
    type: 'Olivine',
    lat: 9.6,
    lng: -20.1,
    abundance: 'Deep Crustal Origin',
    radiusKm: 15,
    geologicContext: 'Deep-seated mantle/crust material exposed via massive impact event.',
  },
  {
    name: 'Mare Imbrium West Basalts',
    type: 'Iron',
    lat: 35.0,
    lng: -30.0,
    abundance: '18% – 22% FeO',
    radiusKm: 500,
    geologicContext: 'Extensive volcanic lava plains rich in iron silicates (Pyroxene).',
  },
  {
    name: 'South Pole-Aitken Basin Floor',
    type: 'Pyroxene',
    lat: -56.0,
    lng: 180.0,
    abundance: 'Dominant Mafic Component',
    radiusKm: 1200,
    geologicContext: 'Largest impact scar on the Moon, exposing lower crust compositions.',
  },
  {
    name: 'Anorthositic Highlands (Descartes Area)',
    type: 'Anorthosite',
    lat: -16.0,
    lng: 15.0,
    abundance: '75% – 90% Plagioclase',
    radiusKm: 600,
    geologicContext: 'Ancient primordial lunar magma ocean flotation crust.',
  },
];

export const MINERAL_COLORS: Record<string, string> = {
  Titanium: '#e040fb',
  Olivine: '#69f0ae',
  Pyroxene: '#ffab40',
  Anorthosite: '#40c4ff',
  Iron: '#ff5252',
  Thorium: '#ffd740',
};

export function getMineralDepositsByType(type: string): MineralDeposit[] {
  return MINERAL_DEPOSITS.filter(d => d.type === type);
}

export function getMineralDepositTypes(): string[] {
  return [...new Set(MINERAL_DEPOSITS.map(d => d.type))];
}
