export const US_STATE_NAMES: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
};

export const INTERNATIONAL_REGION_NAMES: Record<string, string> = {
  SCT: "Scotland",
  ENG: "England",
  IRL: "Ireland",
  NIR: "Northern Ireland",
};

export const REGION_NAMES: Record<string, string> = {
  ...US_STATE_NAMES,
  ...INTERNATIONAL_REGION_NAMES,
};

export function isUsStateCode(stateCode: string | null | undefined) {
  if (!stateCode) return false;
  return Object.prototype.hasOwnProperty.call(US_STATE_NAMES, stateCode.toUpperCase());
}

export function getRegionName(stateCode: string | null | undefined) {
  if (!stateCode) return null;
  return REGION_NAMES[stateCode.toUpperCase()] ?? stateCode.toUpperCase();
}

export function findRegionCode(query: string | null | undefined) {
  if (!query) return null;

  const normalized = query.trim().toLowerCase();

  for (const [code, name] of Object.entries(REGION_NAMES)) {
    if (code.toLowerCase() === normalized || name.toLowerCase() === normalized) {
      return code;
    }
  }

  return null;
}

export function getUsStateName(stateCode: string | null | undefined) {
  return getRegionName(stateCode);
}

export function findUsStateCode(query: string | null | undefined) {
  return findRegionCode(query);
}
