export const MONTHLY_REFRESH_DAYS = 30;

export const STATE_CONFIG = {
  NY: {
    stateCode: "NY",
    stateName: "New York",
    country: "US",
    source: "osm_overpass",
    overpassAreaSelector: 'area["ISO3166-2"="US-NY"][admin_level=4]',
    query: [
      "[out:json][timeout:180];",
      'area["ISO3166-2"="US-NY"][admin_level=4]->.searchArea;',
      "(",
      '  nwr["leisure"="golf_course"](area.searchArea);',
      '  relation["type"="golf_course"](area.searchArea);',
      ");",
      "out center tags;",
    ].join("\n"),
  },
};

export function getStateConfig(stateCode) {
  const normalizedStateCode = stateCode.toUpperCase();
  const config = STATE_CONFIG[normalizedStateCode];

  if (!config) {
    throw new Error(`Unsupported state code "${stateCode}". Add it to scripts/golf-data/state-config.mjs first.`);
  }

  return config;
}
