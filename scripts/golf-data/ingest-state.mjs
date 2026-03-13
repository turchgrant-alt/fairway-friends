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

function buildAddressLabel(tags, fallbackCity, stateName) {
  const streetLine = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ").trim();
  const locality = [fallbackCity, tags["addr:state"] || stateName, tags["addr:postcode"]].filter(Boolean).join(", ");
  const parts = [streetLine, locality].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

function mapAccessType(tags, name) {
  const text = `${name} ${tags.operator ?? ""}`.toLowerCase();
  const access = (tags.access ?? "").toLowerCase();

  if (access === "private") return "private";
  if (access === "customers") return "semi-private";
  if (access === "yes" || access === "permissive") return "public";

  if (text.includes("municipal") || text.includes("state park") || text.includes("park golf course")) {
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
    (candidate.accessType ? 1 : 0) +
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

  const merged = {
    id: `course-${config.stateCode.toLowerCase()}-${slugify(primary.name).slice(0, 40)}-${hash}`,
    source: config.source,
    sourceId: primary.sourceId,
    stateCode: config.stateCode,
    name: primary.name,
    city: sorted.find((candidate) => candidate.city)?.city ?? null,
    state: sorted.find((candidate) => candidate.state)?.state ?? config.stateName,
    country: sorted.find((candidate) => candidate.country)?.country ?? config.country,
    addressLabel: sorted.find((candidate) => candidate.addressLabel)?.addressLabel ?? null,
    latitude: primary.latitude,
    longitude: primary.longitude,
    accessType: sorted.find((candidate) => candidate.accessType)?.accessType ?? null,
    par: sorted.find((candidate) => candidate.par)?.par ?? null,
    holes: sorted.find((candidate) => candidate.holes)?.holes ?? null,
    website: sorted.find((candidate) => candidate.website)?.website ?? null,
    phone: sorted.find((candidate) => candidate.phone)?.phone ?? null,
    tags: mergedTags,
    description: sorted.find((candidate) => candidate.description)?.description ?? null,
    lastSyncedAt: syncTimestamp,
    rawSourceData: {
      primarySourceId: primary.sourceId,
      mergedSourceIds,
      members: sorted.map((candidate) => candidate.rawSourceData),
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

  const city =
    tags["addr:city"] ??
    tags["is_in:city"] ??
    tags["addr:town"] ??
    tags["addr:village"] ??
    tags["addr:hamlet"] ??
    null;
  const state = tags["addr:state"] ?? config.stateName;
  const country = tags["addr:country"] ?? config.country;
  const holes = parseIntegerLike(tags.holes ?? tags["golf:course"] ?? null);
  const par = parseIntegerLike(tags["golf:par"] ?? tags.par ?? null);
  const accessType = mapAccessType(tags, name);

  return {
    source: config.source,
    sourceId: `${config.source}:${element.type}:${element.id}`,
    stateCode: config.stateCode,
    name,
    normalizedName: normalizeName(name),
    city,
    state,
    country,
    addressLabel: buildAddressLabel(tags, city, config.stateName),
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    accessType,
    par,
    holes,
    website: tags.website ?? tags["contact:website"] ?? tags.url ?? null,
    phone: tags.phone ?? null,
    tags: buildTags(tags, accessType, name, holes),
    description: tags.description ?? null,
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
  const syncTimestamp = new Date().toISOString();

  await ensureDir(rawDir);
  await ensureDir(normalizedDir);
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

  await writeJson(normalizedFilePath, normalizedCourses);
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
