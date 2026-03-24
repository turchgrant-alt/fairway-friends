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
};

type WikidataCandidate = {
  entityId: string;
  label: string;
  description: string | null;
  aliases: string[];
  places: string[];
  imageTitle: string;
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const catalogPath = path.join(
  repoRoot,
  "data",
  "course-catalog",
  "normalized",
  "us-golf-courses.normalized.json",
);
const outputPath = path.join(repoRoot, "src", "data", "coursePhotos.json");

const API_DELAY_MS = 1000;
const COMMONS_BATCH_SIZE = 25;

const HTML_ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&quot;": "\"",
  "&#39;": "'",
  "&apos;": "'",
  "&lt;": "<",
  "&gt;": ">",
  "&nbsp;": " ",
};

const GENERIC_NAME_TOKENS = new Set([
  "golf",
  "course",
  "club",
  "country",
  "resort",
  "links",
  "national",
  "at",
  "the",
  "and",
]);

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

function stripGenericGolfTerms(value: string) {
  return value
    .split(" ")
    .filter((token) => token && !GENERIC_NAME_TOKENS.has(token))
    .join(" ");
}

function decodeHtmlEntities(value: string | null | undefined) {
  if (!value) return null;

  let decoded = value;

  for (const [entity, replacement] of Object.entries(HTML_ENTITY_MAP)) {
    decoded = decoded.split(entity).join(replacement);
  }

  decoded = decoded.replace(/&#(\d+);/g, (_, codePoint) => String.fromCharCode(Number(codePoint)));
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, codePoint) =>
    String.fromCharCode(parseInt(codePoint, 16)),
  );

  return decoded;
}

function stripHtml(value: string | null | undefined) {
  if (!value) return null;
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, " "))?.replace(/\s+/g, " ").trim() ?? null;
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

function extractCommonsTitle(imageValue: string) {
  if (imageValue.startsWith("File:")) {
    return imageValue;
  }

  try {
    const parsed = new URL(imageValue);
    const specialFilePathIndex = parsed.pathname.indexOf("/wiki/Special:FilePath/");

    if (specialFilePathIndex >= 0) {
      const rawName = parsed.pathname.slice(specialFilePathIndex + "/wiki/Special:FilePath/".length);
      return `File:${decodeURIComponent(rawName)}`;
    }

    const pathname = decodeURIComponent(parsed.pathname);
    if (pathname.includes("/wiki/File:")) {
      return pathname.slice(pathname.indexOf("/wiki/File:") + "/wiki/".length);
    }
  } catch {
    return `File:${decodeURIComponent(imageValue)}`;
  }

  return `File:${decodeURIComponent(imageValue)}`;
}

function buildCourseNameVariants(course: CatalogCourseRecord) {
  const variants = new Set<string>();
  const values = [course.name, course.facilityName, course.courseName];

  for (const value of values) {
    const normalized = normalizeText(value);
    if (normalized) {
      variants.add(normalized);
    }
  }

  if (course.facilityName && course.courseName) {
    const combined = normalizeText(`${course.facilityName} ${course.courseName}`);
    if (combined) {
      variants.add(combined);
    }
  }

  return Array.from(variants);
}

function buildReducedCourseNameVariants(course: CatalogCourseRecord) {
  return buildCourseNameVariants(course)
    .map(stripGenericGolfTerms)
    .filter(Boolean);
}

function getPrimaryReducedCourseName(course: CatalogCourseRecord) {
  return buildReducedCourseNameVariants(course)[0] ?? "";
}

function isGenericCourseName(course: CatalogCourseRecord) {
  const baseName = normalizeText(course.name);
  if (!baseName) return true;

  const reduced = stripGenericGolfTerms(baseName);
  if (!reduced) return true;

  const tokenCount = reduced.split(" ").length;
  return tokenCount <= 1 && !course.facilityName;
}

function exactLabelMatch(course: CatalogCourseRecord, candidate: WikidataCandidate) {
  const candidateLabel = normalizeText(candidate.label);
  return buildCourseNameVariants(course).some((variant) => variant === candidateLabel);
}

function closeNameMatch(course: CatalogCourseRecord, candidate: WikidataCandidate) {
  const candidateNames = [candidate.label, ...candidate.aliases].map(normalizeText).filter(Boolean);
  const courseNames = buildCourseNameVariants(course);
  const reducedCourseNames = buildReducedCourseNameVariants(course);

  for (const candidateName of candidateNames) {
    if (courseNames.includes(candidateName)) {
      return true;
    }

    const reducedCandidateName = stripGenericGolfTerms(candidateName);
    if (reducedCandidateName && reducedCourseNames.includes(reducedCandidateName)) {
      return true;
    }
  }

  return false;
}

function locationMatchScore(course: CatalogCourseRecord, candidate: WikidataCandidate) {
  const normalizedPlaces = new Set(candidate.places.map(normalizeText).filter(Boolean));
  const normalizedCity = normalizeText(course.city);
  const normalizedState = normalizeText(course.state);
  const normalizedStateCode = normalizeText(course.stateCode);

  let score = 0;

  if (normalizedCity && normalizedPlaces.has(normalizedCity)) {
    score += 3;
  }

  if (normalizedState && normalizedPlaces.has(normalizedState)) {
    score += 2;
  }

  if (normalizedStateCode && normalizedPlaces.has(normalizedStateCode)) {
    score += 1;
  }

  return score;
}

function scoreMatch(course: CatalogCourseRecord, candidate: WikidataCandidate): MatchCandidate | null {
  if (isGenericCourseName(course)) {
    return null;
  }

  const exact = exactLabelMatch(course, candidate);
  const close = exact || closeNameMatch(course, candidate);

  if (!close) {
    return null;
  }

  const locationScore = locationMatchScore(course, candidate);

  if (exact && locationScore >= 2) {
    return {
      candidate,
      confidence: "high",
      score: 100 + locationScore,
    };
  }

  if (!exact && locationScore >= 3) {
    return {
      candidate,
      confidence: "medium",
      score: 70 + locationScore,
    };
  }

  return null;
}

async function loadCatalog() {
  const raw = await fs.readFile(catalogPath, "utf8");
  return JSON.parse(raw) as CatalogCourseRecord[];
}

async function fetchWikidataCandidates() {
  const query = `
    SELECT ?item ?itemLabel ?itemDescription ?image
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

      SERVICE wikibase:label {
        bd:serviceParam wikibase:language "en" .
      }
    }
    GROUP BY ?item ?itemLabel ?itemDescription ?image
    LIMIT 5000
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
    imageTitle: extractCommonsTitle(binding.image?.value ?? ""),
  }));
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

function buildPhotoRecord(
  course: CatalogCourseRecord,
  match: MatchCandidate,
  commonsMetadata: CommonsImageMetadata | undefined,
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
    photoConfidence: match.confidence,
    wikidataEntityId: match.candidate.entityId,
    lastEnriched,
  };
}

async function main() {
  const [catalog, wikidataCandidates] = await Promise.all([loadCatalog(), fetchWikidataCandidates()]);
  const catalogById = new Map(catalog.map((course) => [course.id, course]));

  const matchedCourses = new Map<string, MatchCandidate>();

  for (const course of catalog) {
    const matches = wikidataCandidates
      .map((candidate) => scoreMatch(course, candidate))
      .filter(Boolean) as MatchCandidate[];

    if (matches.length === 0) {
      continue;
    }

    matches.sort((left, right) => right.score - left.score || left.candidate.label.localeCompare(right.candidate.label));
    matchedCourses.set(course.id, matches[0]);
  }

  const courseIdsByEntityId = new Map<string, string[]>();
  for (const [courseId, match] of matchedCourses.entries()) {
    const group = courseIdsByEntityId.get(match.candidate.entityId) ?? [];
    group.push(courseId);
    courseIdsByEntityId.set(match.candidate.entityId, group);
  }

  for (const [entityId, courseIds] of courseIdsByEntityId.entries()) {
    if (courseIds.length <= 1) {
      continue;
    }

    const rankedMatches = courseIds
      .map((courseId) => ({
        courseId,
        match: matchedCourses.get(courseId)!,
        reducedName: getPrimaryReducedCourseName(catalogById.get(courseId)!),
      }))
      .sort((left, right) => right.match.score - left.match.score);

    const canonicalReducedName = rankedMatches[0]?.reducedName;

    for (const rankedMatch of rankedMatches.slice(1)) {
      if (rankedMatch.reducedName !== canonicalReducedName) {
        matchedCourses.delete(rankedMatch.courseId);
      }
    }
  }

  const uniqueTitles = Array.from(
    new Set(Array.from(matchedCourses.values()).map((match) => match.candidate.imageTitle).filter(Boolean)),
  );
  const commonsMetadataByTitle = await fetchCommonsMetadataByTitle(uniqueTitles);
  const lastEnriched = new Date().toISOString();

  const photoRecords = catalog
    .map((course) => {
      const match = matchedCourses.get(course.id);
      if (!match) return null;

      return buildPhotoRecord(
        course,
        match,
        commonsMetadataByTitle.get(match.candidate.imageTitle),
        lastEnriched,
      );
    })
    .filter(Boolean) as CoursePhotoRecord[];

  photoRecords.sort((left, right) => left.courseId.localeCompare(right.courseId));

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(photoRecords, null, 2));

  const highConfidenceCount = photoRecords.filter((record) => record.photoConfidence === "high").length;
  const mediumConfidenceCount = photoRecords.filter((record) => record.photoConfidence === "medium").length;

  console.log(
    JSON.stringify(
      {
        catalogCourses: catalog.length,
        wikidataCandidates: wikidataCandidates.length,
        photosCreated: photoRecords.length,
        skippedCourses: catalog.length - photoRecords.length,
        confidence: {
          high: highConfidenceCount,
          medium: mediumConfidenceCount,
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
