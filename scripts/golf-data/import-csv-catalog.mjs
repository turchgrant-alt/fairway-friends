import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

const sourceCsvPath = path.join(
  repoRoot,
  "data",
  "course-catalog",
  "source",
  "us_uk_ie_golf_courses_dataset_enriched.csv",
);
const normalizedDir = path.join(repoRoot, "data", "course-catalog", "normalized");
const normalizedCatalogPath = path.join(normalizedDir, "us-golf-courses.normalized.json");
const generatedDir = path.join(repoRoot, "src", "data", "generated");
const publicDataDir = path.join(repoRoot, "public", "data");
const publicCatalogJsonPath = path.join(publicDataDir, "courseCatalog.generated.json");
const publicCourseIndexJsonPath = path.join(publicDataDir, "courseCatalog.index.generated.json");
const publicCourseLocationIndexJsonPath = path.join(publicDataDir, "courseLocationIndex.generated.json");
const publicStatesDir = path.join(publicDataDir, "states");
const generatedManifestJsonPath = path.join(generatedDir, "courseCatalog.manifest.generated.json");
const generatedSummaryJsonPath = path.join(generatedDir, "courseCatalog.summary.generated.json");
const nyOsmCatalogPath = path.join(repoRoot, "data", "golf-course-pipeline", "normalized", "NY.normalized.json");

const SOURCE = "csv_catalog";
const UNITED_STATES = "United States";
const UNITED_KINGDOM = "United Kingdom";
const UNKNOWN_ACCESS = "unknown";
const UNKNOWN_STATUS = "unknown";
const FEATURED_COURSE_NAMES = [
  "Bethpage State Park (The Black Course)",
  "Oak Hill Country Club (East Course)",
  "Pebble Beach Golf Links",
];

const US_STATE_NAMES = {
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

const INTERNATIONAL_REGION_NAMES = {
  Scotland: "Scotland",
  England: "England",
  Ireland: "Ireland",
  "Northern Ireland": "Northern Ireland",
};

const INTERNATIONAL_REGION_DETAILS = {
  Scotland: {
    stateCode: "SCT",
    country: UNITED_KINGDOM,
  },
  England: {
    stateCode: "ENG",
    country: UNITED_KINGDOM,
  },
  Ireland: {
    stateCode: "IRL",
    country: "Ireland",
  },
  "Northern Ireland": {
    stateCode: "NIR",
    country: UNITED_KINGDOM,
  },
};

function normalizeString(value) {
  if (value == null) return null;

  const normalized = String(value).trim().replace(/\s+/g, " ");
  return normalized.length > 0 ? normalized : null;
}

function getCsvValue(row, key) {
  return row[key] ?? row[`﻿${key}`] ?? "";
}

function normalizeWebsite(value) {
  const normalized = normalizeString(value);
  if (!normalized) return null;

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  if (/^www\./i.test(normalized) || /^[a-z0-9.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(normalized)) {
    return `https://${normalized.replace(/^https?:\/\//i, "")}`;
  }

  return null;
}

function normalizePhone(value) {
  return normalizeString(value);
}

function normalizeBooleanFlag(value) {
  const normalized = normalizeString(value)?.toLowerCase();
  if (!normalized) return null;
  if (["true", "yes", "1"].includes(normalized)) return true;
  if (["false", "no", "0"].includes(normalized)) return false;
  return null;
}

function normalizeTourHistoryType(value) {
  const normalized = normalizeString(value)?.toLowerCase();
  if (!normalized) return null;

  const hasLpga = /\blpga\b/.test(normalized);
  const hasPga = /\bpga\b/.test(normalized);

  if (hasPga && hasLpga) return "pga_lpga";
  if (hasLpga) return "lpga";
  if (hasPga) return "pga";

  return null;
}

function normalizeStatus(value) {
  const normalized = normalizeString(value)?.toLowerCase().replace(/_/g, " ");
  if (!normalized || normalized === UNKNOWN_STATUS) return UNKNOWN_STATUS;
  if (normalized.includes("season")) return "seasonal";
  if (normalized.includes("close")) return "closed";
  if (normalized.includes("open")) return "open";
  return UNKNOWN_STATUS;
}

function normalizeAccessType(value) {
  const normalized = normalizeString(value)?.toLowerCase().replace(/_/g, "-");
  switch (normalized) {
    case "public":
      return "public";
    case "private":
      return "private";
    case "semi-private":
      return "semi-private";
    case "municipal":
      return "municipal";
    case "resort":
      return "resort";
    default:
      return UNKNOWN_ACCESS;
  }
}

function normalizeStateCode(value) {
  return normalizeString(value)?.toUpperCase() ?? null;
}

function isUsStateCode(stateCode) {
  if (!stateCode) return false;
  return Object.prototype.hasOwnProperty.call(US_STATE_NAMES, stateCode);
}

function resolveRegion(rawStateValue) {
  const normalizedStateValue = normalizeString(rawStateValue);

  if (!normalizedStateValue) {
    return {
      stateCode: "US",
      stateName: null,
      country: UNITED_STATES,
      isUnitedStatesRegion: true,
    };
  }

  const normalizedStateCode = normalizeStateCode(normalizedStateValue);
  if (normalizedStateCode && isUsStateCode(normalizedStateCode)) {
    return {
      stateCode: normalizedStateCode,
      stateName: US_STATE_NAMES[normalizedStateCode],
      country: UNITED_STATES,
      isUnitedStatesRegion: true,
    };
  }

  for (const [stateName, details] of Object.entries(INTERNATIONAL_REGION_DETAILS)) {
    if (
      stateName.toLowerCase() === normalizedStateValue.toLowerCase() ||
      details.stateCode === normalizedStateCode
    ) {
      return {
        stateCode: details.stateCode,
        stateName,
        country: details.country,
        isUnitedStatesRegion: false,
      };
    }
  }

  return {
    stateCode: normalizedStateCode ?? normalizedStateValue,
    stateName: normalizedStateValue,
    country: UNITED_STATES,
    isUnitedStatesRegion: false,
  };
}

function getStateName(stateCode) {
  if (!stateCode) return null;
  if (US_STATE_NAMES[stateCode]) {
    return US_STATE_NAMES[stateCode];
  }

  for (const [stateName, details] of Object.entries(INTERNATIONAL_REGION_DETAILS)) {
    if (details.stateCode === stateCode) {
      return stateName;
    }
  }

  return stateCode;
}

function getRegionDisplayLabel({ stateCode, stateName, country }) {
  if (country === UNITED_STATES && isUsStateCode(stateCode)) {
    return stateCode;
  }

  return stateName ?? stateCode ?? null;
}

function getCountyDisplayLabel(county, country) {
  const normalizedCounty = normalizeString(county);
  if (!normalizedCounty) return null;

  if (country === UNITED_STATES && !/^county\b/i.test(normalizedCounty)) {
    return `${normalizedCounty} County`;
  }

  return normalizedCounty;
}

function parseInteger(value) {
  const normalized = normalizeString(value);
  if (!normalized || !/^-?\d+$/.test(normalized)) return null;

  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseFloatValue(value) {
  const normalized = normalizeString(value);
  if (!normalized) return null;

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseWorldTop100Rank(value) {
  const normalized = normalizeString(value);
  if (!normalized) return null;

  const match = normalized.match(/world\s+top\s+100\s*\(#\s*(\d+)\s*\)/i);
  if (!match) return null;

  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeName(value) {
  return normalizeString(value)
    ?.toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(golf|course|club|country|the|at|and)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim() ?? "";
}

function formatCourseSubLabel(courseName) {
  const normalizedCourseName = normalizeString(courseName);
  if (!normalizedCourseName) return null;

  const numberedCourseMatch = normalizedCourseName.match(/^(\d+(?:\s*&\s*\d+)*)\s+Course$/i);
  if (numberedCourseMatch) {
    const numberLabel = numberedCourseMatch[1].replace(/\s*&\s*/g, " & ");
    return `No. ${numberLabel}`;
  }

  return normalizedCourseName;
}

function pickPreferredRedundantName(facilityName, courseLabel) {
  const normalizedFacility = normalizeString(facilityName);
  const normalizedCourseLabel = normalizeString(courseLabel);

  if (!normalizedFacility) return normalizedCourseLabel;
  if (!normalizedCourseLabel) return normalizedFacility;

  return normalizedCourseLabel.length > normalizedFacility.length
    ? normalizedCourseLabel
    : normalizedFacility;
}

function tokenSet(value) {
  return new Set(normalizeName(value).split(" ").filter(Boolean));
}

function buildDisplayName(facilityName, courseName) {
  const normalizedFacilityName = normalizeString(facilityName);
  const normalizedCourseName = normalizeString(courseName);
  const courseLabel = formatCourseSubLabel(normalizedCourseName);

  if (normalizedFacilityName && courseLabel) {
    const facilityNormalized = normalizeName(normalizedFacilityName);
    const courseNormalized = normalizeName(courseLabel);

    if (!courseNormalized || facilityNormalized === courseNormalized) {
      return normalizedFacilityName;
    }

    if (facilityNormalized.includes(courseNormalized)) {
      return normalizedFacilityName;
    }

    if (courseNormalized.includes(facilityNormalized)) {
      return pickPreferredRedundantName(normalizedFacilityName, courseLabel);
    }

    return `${normalizedFacilityName} (${courseLabel})`;
  }

  return normalizedFacilityName ?? courseLabel ?? normalizedCourseName ?? "Unnamed golf course";
}

function extractStreetAddress(fullAddress, city, stateCode, stateName, postcode, country = UNITED_STATES) {
  const normalizedAddress = normalizeString(fullAddress);
  if (!normalizedAddress) return null;

  const normalizedCity = normalizeString(city);
  const regionLabel = normalizeString(getRegionDisplayLabel({ stateCode, stateName, country }));
  const normalizedPostcode = normalizeString(postcode);

  if (normalizedCity && regionLabel) {
    const suffixPattern = normalizedPostcode
      ? new RegExp(
          `,\\s*${escapeRegex(normalizedCity)},\\s*${escapeRegex(regionLabel)}\\s*${escapeRegex(normalizedPostcode)}$`,
          "i",
        )
      : new RegExp(`,\\s*${escapeRegex(normalizedCity)},\\s*${escapeRegex(regionLabel)}(?:\\s+[A-Z0-9-]+)?$`, "i");

    const stripped = normalizedAddress.replace(suffixPattern, "");
    if (stripped !== normalizedAddress) {
      return normalizeString(stripped);
    }
  }

  const [firstSegment] = normalizedAddress.split(",");
  const normalizedFirstSegment = normalizeString(firstSegment);

  if (!normalizedFirstSegment) return null;
  if (normalizedCity && normalizedFirstSegment.toLowerCase() === normalizedCity.toLowerCase()) return null;

  return normalizedFirstSegment;
}

function buildAddressLabel({ fullAddress, streetAddress, city, stateCode, stateName, postcode, country }) {
  const normalizedFullAddress = normalizeString(fullAddress);
  if (normalizedFullAddress) {
    return normalizedFullAddress;
  }

  const locality = [
    normalizeString(city),
    normalizeString(getRegionDisplayLabel({ stateCode, stateName, country })),
  ]
    .filter(Boolean)
    .join(", ");

  if (streetAddress && locality && postcode) {
    return `${streetAddress}, ${locality} ${postcode}`;
  }

  if (streetAddress && locality) {
    return `${streetAddress}, ${locality}`;
  }

  if (streetAddress) return streetAddress;
  if (locality && postcode) return `${locality} ${postcode}`;
  if (locality) return locality;
  if (postcode) return postcode;

  return null;
}

function buildLocationLabel({ city, stateCode, stateName, county, country }) {
  const regionLabel = getRegionDisplayLabel({ stateCode, stateName, country });
  const countyLabel = getCountyDisplayLabel(county, country);

  if (city && regionLabel) return `${city}, ${regionLabel}`;
  if (countyLabel && regionLabel) return `${countyLabel}, ${regionLabel}`;
  if (stateName) return stateName;
  if (regionLabel) return regionLabel;
  return "Unknown location";
}

function buildTags({ accessType, holes, status, worldTop100Rank }) {
  const tags = [];

  if (accessType && accessType !== UNKNOWN_ACCESS) tags.push(accessType);
  if (holes != null) tags.push(`${holes}-hole`);
  if (status && ![UNKNOWN_STATUS, "open", "operating"].includes(status)) tags.push(status);
  if (worldTop100Rank != null) tags.push("world-top-100");

  return Array.from(new Set(tags));
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (inQuotes) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"') {
      inQuotes = true;
      continue;
    }

    if (character === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (character === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    if (character === "\r") {
      continue;
    }

    field += character;
  }

  row.push(field);
  if (row.length > 1 || row[0] !== "") {
    rows.push(row);
  }

  const [headers = [], ...records] = rows;
  const normalizedHeaders = headers.map((header) => String(header).replace(/^\uFEFF/, "").trim());

  return records
    .filter((record) => record.some((value) => value !== ""))
    .map((record) => Object.fromEntries(normalizedHeaders.map((header, index) => [header, record[index] ?? ""])));
}

function buildNameVariants(facilityName, courseName, displayName) {
  const variants = new Set();

  [facilityName, courseName, displayName].forEach((value) => {
    const normalized = normalizeName(value);
    if (normalized) variants.add(normalized);
  });

  if (facilityName && courseName && normalizeName(facilityName) !== normalizeName(courseName)) {
    const combined = normalizeName(`${facilityName} ${courseName}`);
    if (combined) variants.add(combined);
  }

  return Array.from(variants);
}

function scoreNameMatch(nameVariants, candidateName) {
  const candidateNormalized = normalizeName(candidateName);
  if (!candidateNormalized) return 0;

  let bestScore = 0;
  const candidateTokens = tokenSet(candidateName);

  for (const variant of nameVariants) {
    if (!variant) continue;
    if (variant === candidateNormalized) return 1;

    const variantTokens = tokenSet(variant);
    const overlap = new Set([...variantTokens].filter((token) => candidateTokens.has(token)));
    const unionCount = new Set([...variantTokens, ...candidateTokens]).size || 1;
    let score = overlap.size / unionCount;

    if (candidateNormalized.includes(variant) || variant.includes(candidateNormalized)) {
      score = Math.max(score, 0.84);
    }

    bestScore = Math.max(bestScore, score);
  }

  return bestScore;
}

function scoreAddressMatch(streetAddress, candidateAddress) {
  const sourceStreet = normalizeName(streetAddress);
  const targetStreet = normalizeName(candidateAddress);

  if (!sourceStreet || !targetStreet) return 0;
  if (sourceStreet === targetStreet) return 0.15;
  if (sourceStreet.includes(targetStreet) || targetStreet.includes(sourceStreet)) return 0.08;

  return 0;
}

function createNyEnrichmentIndex(records) {
  const byCity = new Map();

  for (const record of records) {
    const cityKey = normalizeString(record.city)?.toLowerCase() ?? "";
    const bucket = byCity.get(cityKey) ?? [];
    bucket.push(record);
    byCity.set(cityKey, bucket);
  }

  return {
    byCity,
    all: records,
  };
}

function findNyEnrichment(row, nyIndex) {
  if (!nyIndex) return null;

  const stateCode = normalizeStateCode(getCsvValue(row, "state"));
  if (stateCode !== "NY") return null;

  const facilityName = normalizeString(getCsvValue(row, "facility_name"));
  const courseName = normalizeString(getCsvValue(row, "course_name"));
  const displayName = buildDisplayName(facilityName, courseName);
  const nameVariants = buildNameVariants(facilityName, courseName, displayName);
  const cityKey = normalizeString(getCsvValue(row, "city"))?.toLowerCase() ?? "";
  const streetAddress = extractStreetAddress(
    getCsvValue(row, "full_address"),
    getCsvValue(row, "city"),
    getCsvValue(row, "state"),
    getStateName(stateCode),
    getCsvValue(row, "zip_code"),
    UNITED_STATES,
  );
  const candidates = nyIndex.byCity.get(cityKey) ?? nyIndex.all;

  let bestCandidate = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    let score = scoreNameMatch(nameVariants, candidate.name);
    score += scoreAddressMatch(streetAddress, candidate.streetAddress ?? candidate.addressLabel);

    if (score > bestScore) {
      bestCandidate = candidate;
      bestScore = score;
    }
  }

  if (!bestCandidate || bestScore < 0.86) {
    return null;
  }

  return {
    matchedCourseId: bestCandidate.id,
    matchedCourseName: bestCandidate.name,
    score: Number(bestScore.toFixed(3)),
    latitude: bestCandidate.latitude,
    longitude: bestCandidate.longitude,
    website: bestCandidate.website,
    phone: bestCandidate.phone,
    source: bestCandidate.source,
  };
}

function mergeDuplicateRecords(existingRecord, incomingRecord) {
  for (const [key, value] of Object.entries(incomingRecord)) {
    if (existingRecord[key] == null && value != null) {
      existingRecord[key] = value;
    }
  }

  if (
    existingRecord.hasPgaOrLpgaTourHistory !== true &&
    incomingRecord.hasPgaOrLpgaTourHistory === true
  ) {
    existingRecord.hasPgaOrLpgaTourHistory = true;
    existingRecord.pgaLpgaTourHistoryType =
      existingRecord.pgaLpgaTourHistoryType ?? incomingRecord.pgaLpgaTourHistoryType ?? null;
    existingRecord.pgaLpgaTourHistoryNote =
      existingRecord.pgaLpgaTourHistoryNote ?? incomingRecord.pgaLpgaTourHistoryNote ?? null;
    existingRecord.pgaLpgaTourHistorySourceUrl =
      existingRecord.pgaLpgaTourHistorySourceUrl ?? incomingRecord.pgaLpgaTourHistorySourceUrl ?? null;
  }

  if (
    existingRecord.hasVerifiedCoordinates === false &&
    incomingRecord.hasVerifiedCoordinates === true
  ) {
    existingRecord.latitude = incomingRecord.latitude;
    existingRecord.longitude = incomingRecord.longitude;
    existingRecord.hasVerifiedCoordinates = true;
    existingRecord.coordinateSource = incomingRecord.coordinateSource;
  }

  existingRecord.tags = Array.from(new Set([...(existingRecord.tags ?? []), ...(incomingRecord.tags ?? [])]));

  const existingRaw = existingRecord.rawSourceData ?? {};
  const incomingRaw = incomingRecord.rawSourceData ?? {};
  existingRecord.rawSourceData = {
    ...existingRaw,
    duplicateRowNumbers: [
      ...new Set([...(existingRaw.duplicateRowNumbers ?? []), ...(incomingRaw.duplicateRowNumbers ?? [])]),
    ],
    sourceRows: [...(existingRaw.sourceRows ?? []), ...(incomingRaw.sourceRows ?? [])],
  };
}

function ensureUniqueIds(records) {
  const counts = new Map();

  for (const record of records) {
    const baseSlug =
      slugify([record.stateCode, record.city, record.courseName ?? record.facilityName ?? record.name].filter(Boolean).join("-")) ||
      record.sourceId;
    const nextCount = (counts.get(baseSlug) ?? 0) + 1;
    counts.set(baseSlug, nextCount);
    record.id = nextCount === 1 ? baseSlug : `${baseSlug}-${nextCount}`;
  }
}

function buildNormalizedRecord(row, rowIndex, importedAt, nyIndex) {
  const region = resolveRegion(getCsvValue(row, "state"));
  const stateCode = region.stateCode;
  const stateName = region.stateName ?? getStateName(stateCode);
  const facilityName = normalizeString(getCsvValue(row, "facility_name"));
  const courseName = normalizeString(getCsvValue(row, "course_name"));
  const name = buildDisplayName(facilityName, courseName);
  const fullAddress = normalizeString(getCsvValue(row, "full_address"));
  const city = normalizeString(getCsvValue(row, "city"));
  const postcode = normalizeString(getCsvValue(row, "zip_code"));
  const streetAddress = extractStreetAddress(fullAddress, city, stateCode, stateName, postcode, region.country);
  const county = normalizeString(getCsvValue(row, "county"));
  const accessTypeRaw = normalizeString(getCsvValue(row, "access_type"));
  const statusRaw = normalizeString(getCsvValue(row, "status"));
  const accessType = normalizeAccessType(accessTypeRaw);
  const status = normalizeStatus(statusRaw);
  const csvLatitude = parseFloatValue(getCsvValue(row, "latitude"));
  const csvLongitude = parseFloatValue(getCsvValue(row, "longitude"));
  const csvHasCoordinates = csvLatitude != null && csvLongitude != null;
  const nyEnrichment = csvHasCoordinates ? null : findNyEnrichment(row, nyIndex);
  const latitude = csvHasCoordinates ? csvLatitude : nyEnrichment?.latitude ?? null;
  const longitude = csvHasCoordinates ? csvLongitude : nyEnrichment?.longitude ?? null;
  const hasVerifiedCoordinates = latitude != null && longitude != null;
  const coordinateSource = csvHasCoordinates ? SOURCE : nyEnrichment?.source ?? null;
  const website = normalizeWebsite(getCsvValue(row, "website")) ?? normalizeWebsite(nyEnrichment?.website) ?? null;
  const phone = normalizePhone(getCsvValue(row, "phone_number")) ?? normalizePhone(nyEnrichment?.phone) ?? null;
  const holes = parseInteger(getCsvValue(row, "number_of_holes"));
  const par = parseInteger(getCsvValue(row, "par"));
  const sourceRowNumber = rowIndex + 2;
  const description = normalizeString(getCsvValue(row, "notes"));
  const hasPgaOrLpgaTourHistory = normalizeBooleanFlag(getCsvValue(row, "has_pga_or_lpga_tour_history"));
  const pgaLpgaTourHistoryType = normalizeTourHistoryType(getCsvValue(row, "pga_lpga_tour_history_type"));
  const pgaLpgaTourHistoryNote = normalizeString(getCsvValue(row, "pga_lpga_tour_history_note"));
  const pgaLpgaTourHistorySourceUrl = normalizeWebsite(getCsvValue(row, "pga_lpga_tour_history_source_url"));
  const worldTop100Rank = parseWorldTop100Rank(description);

  return {
    id: "",
    source: SOURCE,
    sourceId: `csv-row-${sourceRowNumber}`,
    stateCode,
    facilityName,
    courseName,
    name,
    fullAddress,
    streetAddress,
    city,
    state: stateName,
    postcode,
    county,
    country: region.country,
    addressLabel: buildAddressLabel({ fullAddress, streetAddress, city, stateCode, stateName, postcode, country: region.country }),
    latitude,
    longitude,
    hasVerifiedCoordinates,
    coordinateSource,
    accessType,
    accessTypeRaw,
    status,
    statusRaw,
    par,
    holes,
    website,
    phone,
    operator: null,
    openingHours: null,
    sourceName: normalizeString(getCsvValue(row, "source_name")),
    sourceUrl: normalizeString(getCsvValue(row, "source_url")),
    secondarySourceName: normalizeString(getCsvValue(row, "secondary_source_name")),
    secondarySourceUrl: normalizeString(getCsvValue(row, "secondary_source_url")),
    confidenceLevel: normalizeString(getCsvValue(row, "confidence_level")),
    lastVerifiedDate: normalizeString(getCsvValue(row, "last_verified_date")),
    teeName: normalizeString(getCsvValue(row, "tee_name")),
    gender: normalizeString(getCsvValue(row, "gender")),
    courseRating: parseFloatValue(getCsvValue(row, "course_rating")),
    slopeRating: parseFloatValue(getCsvValue(row, "slope_rating")),
    hasPgaOrLpgaTourHistory,
    pgaLpgaTourHistoryType,
    pgaLpgaTourHistoryNote,
    pgaLpgaTourHistorySourceUrl,
    worldTop100Rank,
    tags: buildTags({ accessType, holes, status, worldTop100Rank }),
    description,
    lastSyncedAt: importedAt,
    rawSourceData: {
      sourceRowNumber,
      duplicateRowNumbers: [],
      sourceRows: [row],
      enrichmentMatch: nyEnrichment ?? null,
    },
  };
}

function buildFrontendCourseRecord(record) {
  return {
    ...record,
    rawSourceData: undefined,
    location: buildLocationLabel({
      city: record.city,
      stateCode: record.stateCode,
      stateName: record.state,
      county: record.county,
      country: record.country,
    }),
    type: record.accessType && record.accessType !== UNKNOWN_ACCESS ? record.accessType : "course",
    imageUrl: "/placeholder.svg",
    overallRating: null,
    reviewCount: 0,
    playedCount: 0,
    savedCount: 0,
    priceRange: null,
    designer: null,
    yearBuilt: null,
    yardage: null,
    ratings: {},
  };
}

function buildCourseIndexRecord(record) {
  return {
    id: record.id,
    stateCode: record.stateCode,
    name: record.name,
    facilityName: record.facilityName,
    courseName: record.courseName,
    city: record.city,
    state: record.state,
    country: record.country,
    county: record.county,
    addressLabel: record.addressLabel,
    location: buildLocationLabel({
      city: record.city,
      stateCode: record.stateCode,
      stateName: record.state,
      county: record.county,
      country: record.country,
    }),
    latitude: record.latitude,
    longitude: record.longitude,
    hasVerifiedCoordinates: record.hasVerifiedCoordinates,
    accessType: record.accessType,
    type: record.accessType && record.accessType !== UNKNOWN_ACCESS ? record.accessType : "course",
    par: record.par,
    holes: record.holes,
    website: record.website,
    phone: record.phone,
    description: record.description,
    hasPgaOrLpgaTourHistory: record.hasPgaOrLpgaTourHistory,
    pgaLpgaTourHistoryType: record.pgaLpgaTourHistoryType,
    pgaLpgaTourHistoryNote: record.pgaLpgaTourHistoryNote,
    pgaLpgaTourHistorySourceUrl: record.pgaLpgaTourHistorySourceUrl,
    worldTop100Rank: record.worldTop100Rank,
    tags: record.tags,
    imageUrl: "/placeholder.svg",
    overallRating: null,
    priceRange: null,
  };
}

function findCourseByName(records, name) {
  const normalized = normalizeName(name);
  return records.find((record) => normalizeName(record.name) === normalized);
}

function buildSummary(frontendRecords, manifest) {
  const fallbackCourses = frontendRecords.slice(0, 6);
  const featuredCourses = FEATURED_COURSE_NAMES
    .map((name) => findCourseByName(frontendRecords, name))
    .filter(Boolean);
  const resolvedFeaturedCourses = featuredCourses.length > 0 ? featuredCourses : fallbackCourses.slice(0, 3);
  const publicAccessCourses = frontendRecords.filter((record) =>
    ["public", "municipal", "semi-private"].includes(record.accessType ?? ""),
  );
  const privateCourses = frontendRecords.filter((record) => record.accessType === "private");

  return {
    stats: {
      totalCourses: frontendRecords.length,
      statesRepresented: manifest.stateCodes.length,
      representedStateCodes: manifest.stateCodes,
      mappableCourses: manifest.mappableRecordCount,
      coordinateCoveragePercent: Math.round(manifest.coordinateCoverageRatio * 1000) / 10,
      lastImportedAt: manifest.importedAt,
    },
    featuredCourses: resolvedFeaturedCourses,
    starterLists: [
      {
        id: "starter-public",
        title: "Public access starter set",
        description: "A practical starting slice of public and municipal golf from the stored catalog.",
        courses: publicAccessCourses.slice(0, 6),
      },
      {
        id: "starter-private",
        title: "Private club references",
        description: "Useful structure for private-course pages and metadata review without fake member/social context.",
        courses: privateCourses.slice(0, 6),
      },
      {
        id: "starter-featured",
        title: "Core catalog anchors",
        description: "A few recognizable courses to keep the v1 demo grounded while the stored catalog expands.",
        courses: resolvedFeaturedCourses,
      },
    ],
  };
}

function buildBoundsForRecords(records) {
  const mappableRecords = records.filter((record) => record.latitude != null && record.longitude != null);

  if (mappableRecords.length === 0) {
    return null;
  }

  const latitudes = mappableRecords.map((record) => record.latitude);
  const longitudes = mappableRecords.map((record) => record.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);
  const latPadding = Math.max((maxLat - minLat) * 0.15, 0.05);
  const lonPadding = Math.max((maxLon - minLon) * 0.15, 0.05);

  return [
    [minLat - latPadding, minLon - lonPadding],
    [maxLat + latPadding, maxLon + lonPadding],
  ];
}

function buildStateAliases(stateCode, stateName, country) {
  const aliases = new Set();

  if (stateCode) aliases.add(stateCode);
  if (stateName) {
    aliases.add(stateName);
    aliases.add(country === UNITED_STATES ? `${stateName} state` : `${stateName} region`);
  }

  if (country === UNITED_KINGDOM) {
    aliases.add("uk");
    aliases.add("united kingdom");
  }

  if (stateName === "Ireland") {
    aliases.add("republic of ireland");
  }

  return Array.from(aliases);
}

function buildCityAliases(city, stateCode, stateName) {
  const aliases = new Set();

  if (!city) return [];

  aliases.add(city);

  if (stateCode) {
    aliases.add(`${city}, ${stateCode}`);
    aliases.add(`${city} ${stateCode}`);
  }

  if (stateName) {
    aliases.add(`${city}, ${stateName}`);
    aliases.add(`${city} ${stateName}`);
  }

  return Array.from(aliases);
}

function buildCountyAliases(county, stateCode, stateName) {
  const aliases = new Set();
  const normalizedCounty = normalizeString(county);

  if (!normalizedCounty) return [];

  aliases.add(normalizedCounty);

  const plainCounty = normalizedCounty.replace(/^county\s+/i, "");
  if (plainCounty !== normalizedCounty) {
    aliases.add(plainCounty);
  }

  if (stateCode) {
    aliases.add(`${normalizedCounty}, ${stateCode}`);
    aliases.add(`${plainCounty}, ${stateCode}`);
  }

  if (stateName) {
    aliases.add(`${normalizedCounty}, ${stateName}`);
    aliases.add(`${plainCounty}, ${stateName}`);
  }

  return Array.from(aliases).filter(Boolean);
}

function buildLocationIndex(indexRecords) {
  const stateBuckets = new Map();
  const countyBuckets = new Map();
  const cityBuckets = new Map();

  for (const record of indexRecords) {
    const stateBucket = stateBuckets.get(record.stateCode) ?? [];
    stateBucket.push(record);
    stateBuckets.set(record.stateCode, stateBucket);

    if (record.country !== UNITED_STATES && record.county) {
      const countyKey = `${record.stateCode}|${record.county.toLowerCase()}`;
      const countyBucket = countyBuckets.get(countyKey) ?? [];
      countyBucket.push(record);
      countyBuckets.set(countyKey, countyBucket);
    }

    if (record.city) {
      const cityKey = `${record.stateCode}|${record.city.toLowerCase()}`;
      const cityBucket = cityBuckets.get(cityKey) ?? [];
      cityBucket.push(record);
      cityBuckets.set(cityKey, cityBucket);
    }
  }

  const entries = [];

  for (const [stateCode, records] of stateBuckets.entries()) {
    const stateName = records[0]?.state ?? getStateName(stateCode) ?? stateCode;
    const country = records[0]?.country ?? UNITED_STATES;

    entries.push({
      id: `state-${stateCode.toLowerCase()}`,
      label: stateName,
      type: "state",
      stateCode,
      state: stateName,
      city: null,
      aliases: buildStateAliases(stateCode, stateName, country),
      bounds: buildBoundsForRecords(records),
      courseCount: records.length,
      mappableCourseCount: records.filter((record) => record.hasVerifiedCoordinates).length,
    });
  }

  for (const [countyKey, records] of countyBuckets.entries()) {
    const [stateCode] = countyKey.split("|");
    const county = records[0]?.county ?? null;
    const stateName = records[0]?.state ?? getStateName(stateCode) ?? stateCode;
    const countyLabel = getCountyDisplayLabel(county, records[0]?.country ?? null) ?? county ?? stateName;

    entries.push({
      id: `county-${slugify(`${county}-${stateCode}`)}`,
      label: stateName ? `${countyLabel}, ${stateName}` : countyLabel,
      type: "county",
      stateCode,
      state: stateName,
      city: countyLabel,
      aliases: buildCountyAliases(county, stateCode, stateName),
      bounds: buildBoundsForRecords(records),
      courseCount: records.length,
      mappableCourseCount: records.filter((record) => record.hasVerifiedCoordinates).length,
    });
  }

  for (const [cityKey, records] of cityBuckets.entries()) {
    const [stateCode] = cityKey.split("|");
    const city = records[0]?.city ?? null;
    const stateName = records[0]?.state ?? getStateName(stateCode) ?? stateCode;

    entries.push({
      id: `city-${slugify(`${city}-${stateCode}`)}`,
      label: city ? `${city}, ${stateName}` : stateName,
      type: "city",
      stateCode,
      state: stateName,
      city,
      aliases: buildCityAliases(city, stateCode, stateName),
      bounds: buildBoundsForRecords(records),
      courseCount: records.length,
      mappableCourseCount: records.filter((record) => record.hasVerifiedCoordinates).length,
    });
  }

  return {
    entries: entries.sort((a, b) => a.label.localeCompare(b.label)),
  };
}

async function ensureDir(directoryPath) {
  await fs.mkdir(directoryPath, { recursive: true });
}

async function writeJson(filePath, value, spacing = 2) {
  const json = spacing == null ? JSON.stringify(value) : JSON.stringify(value, null, spacing);
  await fs.writeFile(filePath, `${json}\n`, "utf8");
}

async function loadNyOsmCatalog() {
  try {
    const raw = await fs.readFile(nyOsmCatalogPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function main() {
  const importedAt = new Date().toISOString();
  const csvText = await fs.readFile(sourceCsvPath, "utf8");
  const csvRows = parseCsv(csvText);
  const nyOsmCatalog = await loadNyOsmCatalog();
  const nyIndex = nyOsmCatalog ? createNyEnrichmentIndex(nyOsmCatalog) : null;

  const dedupedRecords = new Map();

  csvRows.forEach((row, rowIndex) => {
    const record = buildNormalizedRecord(row, rowIndex, importedAt, nyIndex);
    const dedupeKey = [
      normalizeName(record.name),
      normalizeString(record.city)?.toLowerCase() ?? "",
      record.stateCode,
      normalizeString(record.addressLabel)?.toLowerCase() ?? "",
    ].join("|");

    const existing = dedupedRecords.get(dedupeKey);
    if (existing) {
      mergeDuplicateRecords(existing, record);
      return;
    }

    dedupedRecords.set(dedupeKey, record);
  });

  const normalizedRecords = Array.from(dedupedRecords.values());
  ensureUniqueIds(normalizedRecords);

  const frontendRecords = normalizedRecords.map(buildFrontendCourseRecord);
  const indexRecords = normalizedRecords.map(buildCourseIndexRecord);
  const stateCodes = Array.from(new Set(normalizedRecords.map((record) => record.stateCode))).sort();
  const mappableRecordCount = normalizedRecords.filter((record) => record.hasVerifiedCoordinates).length;
  const manifest = {
    source: SOURCE,
    sourceFile: path.relative(repoRoot, sourceCsvPath),
    importedAt,
    recordCount: normalizedRecords.length,
    stateCodes,
    mappableRecordCount,
    coordinateCoverageRatio: normalizedRecords.length > 0 ? Number((mappableRecordCount / normalizedRecords.length).toFixed(4)) : 0,
    enrichmentNotes: [
      "CSV file is the stored source of truth for v1 course records.",
      "Runtime catalog loading is segmented by state so the client does not parse the full national detail dataset for map flows.",
      "Exact coordinates are only shown when the CSV row includes them or a trusted local NY OSM match is available.",
      "Website, status, and ratings remain nullable when the source snapshot does not supply them.",
    ],
  };
  const summary = buildSummary(indexRecords, manifest);
  const locationIndex = buildLocationIndex(indexRecords);
  const recordsByState = new Map();

  for (const record of frontendRecords) {
    const bucket = recordsByState.get(record.stateCode) ?? [];
    bucket.push(record);
    recordsByState.set(record.stateCode, bucket);
  }

  await ensureDir(normalizedDir);
  await ensureDir(generatedDir);
  await ensureDir(publicDataDir);
  await fs.rm(publicStatesDir, { recursive: true, force: true });
  await ensureDir(publicStatesDir);
  await writeJson(normalizedCatalogPath, normalizedRecords);
  await writeJson(publicCourseIndexJsonPath, indexRecords, null);
  await writeJson(publicCourseLocationIndexJsonPath, locationIndex, null);
  await writeJson(generatedManifestJsonPath, manifest);
  await writeJson(generatedSummaryJsonPath, summary);

  for (const [stateCode, stateRecords] of recordsByState.entries()) {
    await writeJson(path.join(publicStatesDir, `${stateCode}.generated.json`), stateRecords, null);
  }

  await fs.rm(publicCatalogJsonPath, { force: true });

  process.stdout.write(
    `${JSON.stringify(
      {
        sourceCsvPath: path.relative(repoRoot, sourceCsvPath),
        normalizedCatalogPath: path.relative(repoRoot, normalizedCatalogPath),
        publicCourseIndexJsonPath: path.relative(repoRoot, publicCourseIndexJsonPath),
        publicCourseLocationIndexJsonPath: path.relative(repoRoot, publicCourseLocationIndexJsonPath),
        publicStatesDir: path.relative(repoRoot, publicStatesDir),
        generatedManifestJsonPath: path.relative(repoRoot, generatedManifestJsonPath),
        generatedSummaryJsonPath: path.relative(repoRoot, generatedSummaryJsonPath),
        sourceRows: csvRows.length,
        canonicalRecords: normalizedRecords.length,
        mappableRecordCount,
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
