export type MapBoundsTuple = [[number, number], [number, number]];

export interface MapSearchPreset {
  id: string;
  label: string;
  aliases: string[];
  bounds: MapBoundsTuple;
  maxZoom?: number;
}

export const UNITED_STATES_BOUNDS: MapBoundsTuple = [
  [24.396308, -124.848974],
  [49.384358, -66.885444],
];

export const UK_IRELAND_BOUNDS: MapBoundsTuple = [
  [49.8, -11.8],
  [59.8, 2.2],
];

export const MAP_SEARCH_PRESETS: MapSearchPreset[] = [
  {
    id: 'united-states',
    label: 'United States',
    aliases: ['united states', 'usa', 'us', 'america'],
    bounds: UNITED_STATES_BOUNDS,
    maxZoom: 4,
  },
  {
    id: 'new-york',
    label: 'New York',
    aliases: ['new york', 'ny', 'new york state'],
    bounds: [
      [40.45, -79.95],
      [45.15, -71.55],
    ],
    maxZoom: 6,
  },
  {
    id: 'scotland',
    label: 'Scotland',
    aliases: ['scotland'],
    bounds: [
      [54.55, -7.75],
      [60.95, -0.7],
    ],
    maxZoom: 6,
  },
  {
    id: 'england',
    label: 'England',
    aliases: ['england'],
    bounds: [
      [49.85, -6.5],
      [55.95, 2.15],
    ],
    maxZoom: 6,
  },
  {
    id: 'ireland',
    label: 'Ireland',
    aliases: ['ireland', 'republic of ireland'],
    bounds: [
      [51.35, -10.8],
      [55.65, -5.25],
    ],
    maxZoom: 6,
  },
  {
    id: 'northern-ireland',
    label: 'Northern Ireland',
    aliases: ['northern ireland'],
    bounds: [
      [54.0, -8.35],
      [55.4, -5.1],
    ],
    maxZoom: 7,
  },
  {
    id: 'uk-and-ireland',
    label: 'UK & Ireland',
    aliases: ['uk', 'united kingdom', 'uk and ireland', 'britain and ireland', 'great britain and ireland'],
    bounds: UK_IRELAND_BOUNDS,
    maxZoom: 5,
  },
  {
    id: 'arizona',
    label: 'Arizona',
    aliases: ['arizona', 'az'],
    bounds: [
      [31.21, -114.82],
      [37.11, -109.04],
    ],
    maxZoom: 6,
  },
  {
    id: 'scottsdale-arizona',
    label: 'Scottsdale, Arizona',
    aliases: ['scottsdale', 'scottsdale az', 'scottsdale arizona'],
    bounds: [
      [33.38, -112.22],
      [33.80, -111.67],
    ],
    maxZoom: 10,
  },
  {
    id: 'phoenix-arizona',
    label: 'Phoenix, Arizona',
    aliases: ['phoenix', 'phoenix az', 'phoenix arizona'],
    bounds: [
      [33.20, -112.32],
      [33.72, -111.82],
    ],
    maxZoom: 9,
  },
  {
    id: 'pinehurst-north-carolina',
    label: 'Pinehurst, North Carolina',
    aliases: ['pinehurst', 'pinehurst nc', 'pinehurst north carolina'],
    bounds: [
      [35.12, -79.58],
      [35.26, -79.36],
    ],
    maxZoom: 11,
  },
  {
    id: 'myrtle-beach-south-carolina',
    label: 'Myrtle Beach, South Carolina',
    aliases: ['myrtle beach', 'myrtle beach sc', 'myrtle beach south carolina'],
    bounds: [
      [33.58, -79.10],
      [34.15, -78.55],
    ],
    maxZoom: 10,
  },
  {
    id: 'monterey-california',
    label: 'Monterey, California',
    aliases: ['monterey', 'monterey ca', 'monterey california', 'pebble beach'],
    bounds: [
      [36.42, -122.05],
      [36.71, -121.73],
    ],
    maxZoom: 10,
  },
];

export function normalizeMapSearchValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function findMapSearchPreset(value: string) {
  const normalizedQuery = normalizeMapSearchValue(value);

  return MAP_SEARCH_PRESETS.find((preset) =>
    preset.aliases.some((alias) => alias.includes(normalizedQuery) || normalizedQuery.includes(alias)),
  );
}
