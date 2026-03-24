import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type CatalogCourseRecord = {
  id: string;
  name: string;
  facilityName: string | null;
  courseName: string | null;
  city: string | null;
  state: string | null;
  stateCode: string;
  country: string | null;
  hasPgaOrLpgaTourHistory: boolean | null;
  worldTop100Rank: number | null;
};

type WikidataCandidate = {
  entityId: string;
  label: string;
  description: string | null;
  aliases: string[];
  places: string[];
  imageTitle: string | null;
  articleTitle: string | null;
  isGolfCourse: boolean;
};

type CommonsImageMetadata = {
  coverPhotoUrl: string | null;
  thumbnailUrl: string | null;
  photoLicense: string | null;
  photoCredit: string | null;
};

type CoursePhotoRecord = {
  courseId: string;
  coverPhotoUrl: string;
  thumbnailUrl: string;
  photoSource: "wikimedia-commons";
  photoLicense: string;
  photoCredit: string;
  photoConfidence: "high" | "medium";
  wikidataEntityId: string;
  lastEnriched: string;
};

type MatchCandidate = {
  candidate: WikidataCandidate;
  confidence: "high" | "medium";
  score: number;
};

type SearchEntitySummary = {
  entityId: string;
  label: string;
  description: string | null;
  aliases: string[];
};

type EntitySearchResponse = {
  search?: Array<{
    id?: string;
    label?: string;
    description?: string;
    aliases?: string[];
  }>;
};

type WikidataEntityPayload = {
  labels?: Record<string, { value?: string }>;
  descriptions?: Record<string, { value?: string }>;
  aliases?: Record<string, Array<{ value?: string }>>;
  sitelinks?: Record<string, { title?: string }>;
  claims?: Record<
    string,
    Array<{
      mainsnak?: {
        datavalue?: {
          value?:
            | string
            | {
                id?: string;
                ["entity-type"]?: string;
              };
        };
      };
    }>
  >;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const catalogPath = path.join(
  repoRoot,
  "data",
  "course-catalog",
  "normalized",
  "us-golf-courses.normalized.json",
);
const outputPath = process.env.PHOTO_ENRICH_OUTPUT_PATH
  ? path.resolve(repoRoot, process.env.PHOTO_ENRICH_OUTPUT_PATH)
  : path.join(repoRoot, "src", "data", "coursePhotos.json");

const API_DELAY_MS = 1000;
const COMMONS_BATCH_SIZE = 25;
const PROGRESS_WRITE_INTERVAL = 25;
const SEARCH_RESULT_LIMIT = 6;
const INTERNATIONAL_STATE_CODES = new Set(["SCT", "ENG", "IRL", "NIR"]);
const GOLF_COURSE_INSTANCE_IDS = new Set([
  "Q1048525",
]);
const NEGATIVE_COMMONS_TERMS = [
  "logo",
  "flag",
  "map",
  "locator",
  "scorecard",
  "score card",
  "crest",
  "seal",
  "diagram",
  "svg",
  "scoreboard",
];
const HTML_ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&quot;": "\"",
  "&#39;": "'",
  "&apos;": "'",
  "&lt;": "<",
  "&gt;": ">",
  "&nbsp;": " ",
};
const COURSE_LIMIT = (() => {
  const rawValue = process.env.PHOTO_ENRICH_LIMIT;
  if (!rawValue) return null;

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
})();

let lastApiCallAt = 0;

function normalizeWhitespace(value: string | null | undefined) {
  if (!value) return "";
  return value.trim().replace(/\s+/g, " ");
}

function normalizeText(value: string | null | undefined) {
  return normalizeWhitespace(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function stripCommonGolfSuffixes(value: string | null | undefined) {
  let nextValue = normalizeWhitespace(value);
  if (!nextValue) return "";

  const patterns = [
    /\b(?:golf\s*&\s*country\s*club)$/i,
    /\b(?:golf\s+and\s+country\s+club)$/i,
    /\b(?:golf\s+club\s+ltd)$/i,
    /\b(?:golf\s+course)$/i,
    /\b(?:golf\s+club)$/i,
    /\b(?:golf\s+links)$/i,
    /\b(?:country\s+club)$/i,
    /\b(?:golf\s+resort)$/i,
    /\b(?:gc)$/i,
  ];

  let changed = true;
  while (changed) {
    changed = false;
    for (const pattern of patterns) {
      if (pattern.test(nextValue)) {
        nextValue = nextValue.replace(pattern, "").replace(/[-,()]+$/g, "").trim();
        changed = true;
      }
    }
  }

  return nextValue;
}

function normalizeComparableName(value: string | null | undefined) {
  return normalizeText(stripCommonGolfSuffixes(value));
}

function decodeHtmlEntities(value: string | null | undefined) {
  if (!value) return null;

  let decoded = value;
  for (const [entity, replacement] of Object.entries(HTML_ENTITY_MAP)) {
    decoded = decoded.split(entity).join(replacement);
  }

  decoded = decoded.replace(/&#(\d+);/g, (_, codePoint) => String.fromCharCode(Number(codePoint)));
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, codePoint) =>
    String.fromCharCode(Number.parseInt(codePoint, 16)),
  );

  return decoded;
}

function stripHtml(value: string | null | undefined) {
  if (!value) return null;
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, " "))?.replace(/\s+/g, " ").trim() ?? null;
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => normalizeWhitespace(value)).filter(Boolean)));
}

function tokenize(value: string) {
  return new Set(value.split(" ").filter(Boolean));
}

function tokenOverlapScore(left: string, right: string) {
  const leftTokens = tokenize(left);
  const rightTokens = tokenize(right);

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }

  const overlapCount = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  return overlapCount / Math.max(leftTokens.size, rightTokens.size);
}

function buildCourseNameVariants(course: CatalogCourseRecord) {
  const variants = new Set<string>();
  const rawValues = [
    course.name,
    course.facilityName,
    course.courseName,
    stripCommonGolfSuffixes(course.name),
    stripCommonGolfSuffixes(course.facilityName),
    stripCommonGolfSuffixes(course.courseName),
  ];

  for (const value of rawValues) {
    const normalized = normalizeComparableName(value);
    if (normalized) {
      variants.add(normalized);
    }
  }

  if (course.facilityName && course.courseName) {
    const combined = normalizeComparableName(`${course.facilityName} ${course.courseName}`);
    if (combined) {
      variants.add(combined);
    }
  }

  return Array.from(variants);
}

function getPrimaryComparableName(course: CatalogCourseRecord) {
  return buildCourseNameVariants(course)[0] ?? "";
}

function buildSearchQueries(course: CatalogCourseRecord) {
  const baseFacility = normalizeWhitespace(course.facilityName);
  const baseCourse = normalizeWhitespace(course.courseName);
  const baseName = normalizeWhitespace(course.name);
  const strippedFacility = stripCommonGolfSuffixes(baseFacility);
  const strippedCourse = stripCommonGolfSuffixes(baseCourse);
  const strippedName = stripCommonGolfSuffixes(baseName);
  const locationLabel = normalizeWhitespace(course.city);
  const regionLabel = normalizeWhitespace(course.state);
  const queries = [
    baseFacility,
    baseName,
    strippedFacility,
    strippedName,
    baseFacility && locationLabel ? `${baseFacility} ${locationLabel}` : null,
    strippedFacility && locationLabel ? `${strippedFacility} ${locationLabel}` : null,
    baseName && locationLabel ? `${baseName} ${locationLabel}` : null,
    baseCourse ? `${baseCourse} golf` : null,
    strippedCourse ? `${strippedCourse} golf` : null,
    strippedName ? `${strippedName} golf` : null,
    strippedFacility && regionLabel ? `${strippedFacility} golf course ${regionLabel}` : null,
    strippedName && regionLabel ? `${strippedName} golf course ${regionLabel}` : null,
  ];

  if (INTERNATIONAL_STATE_CODES.has(course.stateCode)) {
    queries.push(
      strippedFacility && regionLabel ? `${strippedFacility} golf ${regionLabel}` : null,
      strippedName && regionLabel ? `${strippedName} golf ${regionLabel}` : null,
    );
  }

  return uniqueValues(queries);
}

function compareCoursePriority(left: CatalogCourseRecord, right: CatalogCourseRecord) {
  const leftBucket =
    left.worldTop100Rank != null
      ? 0
      : left.hasPgaOrLpgaTourHistory
        ? 1
        : INTERNATIONAL_STATE_CODES.has(left.stateCode)
          ? 2
          : 3;
  const rightBucket =
    right.worldTop100Rank != null
      ? 0
      : right.hasPgaOrLpgaTourHistory
        ? 1
        : INTERNATIONAL_STATE_CODES.has(right.stateCode)
          ? 2
          : 3;

  if (leftBucket !== rightBucket) {
    return leftBucket - rightBucket;
  }

  if (leftBucket === 0 && left.worldTop100Rank != null && right.worldTop100Rank != null) {
    return left.worldTop100Rank - right.worldTop100Rank || left.name.localeCompare(right.name);
  }

  return left.name.localeCompare(right.name);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithDelay(url: string, init?: RequestInit) {
  const elapsed = Date.now() - lastApiCallAt;
  if (lastApiCallAt > 0 && elapsed < API_DELAY_MS) {
    await delay(API_DELAY_MS - elapsed);
  }

  const response = await fetch(url, {
    ...init,
    headers: {
      "user-agent": "GolfeRPhotoEnrichment/1.0 (local development)",
      ...(init?.headers ?? {}),
    },
  });
  lastApiCallAt = Date.now();

  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status}`);
  }

  return response;
}

function extractEntityId(entityUrl: string) {
  const parts = entityUrl.split("/");
  return parts[parts.length - 1] ?? entityUrl;
}

function extractCommonsTitle(imageValue: string | null | undefined) {
  if (!imageValue) return null;
  if (imageValue.startsWith("File:")) {
    return imageValue;
  }

  try {
    const parsed = new URL(imageValue);
    const pathname = decodeURIComponent(parsed.pathname);
    const specialFilePathIndex = pathname.indexOf("/wiki/Special:FilePath/");

    if (specialFilePathIndex >= 0) {
      const rawName = pathname.slice(specialFilePathIndex + "/wiki/Special:FilePath/".length);
      return `File:${rawName.replace(/_/g, " ")}`;
    }

    const lastSegment = pathname.split("/").filter(Boolean).at(-1);
    if (lastSegment) {
      return `File:${decodeURIComponent(lastSegment).replace(/_/g, " ")}`;
    }
  } catch {
    return `File:${decodeURIComponent(imageValue).replace(/_/g, " ")}`;
  }

  return `File:${decodeURIComponent(imageValue).replace(/_/g, " ")}`;
}

async function loadCatalog() {
  const raw = await fs.readFile(catalogPath, "utf8");
  return JSON.parse(raw) as CatalogCourseRecord[];
}

async function fetchGlobalWikidataCandidates() {
  const query = `
    SELECT ?item ?itemLabel ?itemDescription ?image ?articleTitle
           (GROUP_CONCAT(DISTINCT ?alias; separator="|") AS ?aliases)
           (GROUP_CONCAT(DISTINCT ?placeLabel; separator="|") AS ?places)
    WHERE {
      ?item wdt:P31 ?instance ;
            wdt:P18 ?image .
      ?instance wdt:P279* wd:Q1048525 .

      OPTIONAL {
        ?item skos:altLabel ?alias .
        FILTER(LANG(?alias) = "en")
      }

      OPTIONAL {
        ?item wdt:P131* ?place .
        FILTER(?place != ?item)
        ?place rdfs:label ?placeLabel .
        FILTER(LANG(?placeLabel) = "en")
      }

      OPTIONAL {
        ?article schema:about ?item ;
                 schema:isPartOf <https://en.wikipedia.org/> ;
                 schema:name ?articleTitle .
      }

      SERVICE wikibase:label {
        bd:serviceParam wikibase:language "en" .
      }
    }
    GROUP BY ?item ?itemLabel ?itemDescription ?image ?articleTitle
    LIMIT 7000
  `;

  const url = new URL("https://query.wikidata.org/sparql");
  url.searchParams.set("query", query);
  url.searchParams.set("format", "json");

  const response = await fetchWithDelay(url.toString(), {
    headers: {
      accept: "application/sparql-results+json",
    },
  });

  const payload = (await response.json()) as {
    results?: {
      bindings?: Array<Record<string, { value: string }>>;
    };
  };

  return (payload.results?.bindings ?? []).map((binding) => ({
    entityId: extractEntityId(binding.item?.value ?? ""),
    label: binding.itemLabel?.value ?? "",
    description: binding.itemDescription?.value ?? null,
    aliases: (binding.aliases?.value ?? "")
      .split("|")
      .map((value) => normalizeWhitespace(value))
      .filter(Boolean),
    places: (binding.places?.value ?? "")
      .split("|")
      .map((value) => normalizeWhitespace(value))
      .filter(Boolean),
    imageTitle: extractCommonsTitle(binding.image?.value) ?? null,
    articleTitle: normalizeWhitespace(binding.articleTitle?.value) || null,
    isGolfCourse: true,
  })) as WikidataCandidate[];
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

async function fetchCommonsMetadataByTitle(titles: string[]) {
  const metadataByTitle = new Map<string, CommonsImageMetadata>();

  for (const group of chunk(titles, COMMONS_BATCH_SIZE)) {
    const url = new URL("https://commons.wikimedia.org/w/api.php");
    url.searchParams.set("action", "query");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");
    url.searchParams.set("prop", "imageinfo");
    url.searchParams.set("iiprop", "url|extmetadata");
    url.searchParams.set("iiurlwidth", "300");
    url.searchParams.set("titles", group.join("|"));

    const response = await fetchWithDelay(url.toString());
    const payload = (await response.json()) as {
      query?: {
        pages?: Record<
          string,
          {
            title?: string;
            imageinfo?: Array<{
              url?: string;
              thumburl?: string;
              extmetadata?: Record<string, { value?: string }>;
            }>;
          }
        >;
      };
    };

    for (const page of Object.values(payload.query?.pages ?? {})) {
      const imageInfo = page.imageinfo?.[0];
      const extmetadata = imageInfo?.extmetadata ?? {};
      const title = page.title;

      if (!title) {
        continue;
      }

      metadataByTitle.set(title, {
        coverPhotoUrl: imageInfo?.url ?? null,
        thumbnailUrl: imageInfo?.thumburl ?? null,
        photoLicense:
          stripHtml(extmetadata.LicenseShortName?.value) ??
          stripHtml(extmetadata.License?.value) ??
          stripHtml(extmetadata.UsageTerms?.value),
        photoCredit:
          stripHtml(extmetadata.Artist?.value) ??
          stripHtml(extmetadata.Credit?.value) ??
          stripHtml(extmetadata.ObjectName?.value),
      });
    }
  }

  return metadataByTitle;
}

async function getCommonsMetadataForTitle(
  title: string,
  commonsMetadataCache: Map<string, CommonsImageMetadata | null>,
) {
  if (commonsMetadataCache.has(title)) {
    return commonsMetadataCache.get(title) ?? null;
  }

  const metadataByTitle = await fetchCommonsMetadataByTitle([title]);
  const metadata = metadataByTitle.get(title) ?? null;
  commonsMetadataCache.set(title, metadata);
  return metadata;
}

async function fetchWikidataSearchResults(
  query: string,
  searchCache: Map<string, SearchEntitySummary[]>,
) {
  const cacheKey = query.toLowerCase();
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey) ?? [];
  }

  const url = new URL("https://www.wikidata.org/w/api.php");
  url.searchParams.set("action", "wbsearchentities");
  url.searchParams.set("language", "en");
  url.searchParams.set("limit", String(SEARCH_RESULT_LIMIT));
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  url.searchParams.set("search", query);

  const response = await fetchWithDelay(url.toString());
  const payload = (await response.json()) as EntitySearchResponse;

  const results = (payload.search ?? [])
    .map((entry) => ({
      entityId: entry.id ?? "",
      label: normalizeWhitespace(entry.label),
      description: normalizeWhitespace(entry.description) || null,
      aliases: (entry.aliases ?? []).map((alias) => normalizeWhitespace(alias)).filter(Boolean),
    }))
    .filter((entry) => entry.entityId && entry.label);

  searchCache.set(cacheKey, results);
  return results;
}

function getClaimEntityIds(entity: WikidataEntityPayload, propertyId: string) {
  return (entity.claims?.[propertyId] ?? [])
    .map((claim) => {
      const value = claim.mainsnak?.datavalue?.value;
      return typeof value === "object" && value && "id" in value ? value.id ?? null : null;
    })
    .filter(Boolean) as string[];
}

function getClaimString(entity: WikidataEntityPayload, propertyId: string) {
  for (const claim of entity.claims?.[propertyId] ?? []) {
    const value = claim.mainsnak?.datavalue?.value;
    if (typeof value === "string" && value) {
      return value;
    }
  }

  return null;
}

function isGolfCourseDescription(description: string | null | undefined) {
  const normalizedDescription = normalizeText(description);
  return (
    normalizedDescription.includes("golf course") ||
    normalizedDescription.includes("golf club") ||
    normalizedDescription.includes("country club") ||
    normalizedDescription.includes("golf resort") ||
    normalizedDescription.includes("links course")
  );
}

function entityToCandidate(entityId: string, entity: WikidataEntityPayload, searchSummary?: SearchEntitySummary) {
  const label =
    normalizeWhitespace(entity.labels?.en?.value) ||
    normalizeWhitespace(searchSummary?.label);
  if (!label) {
    return null;
  }

  const description =
    normalizeWhitespace(entity.descriptions?.en?.value) ||
    normalizeWhitespace(searchSummary?.description) ||
    null;
  const aliases = uniqueValues([
    ...(entity.aliases?.en ?? []).map((entry) => entry.value),
    ...(searchSummary?.aliases ?? []),
  ]);
  const instanceIds = new Set([
    ...getClaimEntityIds(entity, "P31"),
    ...getClaimEntityIds(entity, "P279"),
  ]);
  const isGolfCourse =
    [...instanceIds].some((instanceId) => GOLF_COURSE_INSTANCE_IDS.has(instanceId)) ||
    isGolfCourseDescription(description);

  const imageTitle = extractCommonsTitle(getClaimString(entity, "P18")) ?? null;
  const articleTitle = normalizeWhitespace(entity.sitelinks?.enwiki?.title) || null;

  return {
    entityId,
    label,
    description,
    aliases,
    places: [],
    imageTitle,
    articleTitle,
    isGolfCourse,
  } satisfies WikidataCandidate;
}

async function fetchWikidataEntityCandidates(
  ids: string[],
  searchSummariesById: Map<string, SearchEntitySummary>,
  entityCache: Map<string, WikidataCandidate | null>,
) {
  const missingIds = ids.filter((id) => !entityCache.has(id));
  if (missingIds.length > 0) {
    const url = new URL("https://www.wikidata.org/w/api.php");
    url.searchParams.set("action", "wbgetentities");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");
    url.searchParams.set("languages", "en");
    url.searchParams.set("props", "labels|aliases|descriptions|claims|sitelinks");
    url.searchParams.set("ids", missingIds.join("|"));

    const response = await fetchWithDelay(url.toString());
    const payload = (await response.json()) as {
      entities?: Record<string, WikidataEntityPayload>;
    };

    for (const missingId of missingIds) {
      const entity = payload.entities?.[missingId];
      const candidate = entity
        ? entityToCandidate(missingId, entity, searchSummariesById.get(missingId))
        : null;
      entityCache.set(missingId, candidate);
    }
  }

  return ids
    .map((id) => entityCache.get(id) ?? null)
    .filter(Boolean) as WikidataCandidate[];
}

function bestNameScore(course: CatalogCourseRecord, candidate: WikidataCandidate) {
  const courseNames = buildCourseNameVariants(course);
  const candidateNames = uniqueValues([
    candidate.label,
    ...candidate.aliases,
    stripCommonGolfSuffixes(candidate.label),
    ...candidate.aliases.map((alias) => stripCommonGolfSuffixes(alias)),
  ]).map((value) => normalizeComparableName(value));

  let bestScore = 0;

  for (const courseName of courseNames) {
    for (const candidateName of candidateNames) {
      if (!courseName || !candidateName) continue;

      if (courseName === candidateName) {
        return 1;
      }

      if (
        courseName.length >= 4 &&
        candidateName.length >= 4 &&
        (candidateName.includes(courseName) || courseName.includes(candidateName))
      ) {
        bestScore = Math.max(bestScore, 0.9);
      }

      bestScore = Math.max(bestScore, tokenOverlapScore(courseName, candidateName));
    }
  }

  return bestScore;
}

function locationMatchScore(course: CatalogCourseRecord, candidate: WikidataCandidate) {
  const locationTerms = uniqueValues([
    course.city,
    course.state,
    course.stateCode,
    course.country,
    course.country === "United Kingdom" ? "UK" : null,
  ]).map((value) => normalizeText(value));
  const candidateText = normalizeText(
    [
      candidate.description,
      ...candidate.places,
    ].join(" "),
  );

  let score = 0;

  for (const term of locationTerms) {
    if (!term || !candidateText.includes(term)) {
      continue;
    }

    if (term === normalizeText(course.city)) {
      score += 3;
      continue;
    }

    if (term === normalizeText(course.state)) {
      score += 2;
      continue;
    }

    score += 1;
  }

  return score;
}

function scoreMatch(course: CatalogCourseRecord, candidate: WikidataCandidate): MatchCandidate | null {
  if (!candidate.isGolfCourse) {
    return null;
  }

  const nameScore = bestNameScore(course, candidate);
  const locationScore = locationMatchScore(course, candidate);
  const isTop100Course = course.worldTop100Rank != null;

  if (nameScore >= 1 && (locationScore >= 1 || isTop100Course)) {
    return {
      candidate,
      confidence: "high",
      score: 100 + locationScore,
    };
  }

  if (nameScore >= 0.9 && locationScore >= 1) {
    return {
      candidate,
      confidence: locationScore >= 2 ? "high" : "medium",
      score: 85 + nameScore * 10 + locationScore,
    };
  }

  if (isTop100Course && nameScore >= 0.68) {
    return {
      candidate,
      confidence: "medium",
      score: 65 + nameScore * 10 + locationScore,
    };
  }

  if (nameScore >= 0.78 && locationScore >= 1) {
    return {
      candidate,
      confidence: "medium",
      score: 60 + nameScore * 10 + locationScore,
    };
  }

  if (nameScore >= 0.72 && locationScore >= 2) {
    return {
      candidate,
      confidence: "medium",
      score: 55 + nameScore * 10 + locationScore,
    };
  }

  return null;
}

async function fetchWikipediaSummaryImageTitle(
  articleTitle: string,
  wikipediaSummaryCache: Map<string, string | null>,
) {
  if (wikipediaSummaryCache.has(articleTitle)) {
    return wikipediaSummaryCache.get(articleTitle) ?? null;
  }

  const url = new URL(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(articleTitle)}`,
  );
  const response = await fetchWithDelay(url.toString());
  const payload = (await response.json()) as {
    originalimage?: { source?: string };
  };
  const imageTitle = extractCommonsTitle(payload.originalimage?.source) ?? null;
  wikipediaSummaryCache.set(articleTitle, imageTitle);
  return imageTitle;
}

function looksLikeCommonsCourseResult(course: CatalogCourseRecord, title: string, snippet: string) {
  const normalized = normalizeText(`${title} ${snippet}`);

  if (NEGATIVE_COMMONS_TERMS.some((term) => normalized.includes(term))) {
    return false;
  }

  const primaryName = getPrimaryComparableName(course);
  if (!primaryName) {
    return false;
  }

  return normalized.includes(primaryName) || primaryName.includes(normalized);
}

async function fetchCommonsSearchTitle(
  course: CatalogCourseRecord,
  query: string,
  commonsSearchCache: Map<string, string | null>,
) {
  const cacheKey = query.toLowerCase();
  if (commonsSearchCache.has(cacheKey)) {
    return commonsSearchCache.get(cacheKey) ?? null;
  }

  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "search");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  url.searchParams.set("srnamespace", "6");
  url.searchParams.set("srlimit", "8");
  url.searchParams.set("srsearch", query);

  const response = await fetchWithDelay(url.toString());
  const payload = (await response.json()) as {
    query?: {
      search?: Array<{
        title?: string;
        snippet?: string;
      }>;
    };
  };

  const firstMatch =
    (payload.query?.search ?? []).find((result) =>
      looksLikeCommonsCourseResult(course, result.title ?? "", stripHtml(result.snippet) ?? ""),
    ) ?? null;

  const title = firstMatch?.title ?? null;
  commonsSearchCache.set(cacheKey, title);
  return title;
}

function buildPhotoRecord(
  course: CatalogCourseRecord,
  sourceId: string,
  confidence: "high" | "medium",
  commonsMetadata: CommonsImageMetadata | null,
  lastEnriched: string,
): CoursePhotoRecord | null {
  if (!commonsMetadata?.coverPhotoUrl || !commonsMetadata.thumbnailUrl) {
    return null;
  }

  if (!commonsMetadata.photoLicense || !commonsMetadata.photoCredit) {
    return null;
  }

  return {
    courseId: course.id,
    coverPhotoUrl: commonsMetadata.coverPhotoUrl,
    thumbnailUrl: commonsMetadata.thumbnailUrl,
    photoSource: "wikimedia-commons",
    photoLicense: commonsMetadata.photoLicense,
    photoCredit: commonsMetadata.photoCredit,
    photoConfidence: confidence,
    wikidataEntityId: sourceId,
    lastEnriched,
  };
}

async function tryBuildPhotoFromCandidate(
  course: CatalogCourseRecord,
  match: MatchCandidate,
  lastEnriched: string,
  commonsMetadataCache: Map<string, CommonsImageMetadata | null>,
  wikipediaSummaryCache: Map<string, string | null>,
) {
  if (match.candidate.imageTitle) {
    const commonsMetadata = await getCommonsMetadataForTitle(
      match.candidate.imageTitle,
      commonsMetadataCache,
    );
    const photoRecord = buildPhotoRecord(
      course,
      match.candidate.entityId,
      match.confidence,
      commonsMetadata,
      lastEnriched,
    );

    if (photoRecord) {
      return {
        record: photoRecord,
        sourceId: match.candidate.entityId,
        score: match.score,
      };
    }
  }

  if (match.candidate.articleTitle) {
    const wikipediaImageTitle = await fetchWikipediaSummaryImageTitle(
      match.candidate.articleTitle,
      wikipediaSummaryCache,
    );

    if (wikipediaImageTitle) {
      const commonsMetadata = await getCommonsMetadataForTitle(
        wikipediaImageTitle,
        commonsMetadataCache,
      );
      const photoRecord = buildPhotoRecord(
        course,
        match.candidate.entityId,
        match.confidence,
        commonsMetadata,
        lastEnriched,
      );

      if (photoRecord) {
        return {
          record: photoRecord,
          sourceId: match.candidate.entityId,
          score: match.score,
        };
      }
    }
  }

  return null;
}

async function tryGlobalCandidateMatch(
  course: CatalogCourseRecord,
  globalCandidates: WikidataCandidate[],
  lastEnriched: string,
  commonsMetadataCache: Map<string, CommonsImageMetadata | null>,
  wikipediaSummaryCache: Map<string, string | null>,
) {
  const matches = globalCandidates
    .map((candidate) => scoreMatch(course, candidate))
    .filter(Boolean) as MatchCandidate[];

  matches.sort((left, right) => right.score - left.score || left.candidate.label.localeCompare(right.candidate.label));

  for (const match of matches.slice(0, 6)) {
    const resolvedPhoto = await tryBuildPhotoFromCandidate(
      course,
      match,
      lastEnriched,
      commonsMetadataCache,
      wikipediaSummaryCache,
    );

    if (resolvedPhoto) {
      return resolvedPhoto;
    }
  }

  return null;
}

async function tryTargetedWikidataMatch(
  course: CatalogCourseRecord,
  lastEnriched: string,
  searchCache: Map<string, SearchEntitySummary[]>,
  entityCache: Map<string, WikidataCandidate | null>,
  commonsMetadataCache: Map<string, CommonsImageMetadata | null>,
  wikipediaSummaryCache: Map<string, string | null>,
) {
  for (const query of buildSearchQueries(course)) {
    const searchResults = await fetchWikidataSearchResults(query, searchCache);
    if (searchResults.length === 0) {
      continue;
    }

    const searchSummariesById = new Map(searchResults.map((result) => [result.entityId, result]));
    const entityCandidates = await fetchWikidataEntityCandidates(
      searchResults.map((result) => result.entityId),
      searchSummariesById,
      entityCache,
    );

    const matches = entityCandidates
      .map((candidate) => scoreMatch(course, candidate))
      .filter(Boolean) as MatchCandidate[];

    matches.sort((left, right) => right.score - left.score || left.candidate.label.localeCompare(right.candidate.label));

    for (const match of matches) {
      const resolvedPhoto = await tryBuildPhotoFromCandidate(
        course,
        match,
        lastEnriched,
        commonsMetadataCache,
        wikipediaSummaryCache,
      );

      if (resolvedPhoto) {
        return resolvedPhoto;
      }
    }
  }

  return null;
}

async function tryCommonsSearchFallback(
  course: CatalogCourseRecord,
  lastEnriched: string,
  commonsSearchCache: Map<string, string | null>,
  commonsMetadataCache: Map<string, CommonsImageMetadata | null>,
) {
  for (const query of buildSearchQueries(course)) {
    const searchTitle = await fetchCommonsSearchTitle(course, `${query} golf`, commonsSearchCache);
    if (!searchTitle) {
      continue;
    }

    const commonsMetadata = await getCommonsMetadataForTitle(searchTitle, commonsMetadataCache);
    const photoRecord = buildPhotoRecord(
      course,
      `commons-search:${searchTitle}`,
      course.worldTop100Rank != null ? "high" : "medium",
      commonsMetadata,
      lastEnriched,
    );

    if (photoRecord) {
      return {
        record: photoRecord,
        sourceId: `commons-search:${searchTitle}`,
        score: course.worldTop100Rank != null ? 75 : 60,
      };
    }
  }

  return null;
}

async function writePhotoRecords(photoRecords: CoursePhotoRecord[]) {
  const sortedRecords = [...photoRecords].sort((left, right) => left.courseId.localeCompare(right.courseId));
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(sortedRecords, null, 2));
}

function canClaimSource(
  sourceClaims: Map<string, { courseId: string; reducedName: string }>,
  sourceId: string,
  course: CatalogCourseRecord,
) {
  const existingClaim = sourceClaims.get(sourceId);
  if (!existingClaim) {
    sourceClaims.set(sourceId, {
      courseId: course.id,
      reducedName: getPrimaryComparableName(course),
    });
    return true;
  }

  if (existingClaim.courseId === course.id) {
    return true;
  }

  return existingClaim.reducedName === getPrimaryComparableName(course);
}

async function main() {
  const [catalog, globalCandidates] = await Promise.all([loadCatalog(), fetchGlobalWikidataCandidates()]);
  const prioritizedCatalog = [...catalog].sort(compareCoursePriority);
  const coursesToProcess = COURSE_LIMIT ? prioritizedCatalog.slice(0, COURSE_LIMIT) : prioritizedCatalog;
  const lastEnriched = new Date().toISOString();

  const searchCache = new Map<string, SearchEntitySummary[]>();
  const entityCache = new Map<string, WikidataCandidate | null>();
  const commonsSearchCache = new Map<string, string | null>();
  const commonsMetadataCache = new Map<string, CommonsImageMetadata | null>();
  const wikipediaSummaryCache = new Map<string, string | null>();
  const sourceClaims = new Map<string, { courseId: string; reducedName: string }>();
  const photoRecordsByCourseId = new Map<string, CoursePhotoRecord>();

  let processedCourseCount = 0;

  for (const course of coursesToProcess) {
    let resolvedPhoto =
      (await tryGlobalCandidateMatch(
        course,
        globalCandidates,
        lastEnriched,
        commonsMetadataCache,
        wikipediaSummaryCache,
      )) ??
      (await tryTargetedWikidataMatch(
        course,
        lastEnriched,
        searchCache,
        entityCache,
        commonsMetadataCache,
        wikipediaSummaryCache,
      )) ??
      (await tryCommonsSearchFallback(
        course,
        lastEnriched,
        commonsSearchCache,
        commonsMetadataCache,
      ));

    if (resolvedPhoto && canClaimSource(sourceClaims, resolvedPhoto.sourceId, course)) {
      photoRecordsByCourseId.set(course.id, resolvedPhoto.record);
    } else {
      resolvedPhoto = null;
    }

    processedCourseCount += 1;

    if (processedCourseCount % PROGRESS_WRITE_INTERVAL === 0) {
      await writePhotoRecords(Array.from(photoRecordsByCourseId.values()));
      console.log(
        JSON.stringify(
          {
            processedCourses: processedCourseCount,
            totalCourses: coursesToProcess.length,
            photosFound: photoRecordsByCourseId.size,
            outputPath: path.relative(repoRoot, outputPath),
          },
          null,
          2,
        ),
      );
    }
  }

  const photoRecords = Array.from(photoRecordsByCourseId.values());
  await writePhotoRecords(photoRecords);

  const top100Courses = coursesToProcess.filter((course) => course.worldTop100Rank != null);
  const tourHistoryCourses = coursesToProcess.filter((course) => course.hasPgaOrLpgaTourHistory === true);
  const highConfidenceCount = photoRecords.filter((record) => record.photoConfidence === "high").length;
  const mediumConfidenceCount = photoRecords.filter((record) => record.photoConfidence === "medium").length;

  console.log(
    JSON.stringify(
      {
        processedCourses: coursesToProcess.length,
        catalogCourses: catalog.length,
        globalWikidataCandidates: globalCandidates.length,
        photosCreated: photoRecords.length,
        skippedCourses: coursesToProcess.length - photoRecords.length,
        coveragePercent:
          coursesToProcess.length > 0
            ? Math.round((photoRecords.length / coursesToProcess.length) * 1000) / 10
            : 0,
        confidence: {
          high: highConfidenceCount,
          medium: mediumConfidenceCount,
        },
        top100Coverage: {
          withPhotos: top100Courses.filter((course) => photoRecordsByCourseId.has(course.id)).length,
          withoutPhotos: top100Courses.filter((course) => !photoRecordsByCourseId.has(course.id)).length,
        },
        tourHistoryCoverage: {
          withPhotos: tourHistoryCourses.filter((course) => photoRecordsByCourseId.has(course.id)).length,
          withoutPhotos: tourHistoryCourses.filter((course) => !photoRecordsByCourseId.has(course.id)).length,
        },
        outputPath: path.relative(repoRoot, outputPath),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
