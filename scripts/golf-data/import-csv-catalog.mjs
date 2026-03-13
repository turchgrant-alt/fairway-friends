import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

const sourceCsvPath = path.join(repoRoot, "data", "course-catalog", "source", "us_golf_courses_dataset.csv");
const normalizedDir = path.join(repoRoot, "data", "course-catalog", "normalized");
const normalizedCatalogPath = path.join(normalizedDir, "us-golf-courses.normalized.json");
const generatedDir = path.join(repoRoot, "src", "data", "generated");
const generatedCatalogJsonPath = path.join(generatedDir, "courseCatalog.generated.json");
const generatedManifestJsonPath = path.join(generatedDir, "courseCatalog.manifest.generated.json");
const nyOsmCatalogPath = path.join(repoRoot, "data", "golf-course-pipeline", "normalized", "NY.normalized.json");

const SOURCE = "csv_catalog";
const UNITED_STATES = "United States";
const UNKNOWN_ACCESS = "unknown";
const UNKNOWN_STATUS = "unknown";

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

function normalizeString(value) {
  if (value == null) return null;

  const normalized = String(value).trim().replace(/\s+/g, " ");
  return normalized.length > 0 ? normalized : null;
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

function getStateName(stateCode) {
  if (!stateCode) return null;
  return US_STATE_NAMES[stateCode] ?? stateCode;
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

function tokenSet(value) {
  return new Set(normalizeName(value).split(" ").filter(Boolean));
}

function buildDisplayName(facilityName, courseName) {
  if (facilityName && courseName) {
    const facilityNormalized = normalizeName(facilityName);
    const courseNormalized = normalizeName(courseName);

    if (!courseNormalized || facilityNormalized === courseNormalized) {
      return facilityName;
    }

    if (facilityNormalized.includes(courseNormalized)) {
      return facilityName;
    }

    if (courseNormalized.includes(facilityNormalized)) {
      return courseName;
    }

    return `${facilityName} (${courseName})`;
  }

  return facilityName ?? courseName ?? "Unnamed golf course";
}

function extractStreetAddress(fullAddress, city, stateCode, postcode) {
  const normalizedAddress = normalizeString(fullAddress);
  if (!normalizedAddress) return null;

  const normalizedCity = normalizeString(city);
  const normalizedStateCode = normalizeStateCode(stateCode);
  const normalizedPostcode = normalizeString(postcode);

  if (normalizedCity && normalizedStateCode) {
    const suffixPattern = normalizedPostcode
      ? new RegExp(
          `,\\s*${escapeRegex(normalizedCity)},\\s*${escapeRegex(normalizedStateCode)}\\s*${escapeRegex(normalizedPostcode)}$`,
          "i",
        )
      : new RegExp(`,\\s*${escapeRegex(normalizedCity)},\\s*${escapeRegex(normalizedStateCode)}(?:\\s+[A-Z0-9-]+)?$`, "i");

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

function buildAddressLabel({ fullAddress, streetAddress, city, stateCode, postcode }) {
  const normalizedFullAddress = normalizeString(fullAddress);
  if (normalizedFullAddress) {
    return normalizedFullAddress;
  }

  const locality = [normalizeString(city), normalizeStateCode(stateCode)].filter(Boolean).join(", ");

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

function buildLocationLabel({ city, stateCode, stateName, county }) {
  if (city && stateCode) return `${city}, ${stateCode}`;
  if (city && stateName) return `${city}, ${stateName}`;
  if (county && stateCode) return `${county} County, ${stateCode}`;
  if (stateName) return stateName;
  if (stateCode) return stateCode;
  return "Unknown location";
}

function buildTags({ accessType, holes, status }) {
  const tags = [];

  if (accessType && accessType !== UNKNOWN_ACCESS) tags.push(accessType);
  if (holes != null) tags.push(`${holes}-hole`);
  if (status && ![UNKNOWN_STATUS, "open", "operating"].includes(status)) tags.push(status);

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

  return records
    .filter((record) => record.some((value) => value !== ""))
    .map((record) => Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ""])));
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

  const stateCode = normalizeStateCode(row.state);
  if (stateCode !== "NY") return null;

  const facilityName = normalizeString(row.facility_name);
  const courseName = normalizeString(row.course_name);
  const displayName = buildDisplayName(facilityName, courseName);
  const nameVariants = buildNameVariants(facilityName, courseName, displayName);
  const cityKey = normalizeString(row.city)?.toLowerCase() ?? "";
  const streetAddress = extractStreetAddress(row.full_address, row.city, row.state, row.zip_code);
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
    const baseSlug = slugify([record.stateCode, record.city, record.name].filter(Boolean).join("-")) || record.sourceId;
    const nextCount = (counts.get(baseSlug) ?? 0) + 1;
    counts.set(baseSlug, nextCount);
    record.id = nextCount === 1 ? baseSlug : `${baseSlug}-${nextCount}`;
  }
}

function buildNormalizedRecord(row, rowIndex, importedAt, nyIndex) {
  const stateCode = normalizeStateCode(row.state) ?? "US";
  const stateName = getStateName(stateCode);
  const facilityName = normalizeString(row.facility_name);
  const courseName = normalizeString(row.course_name);
  const name = buildDisplayName(facilityName, courseName);
  const fullAddress = normalizeString(row.full_address);
  const city = normalizeString(row.city);
  const postcode = normalizeString(row.zip_code);
  const streetAddress = extractStreetAddress(fullAddress, city, stateCode, postcode);
  const county = normalizeString(row.county);
  const accessTypeRaw = normalizeString(row.access_type);
  const statusRaw = normalizeString(row.status);
  const accessType = normalizeAccessType(accessTypeRaw);
  const status = normalizeStatus(statusRaw);
  const csvLatitude = parseFloatValue(row.latitude);
  const csvLongitude = parseFloatValue(row.longitude);
  const csvHasCoordinates = csvLatitude != null && csvLongitude != null;
  const nyEnrichment = csvHasCoordinates ? null : findNyEnrichment(row, nyIndex);
  const latitude = csvHasCoordinates ? csvLatitude : nyEnrichment?.latitude ?? null;
  const longitude = csvHasCoordinates ? csvLongitude : nyEnrichment?.longitude ?? null;
  const hasVerifiedCoordinates = latitude != null && longitude != null;
  const coordinateSource = csvHasCoordinates ? SOURCE : nyEnrichment?.source ?? null;
  const website = normalizeWebsite(row.website) ?? normalizeWebsite(nyEnrichment?.website) ?? null;
  const phone = normalizePhone(row.phone_number) ?? normalizePhone(nyEnrichment?.phone) ?? null;
  const holes = parseInteger(row.number_of_holes);
  const par = parseInteger(row.par);
  const sourceRowNumber = rowIndex + 2;

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
    country: UNITED_STATES,
    addressLabel: buildAddressLabel({ fullAddress, streetAddress, city, stateCode, postcode }),
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
    sourceName: normalizeString(row.source_name),
    sourceUrl: normalizeString(row.source_url),
    secondarySourceName: normalizeString(row.secondary_source_name),
    secondarySourceUrl: normalizeString(row.secondary_source_url),
    confidenceLevel: normalizeString(row.confidence_level),
    lastVerifiedDate: normalizeString(row.last_verified_date),
    teeName: normalizeString(row.tee_name),
    gender: normalizeString(row.gender),
    courseRating: parseFloatValue(row.course_rating),
    slopeRating: parseFloatValue(row.slope_rating),
    tags: buildTags({ accessType, holes, status }),
    description: normalizeString(row.notes),
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

async function ensureDir(directoryPath) {
  await fs.mkdir(directoryPath, { recursive: true });
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
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
      "Exact coordinates are only shown when the CSV row includes them or a trusted local NY OSM match is available.",
      "Website, status, and ratings remain nullable when the source snapshot does not supply them.",
    ],
  };

  await ensureDir(normalizedDir);
  await ensureDir(generatedDir);
  await writeJson(normalizedCatalogPath, normalizedRecords);
  await writeJson(generatedCatalogJsonPath, frontendRecords);
  await writeJson(generatedManifestJsonPath, manifest);

  process.stdout.write(
    `${JSON.stringify(
      {
        sourceCsvPath: path.relative(repoRoot, sourceCsvPath),
        normalizedCatalogPath: path.relative(repoRoot, normalizedCatalogPath),
        generatedCatalogJsonPath: path.relative(repoRoot, generatedCatalogJsonPath),
        generatedManifestJsonPath: path.relative(repoRoot, generatedManifestJsonPath),
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
