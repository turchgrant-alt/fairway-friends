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
