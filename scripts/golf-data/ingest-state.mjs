import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { MONTHLY_REFRESH_DAYS, getStateConfig } from "./state-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");

const rawDir = path.join(repoRoot, "data", "golf-course-pipeline", "raw");
const normalizedDir = path.join(repoRoot, "data", "golf-course-pipeline", "normalized");
const manifestPath = path.join(repoRoot, "data", "golf-course-pipeline", "state-manifest.json");
const generatedDir = path.join(repoRoot, "src", "data", "generated");
const generatedCatalogPath = path.join(generatedDir, "courseCatalog.generated.ts");
const reportDir = path.join(repoRoot, "data", "golf-course-pipeline", "reports");

const CITY_TAG_SOURCES = [
  "addr:city",
  "addr:town",
  "addr:village",
  "addr:hamlet",
  "addr:place",
  "addr:suburb",
  "addr:borough",
  "is_in:city",
];

const WEBSITE_TAG_SOURCES = [
  "website",
  "contact:website",
  "website:official",
  "url",
];

const PHONE_TAG_SOURCES = [
  "phone",
  "contact:phone",
  "telephone",
  "mobile",
];

const HOLE_TAG_SOURCES = [
  "holes",
  "golf:holes",
  "course:holes",
  "golf_course:holes",
  "golf:course",
];

const PAR_TAG_SOURCES = [
  "golf:par",
  "par",
  "course:par",
  "golf_course:par",
];

const STATUS_TAG_SOURCES = [
  "abandoned",
  "abandoned:leisure",
  "disused",
  "disused:leisure",
  "construction",
  "construction:leisure",
  "proposed",
  "proposed:leisure",
];

const AUDIT_SAMPLE_NAMES = [
  "Adams Country Club",
  "Penfield Country Club",
  "Tecumseh Golf Club",
  "Deerwood Golf Course",
  "Bay Meadows",
  "Battle Island State Park Golf Course",
  "Eagle Bay Golf Course",
  "Sanctuary Golf Course",
  "Willowcreek Golf Club - 18 Hole",
];

function parseArgs(argv) {
  const args = argv.slice(2);
  const stateCode = args.find((arg) => !arg.startsWith("--")) ?? "NY";

  return {
    stateCode: stateCode.toUpperCase(),
    skipFetch: args.includes("--skip-fetch"),
  };
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(golf course|golf club|country club|golf and country club)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function haversineDistanceMiles(a, b) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const deltaLat = toRadians(b.latitude - a.latitude);
  const deltaLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const value =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;

  return 2 * earthRadiusMiles * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function parseIntegerLike(value) {
  if (value == null) return null;
  const match = String(value).match(/\d+/);
  return match ? Number(match[0]) : null;
}

function normalizeString(value) {
  if (value == null) return null;
  const normalized = String(value).trim().replace(/\s+/g, " ");
  return normalized.length > 0 ? normalized : null;
}

function pickFirstString(tags, sources) {
  for (const source of sources) {
    const value = normalizeString(tags[source]);
    if (value) {
      return { value, source };
    }
  }

  return { value: null, source: null };
}

function buildFieldAudit({ value, source, sourceType, checked, notes = [] }) {
  return {
    value: value ?? null,
    source: source ?? null,
    sourceType,
    checked,
    notes,
  };
}

function buildAddressParts(tags, cityValue, stateValue, stateCode, countryValue) {
  const streetAddress = [normalizeString(tags["addr:housenumber"]), normalizeString(tags["addr:street"])]
    .filter(Boolean)
    .join(" ")
    .trim() || null;
  const postcode = normalizeString(tags["addr:postcode"]);
  const sourceState = normalizeString(tags["addr:state"]);
  const stateForAddress = sourceState ?? (streetAddress || cityValue || postcode ? stateCode : null);
  const countryForAddress = normalizeString(tags["addr:country"]) ?? (streetAddress || cityValue || postcode ? countryValue : null);

  const localityLine = [cityValue, stateForAddress].filter(Boolean).join(", ").trim();
  const localityWithPostcode = [localityLine, postcode].filter(Boolean).join(" ").trim();
  const parts = [streetAddress, localityWithPostcode, cityValue || postcode ? null : countryForAddress].filter(Boolean);

  return {
    streetAddress,
    postcode,
    addressLabel: parts.length > 0 ? parts.join(", ") : null,
    sourceState,
    countryForAddress,
  };
}

function extractHoleCountFromText(tags) {
  const textSources = ["name", "description", "note", "comment"];

  for (const source of textSources) {
    const value = normalizeString(tags[source]);
    if (!value) continue;

    const match = value.toLowerCase().match(/\b(3|6|9|12|18|27|36)[- ]?hole\b/);
    if (match) {
      return { value: Number(match[1]), source: source, sourceType: "derived_text" };
    }
  }

  return { value: null, source: null, sourceType: "missing_from_source" };
}

function extractIntegerField(tags, sources) {
  for (const source of sources) {
    const value = parseIntegerLike(tags[source]);
    if (value != null) {
      return {
        value,
        source,
        sourceType: source === sources[0] ? "direct_tag" : "alternate_tag",
      };
    }
  }

  return { value: null, source: null, sourceType: "missing_from_source" };
}

function extractStatus(tags) {
  if (tags["abandoned:leisure"] === "golf_course" || tags.abandoned === "yes") {
    return { value: "abandoned", source: tags["abandoned:leisure"] ? "abandoned:leisure" : "abandoned", sourceType: "direct_tag", notes: [] };
  }

  if (tags["disused:leisure"] === "golf_course" || tags.disused === "yes") {
    return { value: "disused", source: tags["disused:leisure"] ? "disused:leisure" : "disused", sourceType: "direct_tag", notes: [] };
  }

  if (tags["construction:leisure"] === "golf_course" || tags.construction === "yes") {
    return { value: "construction", source: tags["construction:leisure"] ? "construction:leisure" : "construction", sourceType: "direct_tag", notes: [] };
  }

  if (tags["proposed:leisure"] === "golf_course" || tags.proposed === "yes") {
    return { value: "proposed", source: tags["proposed:leisure"] ? "proposed:leisure" : "proposed", sourceType: "direct_tag", notes: [] };
  }

  const noteText = [tags.note, tags.description, tags.comment, tags.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/\babandoned\b/.test(noteText)) {
    return { value: "abandoned", source: "note/description/name", sourceType: "derived_text", notes: ["Explicit abandoned wording found in free text."] };
  }

  if (/\bclosed\b/.test(noteText)) {
    return { value: "closed", source: "note/description/name", sourceType: "derived_text", notes: ["Explicit closed wording found in free text."] };
  }

  return { value: null, source: null, sourceType: "missing_from_source", notes: [] };
}

function mapAccessType(tags, name) {
  const text = `${name} ${tags.operator ?? ""}`.toLowerCase();
  const access = (tags.access ?? "").toLowerCase();
  const operatorType = (tags["operator:type"] ?? "").toLowerCase();
  const operatorText = (tags.operator ?? "").toLowerCase();

  if (access === "private") return "private";
  if (access === "customers") return "semi-private";
  if (access === "yes" || access === "permissive") return "public";

  if (operatorType === "government" || operatorType === "public") {
    return "municipal";
  }

  if (
    text.includes("municipal") ||
    text.includes("state park") ||
    text.includes("park golf course") ||
    operatorText.includes("parks") ||
    operatorText.includes("county park") ||
    operatorText.includes("city of ")
  ) {
    return "municipal";
  }

  if (text.includes("resort")) {
    return "resort";
  }

  if (text.includes("country club")) {
    return "private";
  }

  return null;
}

function buildTags(tags, accessType, name, holes) {
  const derivedTags = new Set();
  const lowerName = name.toLowerCase();

  if (accessType) derivedTags.add(accessType);
  if (holes) derivedTags.add(`${holes}-hole`);
  if (lowerName.includes("country club")) derivedTags.add("country-club");
  if (lowerName.includes("state park")) derivedTags.add("state-park");
  if (lowerName.includes("par 3") || lowerName.includes("par-3")) derivedTags.add("par-3");
  if (lowerName.includes("executive")) derivedTags.add("executive");
  if (lowerName.includes("links")) derivedTags.add("links");

  return Array.from(derivedTags);
}

function isDrivingRangeOnly(tags, name) {
  const searchableText = [
    name,
    tags.description,
    tags.note,
    tags.comment,
    tags.website,
    tags["contact:website"],
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (tags.golf === "driving_range" || tags.sport === "miniature_golf") return true;
  if (/driving range|pro shop|mini golf|miniature golf/.test(searchableText)) return true;
  if (/golf center/.test(searchableText) && !/golf course|country club|golf club/.test(searchableText)) return true;

  return false;
}

function getElementCoordinates(element) {
  if (typeof element.lat === "number" && typeof element.lon === "number") {
    return { latitude: element.lat, longitude: element.lon };
  }

  if (element.center && typeof element.center.lat === "number" && typeof element.center.lon === "number") {
    return { latitude: element.center.lat, longitude: element.center.lon };
  }

  return null;
}

function candidateScore(candidate) {
  const tags = candidate.rawSourceData.tags ?? {};
  const geometryWeight = candidate.rawSourceData.type === "relation" ? 3 : candidate.rawSourceData.type === "way" ? 2 : 1;

  return (
    geometryWeight +
    Object.keys(tags).length +
    (candidate.website ? 4 : 0) +
    (candidate.phone ? 3 : 0) +
    (candidate.addressLabel ? 3 : 0) +
    (candidate.city ? 2 : 0) +
    (candidate.postcode ? 1 : 0) +
    (candidate.accessType ? 1 : 0) +
    (candidate.status ? 1 : 0) +
    (candidate.par ? 1 : 0) +
    (candidate.holes ? 1 : 0)
  );
}

function mergeCandidates(cluster, syncTimestamp, config) {
  const sorted = [...cluster].sort((a, b) => candidateScore(b) - candidateScore(a));
  const primary = sorted[0];
  const mergedSourceIds = sorted.map((candidate) => candidate.sourceId).sort();
  const hash = crypto.createHash("sha1").update(mergedSourceIds.join("|")).digest("hex").slice(0, 12);
  const mergedTags = Array.from(new Set(sorted.flatMap((candidate) => candidate.tags))).sort();
  const mergedFieldAudit = {};

  const pickValue = (field, fallbackValue = null, fallbackAudit = null) => {
    const matchingCandidate = sorted.find((candidate) => candidate[field] != null && candidate[field] !== "");

    if (matchingCandidate) {
      mergedFieldAudit[field] = matchingCandidate.fieldAudit[field];
      return matchingCandidate[field];
    }

    if (fallbackAudit) {
      mergedFieldAudit[field] = fallbackAudit;
    } else {
      mergedFieldAudit[field] = sorted[0].fieldAudit[field];
    }

    return fallbackValue;
  };

  const merged = {
    id: `course-${config.stateCode.toLowerCase()}-${slugify(primary.name).slice(0, 40)}-${hash}`,
    source: config.source,
    sourceId: primary.sourceId,
    stateCode: config.stateCode,
    name: primary.name,
    streetAddress: pickValue("streetAddress"),
    city: pickValue("city"),
    state: pickValue(
      "state",
      config.stateName,
      buildFieldAudit({
        value: config.stateName,
        source: "state scope",
        sourceType: "scope_fallback",
        checked: ["addr:state"],
        notes: ["State populated from the configured state scope when the source omitted addr:state."],
      }),
    ),
    postcode: pickValue("postcode"),
    country: pickValue(
      "country",
      config.country,
      buildFieldAudit({
        value: config.country,
        source: "state scope",
        sourceType: "scope_fallback",
        checked: ["addr:country"],
        notes: ["Country populated from the configured state scope when the source omitted addr:country."],
      }),
    ),
    addressLabel: pickValue("addressLabel"),
    latitude: primary.latitude,
    longitude: primary.longitude,
    accessType: pickValue("accessType"),
    status: pickValue("status"),
    par: pickValue("par"),
    holes: pickValue("holes"),
    website: pickValue("website"),
    phone: pickValue("phone"),
    operator: pickValue("operator"),
    openingHours: pickValue("openingHours"),
    tags: mergedTags,
    description: pickValue("description"),
    lastSyncedAt: syncTimestamp,
    rawSourceData: {
      primarySourceId: primary.sourceId,
      mergedSourceIds,
      fieldAudit: mergedFieldAudit,
      members: sorted.map((candidate) => ({
        sourceId: candidate.sourceId,
        fieldAudit: candidate.fieldAudit,
        element: candidate.rawSourceData,
      })),
    },
  };

  return merged;
}

function buildFrontendCourseRecord(record) {
  const cityState = [record.city, record.stateCode].filter(Boolean).join(", ");
  const displayLocation = cityState || record.addressLabel || record.state || record.stateCode;
  const accessLabel = record.accessType ?? "course";

  return {
    ...record,
    location: displayLocation,
    type: accessLabel,
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
    rawSourceData: null,
  };
}

function buildCandidate(element, config) {
  const tags = element.tags ?? {};
  const name = tags.name?.trim();
  const coordinates = getElementCoordinates(element);

  if (!name || !coordinates) {
    return null;
  }

  if (isDrivingRangeOnly(tags, name)) {
    return null;
  }

  const cityResult = pickFirstString(tags, CITY_TAG_SOURCES);
  const websiteResult = pickFirstString(tags, WEBSITE_TAG_SOURCES);
  const phoneResult = pickFirstString(tags, PHONE_TAG_SOURCES);
  const statusResult = extractStatus(tags);
  const holesResult = extractIntegerField(tags, HOLE_TAG_SOURCES);
  const derivedHolesResult = holesResult.value == null ? extractHoleCountFromText(tags) : null;
  const parResult = extractIntegerField(tags, PAR_TAG_SOURCES);
  const operator = normalizeString(tags.operator);
  const openingHours = normalizeString(tags.opening_hours);
  const stateSource = normalizeString(tags["addr:state"]);
  const countrySource = normalizeString(tags["addr:country"]);
  const state = stateSource ?? config.stateName;
  const country = countrySource ?? config.country;
  const addressParts = buildAddressParts(tags, cityResult.value, state, config.stateCode, country);
  const holes = holesResult.value ?? derivedHolesResult?.value ?? null;
  const par = parResult.value ?? null;
  const accessType = mapAccessType(tags, name);
  const fieldAudit = {
    streetAddress: buildFieldAudit({
      value: addressParts.streetAddress,
      source: addressParts.streetAddress ? "addr:housenumber + addr:street" : null,
      sourceType: addressParts.streetAddress ? "composed" : "missing_from_source",
      checked: ["addr:housenumber", "addr:street"],
      notes: addressParts.streetAddress ? [] : ["No source street address tags were present."],
    }),
    city: buildFieldAudit({
      value: cityResult.value,
      source: cityResult.source,
      sourceType: cityResult.value
        ? cityResult.source === CITY_TAG_SOURCES[0]
          ? "direct_tag"
          : "alternate_tag"
        : "missing_from_source",
      checked: CITY_TAG_SOURCES,
      notes: cityResult.value ? [] : ["No city/locality tag was present in the source record."],
    }),
    state: buildFieldAudit({
      value: state,
      source: stateSource ? "addr:state" : "state scope",
      sourceType: stateSource ? "direct_tag" : "scope_fallback",
      checked: ["addr:state"],
      notes: stateSource ? [] : ["State was populated from the configured ingestion scope."],
    }),
    postcode: buildFieldAudit({
      value: addressParts.postcode,
      source: addressParts.postcode ? "addr:postcode" : null,
      sourceType: addressParts.postcode ? "direct_tag" : "missing_from_source",
      checked: ["addr:postcode"],
      notes: addressParts.postcode ? [] : ["No postcode tag was present in the source record."],
    }),
    country: buildFieldAudit({
      value: country,
      source: countrySource ? "addr:country" : "state scope",
      sourceType: countrySource ? "direct_tag" : "scope_fallback",
      checked: ["addr:country"],
      notes: countrySource ? [] : ["Country was populated from the configured ingestion scope."],
    }),
    addressLabel: buildFieldAudit({
      value: addressParts.addressLabel,
      source: addressParts.addressLabel ? "address components" : null,
      sourceType: addressParts.addressLabel ? "composed" : "missing_from_source",
      checked: ["addr:housenumber", "addr:street", ...CITY_TAG_SOURCES, "addr:state", "addr:postcode", "addr:country"],
      notes: addressParts.addressLabel
        ? [addressParts.streetAddress ? "Address label was composed from the source address parts." : "Address label is partial because only locality/postcode components were available."]
        : ["No usable address components were present; addressLabel remains null."],
    }),
    website: buildFieldAudit({
      value: websiteResult.value,
      source: websiteResult.source,
      sourceType: websiteResult.value
        ? websiteResult.source === WEBSITE_TAG_SOURCES[0]
          ? "direct_tag"
          : "alternate_tag"
        : "missing_from_source",
      checked: WEBSITE_TAG_SOURCES,
      notes: websiteResult.value ? [] : ["No website-like tag was present in the source record."],
    }),
    phone: buildFieldAudit({
      value: phoneResult.value,
      source: phoneResult.source,
      sourceType: phoneResult.value
        ? phoneResult.source === PHONE_TAG_SOURCES[0]
          ? "direct_tag"
          : "alternate_tag"
        : "missing_from_source",
      checked: PHONE_TAG_SOURCES,
      notes: phoneResult.value ? [] : ["No phone-like tag was present in the source record."],
    }),
    accessType: buildFieldAudit({
      value: accessType,
      source: accessType ? "access/operator/name mapping" : null,
      sourceType: accessType ? "composed" : "missing_from_source",
      checked: ["access", "operator:type", "operator", "name"],
      notes: accessType ? [] : ["The source did not include enough access/operator metadata to classify access type confidently."],
    }),
    status: buildFieldAudit({
      value: statusResult.value,
      source: statusResult.source,
      sourceType: statusResult.sourceType,
      checked: STATUS_TAG_SOURCES,
      notes: statusResult.notes.length > 0 ? statusResult.notes : statusResult.value ? [] : ["No lifecycle/status tag was present in the source record."],
    }),
    holes: buildFieldAudit({
      value: holes,
      source: holesResult.value != null ? holesResult.source : derivedHolesResult?.source ?? null,
      sourceType: holesResult.value != null ? holesResult.sourceType : derivedHolesResult?.sourceType ?? "missing_from_source",
      checked: [...HOLE_TAG_SOURCES, "name", "description", "note", "comment"],
      notes:
        holesResult.value != null
          ? []
          : derivedHolesResult?.value != null
            ? ["Hole count was parsed from explicit free text such as '9-hole' or '18 hole'."]
            : ["No direct hole-count tag was present, and no explicit hole count was found in name/description text."],
    }),
    par: buildFieldAudit({
      value: par,
      source: parResult.source,
      sourceType: parResult.sourceType,
      checked: PAR_TAG_SOURCES,
      notes: par != null ? [] : ["No par tag was present in the source record."],
    }),
    operator: buildFieldAudit({
      value: operator,
      source: operator ? "operator" : null,
      sourceType: operator ? "direct_tag" : "missing_from_source",
      checked: ["operator"],
      notes: operator ? [] : ["No operator tag was present in the source record."],
    }),
    openingHours: buildFieldAudit({
      value: openingHours,
      source: openingHours ? "opening_hours" : null,
      sourceType: openingHours ? "direct_tag" : "missing_from_source",
      checked: ["opening_hours"],
      notes: openingHours ? [] : ["No opening_hours tag was present in the source record."],
    }),
    description: buildFieldAudit({
      value: normalizeString(tags.description),
      source: tags.description ? "description" : null,
      sourceType: tags.description ? "direct_tag" : "missing_from_source",
      checked: ["description"],
      notes: tags.description ? [] : ["No description tag was present in the source record."],
    }),
  };

  return {
    source: config.source,
    sourceId: `${config.source}:${element.type}:${element.id}`,
    stateCode: config.stateCode,
    name,
    normalizedName: normalizeName(name),
    streetAddress: addressParts.streetAddress,
    city: cityResult.value,
    state,
    postcode: addressParts.postcode,
    country,
    addressLabel: addressParts.addressLabel,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    accessType,
    status: statusResult.value,
    par,
    holes,
    website: websiteResult.value,
    phone: phoneResult.value,
    operator,
    openingHours,
    tags: buildTags(tags, accessType, name, holes),
    description: normalizeString(tags.description),
    fieldAudit,
    rawSourceData: element,
  };
}

function dedupeCandidates(candidates, syncTimestamp, config) {
  const byName = new Map();

  for (const candidate of candidates) {
    const key = candidate.normalizedName || slugify(candidate.name);
    const bucket = byName.get(key) ?? [];
    bucket.push(candidate);
    byName.set(key, bucket);
  }

  const mergedRecords = [];

  for (const bucket of byName.values()) {
    const clusters = [];

    for (const candidate of bucket) {
      const matchingCluster = clusters.find((cluster) =>
        cluster.some((existing) => haversineDistanceMiles(existing, candidate) <= 0.35),
      );

      if (matchingCluster) {
        matchingCluster.push(candidate);
      } else {
        clusters.push([candidate]);
      }
    }

    for (const cluster of clusters) {
      mergedRecords.push(mergeCandidates(cluster, syncTimestamp, config));
    }
  }

  return mergedRecords.sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchRawOverpass(query) {
  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: new URLSearchParams({ data: query }),
  });

  if (!response.ok) {
    throw new Error(`Overpass request failed with ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function writeJson(filePath, payload) {
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function writeGeneratedCatalog(frontendCourses, manifest) {
  const fileContents = `/* eslint-disable */
import type { AppGolfCourseRecord, CourseStateManifest } from "@/lib/course-data-model";

export const generatedCourses: AppGolfCourseRecord[] = ${JSON.stringify(frontendCourses, null, 2)};

export const generatedCourseManifest: CourseStateManifest = ${JSON.stringify(manifest, null, 2)};
`;

  await fs.writeFile(generatedCatalogPath, fileContents, "utf8");
}

function buildAuditReport(normalizedCourses, config, syncTimestamp) {
  const auditedFields = [
    "streetAddress",
    "city",
    "state",
    "postcode",
    "country",
    "addressLabel",
    "website",
    "phone",
    "accessType",
    "status",
    "holes",
    "par",
    "operator",
    "openingHours",
  ];

  const fieldCoverage = Object.fromEntries(
    auditedFields.map((field) => {
      const summary = {
        present: 0,
        missing: 0,
        bySourceType: {},
      };

      for (const record of normalizedCourses) {
        const audit = record.rawSourceData?.fieldAudit?.[field];
        const value = record[field];
        const sourceType = audit?.sourceType ?? "missing_from_source";

        if (value != null && value !== "") {
          summary.present += 1;
        } else {
          summary.missing += 1;
        }

        summary.bySourceType[sourceType] = (summary.bySourceType[sourceType] ?? 0) + 1;
      }

      return [field, summary];
    }),
  );

  const sampleEvidence = AUDIT_SAMPLE_NAMES
    .map((name) => normalizedCourses.find((record) => record.name === name))
    .filter(Boolean)
    .map((record) => ({
      name: record.name,
      sourceId: record.sourceId,
      normalized: {
        streetAddress: record.streetAddress,
        city: record.city,
        state: record.state,
        postcode: record.postcode,
        addressLabel: record.addressLabel,
        accessType: record.accessType,
        status: record.status,
        holes: record.holes,
        par: record.par,
        website: record.website,
        phone: record.phone,
        operator: record.operator,
        openingHours: record.openingHours,
      },
      fieldAudit: record.rawSourceData?.fieldAudit ?? {},
      sourceMembers: (record.rawSourceData?.members ?? []).map((member) => ({
        sourceId: member.sourceId,
        tags: member.element?.tags ?? {},
      })),
    }));

  return {
    stateCode: config.stateCode,
    source: config.source,
    generatedAt: syncTimestamp,
    auditedFields,
    fieldCoverage,
    sampleEvidence,
  };
}

async function updateManifest(stateCode, normalizedCount, syncTimestamp) {
  let manifest = {
    refreshCadence: "monthly",
    refreshWindowDays: MONTHLY_REFRESH_DAYS,
    completedStates: [],
    states: {},
  };

  try {
    manifest = await readJson(manifestPath);
  } catch {
    // keep defaults
  }

  if (!manifest.completedStates.includes(stateCode)) {
    manifest.completedStates.push(stateCode);
    manifest.completedStates.sort();
  }

  manifest.states[stateCode] = {
    completed: true,
    completedAt: manifest.states[stateCode]?.completedAt ?? syncTimestamp,
    lastSyncedAt: syncTimestamp,
    nextRefreshDueAt: new Date(Date.parse(syncTimestamp) + MONTHLY_REFRESH_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    recordCount: normalizedCount,
    source: "osm_overpass",
  };

  await writeJson(manifestPath, manifest);
  return manifest;
}

async function main() {
  const { stateCode, skipFetch } = parseArgs(process.argv);
  const config = getStateConfig(stateCode);
  const rawFilePath = path.join(rawDir, `${stateCode}.osm-overpass.json`);
  const normalizedFilePath = path.join(normalizedDir, `${stateCode}.normalized.json`);
  const reportPath = path.join(reportDir, `${stateCode}.field-audit.json`);
  const syncTimestamp = new Date().toISOString();

  await ensureDir(rawDir);
  await ensureDir(normalizedDir);
  await ensureDir(reportDir);
  await ensureDir(path.dirname(manifestPath));
  await ensureDir(generatedDir);

  const rawPayload = skipFetch ? await readJson(rawFilePath) : await fetchRawOverpass(config.query);
  await writeJson(rawFilePath, rawPayload);

  const candidates = rawPayload.elements
    .map((element) => buildCandidate(element, config))
    .filter(Boolean);
  const normalizedCourses = dedupeCandidates(candidates, syncTimestamp, config);
  const frontendCourses = normalizedCourses.map(buildFrontendCourseRecord);
  const manifest = await updateManifest(stateCode, normalizedCourses.length, syncTimestamp);
  const auditReport = buildAuditReport(normalizedCourses, config, syncTimestamp);

  await writeJson(normalizedFilePath, normalizedCourses);
  await writeJson(reportPath, auditReport);
  await writeGeneratedCatalog(frontendCourses, manifest);

  console.log(
    JSON.stringify(
      {
        stateCode,
        sourceRecords: rawPayload.elements.length,
        candidateRecords: candidates.length,
        canonicalRecords: normalizedCourses.length,
        rawFilePath: path.relative(repoRoot, rawFilePath),
        normalizedFilePath: path.relative(repoRoot, normalizedFilePath),
        reportPath: path.relative(repoRoot, reportPath),
        generatedCatalogPath: path.relative(repoRoot, generatedCatalogPath),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
