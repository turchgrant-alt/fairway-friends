import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

const normalizedCatalogPath = path.join(
  repoRoot,
  "data",
  "course-catalog",
  "normalized",
  "us-golf-courses.normalized.json",
);
const catalogManifestPath = path.join(
  repoRoot,
  "src",
  "data",
  "generated",
  "courseCatalog.manifest.generated.json",
);
const storedListsDir = path.join(repoRoot, "data", "course-lists", "generated");
const storedListsPath = path.join(storedListsDir, "curatedCourseLists.generated.json");
const publicListsDir = path.join(repoRoot, "public", "data");
const publicListsPath = path.join(publicListsDir, "curatedCourseLists.generated.json");

const REFRESH_CADENCE = "weekly";
const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80",
  "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&q=80",
  "https://images.unsplash.com/photo-1593111774240-004412c0d235?w=800&q=80",
  "https://images.unsplash.com/photo-1592919505780-303950717480?w=800&q=80",
  "https://images.unsplash.com/photo-1600007370700-545eb0525a87?w=800&q=80",
  "https://images.unsplash.com/photo-1611374243147-44a702c2d44c?w=800&q=80",
  "https://images.unsplash.com/photo-1632932693498-58789a4746d4?w=800&q=80",
  "https://images.unsplash.com/photo-1622397815765-53a970a096c2?w=800&q=80",
  "https://images.unsplash.com/photo-1596727362302-b8d891c42ab8?w=800&q=80",
  "https://images.unsplash.com/photo-1540539234-c14a20fb7c7b?w=800&q=80",
  "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&q=80",
  "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80",
];

function normalizeString(value) {
  if (value == null) return null;

  const normalized = String(value).trim().replace(/\s+/g, " ");
  return normalized.length > 0 ? normalized : null;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function hashString(value) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}

function getPlaceholderImage(courseId) {
  return PLACEHOLDER_IMAGES[hashString(courseId) % PLACEHOLDER_IMAGES.length];
}

function buildLocationLabel(record) {
  if (record.city && record.country === "United States" && record.stateCode) return `${record.city}, ${record.stateCode}`;
  if (record.city && record.state) return `${record.city}, ${record.state}`;
  if (record.county && record.country === "United States" && record.stateCode) return `${record.county} County, ${record.stateCode}`;
  if (record.county && record.state) return `${record.county}, ${record.state}`;
  if (record.state) return record.state;
  if (record.stateCode) return record.stateCode;
  return "Unknown location";
}

function buildCoursePreview(record) {
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
    location: buildLocationLabel(record),
    latitude: record.latitude,
    longitude: record.longitude,
    hasVerifiedCoordinates: record.hasVerifiedCoordinates,
    accessType: record.accessType,
    type: record.accessType && record.accessType !== "unknown" ? record.accessType : "course",
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
    imageUrl: getPlaceholderImage(record.id),
    overallRating: null,
    priceRange: null,
  };
}

function getConfidenceScore(confidenceLevel) {
  switch (normalizeString(confidenceLevel)?.toLowerCase()) {
    case "high":
      return 12;
    case "medium":
      return 7;
    case "low":
      return 3;
    default:
      return 0;
  }
}

function getMetadataScore(
  record,
  {
    coordinates = 0,
    website = 0,
    address = 0,
    phone = 0,
    par = 0,
    confidenceHigh = 0,
    confidenceMedium = 0,
    confidenceLow = 0,
  } = {},
) {
  return (
    (record.hasVerifiedCoordinates ? coordinates : 0) +
    (record.website ? website : 0) +
    (record.addressLabel ? address : 0) +
    (record.phone ? phone : 0) +
    (record.par != null ? par : 0) +
    (() => {
      switch (normalizeString(record.confidenceLevel)?.toLowerCase()) {
        case "high":
          return confidenceHigh;
        case "medium":
          return confidenceMedium;
        case "low":
          return confidenceLow;
        default:
          return 0;
      }
    })()
  );
}

function getVenueScaleScore(
  holes,
  { nine = 0, eighteen = 0, twentySeven = 0, thirtySix = 0, fortyFive = 0, fiftyFour = 0 } = {},
) {
  if (typeof holes !== "number") return 0;
  if (holes >= 54) return fiftyFour || fortyFive || thirtySix || twentySeven || eighteen || nine;
  if (holes >= 45) return fortyFive || thirtySix || twentySeven || eighteen || nine;
  if (holes >= 36) return thirtySix || twentySeven || eighteen || nine;
  if (holes >= 27) return twentySeven || eighteen || nine;
  if (holes >= 18) return eighteen || nine;
  if (holes >= 9) return nine;
  return 0;
}

function getTourHistoryPrimaryScore(record) {
  if (record.hasPgaOrLpgaTourHistory !== true) return 0;

  switch (record.pgaLpgaTourHistoryType) {
    case "pga_lpga":
      return 84;
    case "pga":
      return 76;
    case "lpga":
      return 72;
    default:
      return 68;
  }
}

function getTourHistorySecondaryBonus(record) {
  if (record.hasPgaOrLpgaTourHistory !== true) return 0;

  switch (record.pgaLpgaTourHistoryType) {
    case "pga_lpga":
      return 4;
    case "pga":
      return 3;
    case "lpga":
      return 3;
    default:
      return 2;
  }
}

function getTourHistoryListScore(record) {
  return (
    getTourHistoryPrimaryScore(record) +
    getVenueScaleScore(record.holes, {
      eighteen: 10,
      twentySeven: 14,
      thirtySix: 18,
      fortyFive: 22,
      fiftyFour: 26,
    }) +
    getMetadataScore(record, {
      coordinates: 3,
      website: 2,
      address: 1,
      par: 1,
      confidenceHigh: 5,
      confidenceMedium: 3,
      confidenceLow: 1,
    })
  );
}

function getThirtySixHoleListScore(record) {
  return (
    getVenueScaleScore(record.holes, {
      thirtySix: 42,
      fortyFive: 50,
      fiftyFour: 58,
    }) +
    getMetadataScore(record, {
      coordinates: 10,
      website: 8,
      address: 4,
      phone: 1,
      par: 3,
      confidenceHigh: 8,
      confidenceMedium: 4,
      confidenceLow: 1,
    })
  );
}

function getPrivateCourseListScore(record) {
  return (
    getVenueScaleScore(record.holes, {
      eighteen: 10,
      twentySeven: 14,
      thirtySix: 18,
      fortyFive: 22,
      fiftyFour: 26,
    }) +
    getMetadataScore(record, {
      coordinates: 6,
      website: 5,
      address: 3,
      phone: 1,
      par: 3,
      confidenceHigh: 8,
      confidenceMedium: 4,
      confidenceLow: 1,
    })
  );
}

function getResortCourseListScore(record) {
  return (
    getVenueScaleScore(record.holes, {
      eighteen: 10,
      twentySeven: 15,
      thirtySix: 21,
      fortyFive: 25,
      fiftyFour: 29,
    }) +
    getMetadataScore(record, {
      coordinates: 10,
      website: 8,
      address: 3,
      phone: 1,
      par: 2,
      confidenceHigh: 8,
      confidenceMedium: 4,
      confidenceLow: 1,
    }) +
    getTourHistorySecondaryBonus(record)
  );
}

function getMunicipalCourseListScore(record) {
  return (
    getVenueScaleScore(record.holes, {
      eighteen: 10,
      twentySeven: 15,
      thirtySix: 20,
      fortyFive: 24,
      fiftyFour: 28,
    }) +
    getMetadataScore(record, {
      coordinates: 10,
      website: 6,
      address: 4,
      phone: 1,
      par: 2,
      confidenceHigh: 8,
      confidenceMedium: 4,
      confidenceLow: 1,
    })
  );
}

function getStateSpotlightScore(record) {
  return (
    getVenueScaleScore(record.holes, {
      eighteen: 10,
      twentySeven: 14,
      thirtySix: 18,
      fortyFive: 22,
      fiftyFour: 26,
    }) +
    getMetadataScore(record, {
      coordinates: 8,
      website: 6,
      address: 3,
      phone: 1,
      par: 2,
      confidenceHigh: 8,
      confidenceMedium: 4,
      confidenceLow: 1,
    }) +
    getTourHistorySecondaryBonus(record)
  );
}

function getPublicStateSpotlightScore(record) {
  return (
    getVenueScaleScore(record.holes, {
      eighteen: 10,
      twentySeven: 15,
      thirtySix: 20,
      fortyFive: 24,
      fiftyFour: 28,
    }) +
    getMetadataScore(record, {
      coordinates: 10,
      website: 6,
      address: 3,
      phone: 1,
      par: 2,
      confidenceHigh: 8,
      confidenceMedium: 4,
      confidenceLow: 1,
    })
  );
}

function getCitySpotlightScore(record) {
  return (
    getVenueScaleScore(record.holes, {
      eighteen: 10,
      twentySeven: 14,
      thirtySix: 19,
      fortyFive: 23,
      fiftyFour: 27,
    }) +
    getMetadataScore(record, {
      coordinates: 10,
      website: 7,
      address: 3,
      phone: 1,
      par: 2,
      confidenceHigh: 8,
      confidenceMedium: 4,
      confidenceLow: 1,
    })
  );
}

function getBucketListScore(record) {
  return (
    getVenueScaleScore(record.holes, {
      eighteen: 8,
      twentySeven: 12,
      thirtySix: 22,
      fortyFive: 26,
      fiftyFour: 30,
    }) +
    getMetadataScore(record, {
      coordinates: 8,
      website: 8,
      address: 3,
      phone: 1,
      par: 2,
      confidenceHigh: 8,
      confidenceMedium: 4,
      confidenceLow: 1,
    }) +
    getTourHistorySecondaryBonus(record) * 4 +
    (record.accessType === "resort" ? 18 : 0) +
    (record.accessType === "private" ? 6 : 0)
  );
}

function compareRankedRecords(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  if ((b.record.holes ?? 0) !== (a.record.holes ?? 0)) return (b.record.holes ?? 0) - (a.record.holes ?? 0);
  return a.record.name.localeCompare(b.record.name);
}

function rankRecords(records, scoreFn) {
  return records
    .map((record) => ({
      record,
      score: scoreFn(record),
    }))
    .sort(compareRankedRecords);
}

function selectRankedRecords(rankedRecords, recipe) {
  const maxTourHistoryItems = recipe.maxTourHistoryItems ?? null;
  if (maxTourHistoryItems == null) {
    return rankedRecords.slice(0, recipe.limit);
  }

  const selectedRecords = [];
  const deferredTourHistoryRecords = [];
  let selectedTourHistoryCount = 0;

  for (const rankedRecord of rankedRecords) {
    const isTourHistoryRecord = rankedRecord.record.hasPgaOrLpgaTourHistory === true;

    if (isTourHistoryRecord && selectedTourHistoryCount >= maxTourHistoryItems) {
      deferredTourHistoryRecords.push(rankedRecord);
      continue;
    }

    selectedRecords.push(rankedRecord);
    if (isTourHistoryRecord) {
      selectedTourHistoryCount += 1;
    }

    if (selectedRecords.length >= recipe.limit) {
      return selectedRecords;
    }
  }

  for (const rankedRecord of deferredTourHistoryRecords) {
    if (selectedRecords.length >= recipe.limit) {
      break;
    }

    selectedRecords.push(rankedRecord);
  }

  return selectedRecords;
}

function createListRecipe(config) {
  return config;
}

function createStateRecipe(stateCode, stateName, overrides = {}) {
  return createListRecipe({
    id: `state-${stateCode.toLowerCase()}`,
    slug: `best-courses-in-${slugify(stateName)}`,
    title: `Best courses in ${stateName}`,
    subtitle: `Weekly state spotlight for ${stateName}`,
    description: `A deterministic weekly ranking for ${stateName} built from venue scale, metadata completeness, and catalog confidence within that state only.`,
    listType: "state",
    limit: 12,
    filter: (record) => record.stateCode === stateCode,
    score: getStateSpotlightScore,
    criteriaSummary: [
      `Only includes stored catalog courses in ${stateName}`,
      "Ranks by venue scale, metadata completeness, and confidence, with only a small secondary bonus for explicit tour history",
    ],
    rationale: `This state recipe exists to keep weekly location-based editorial lists easy to expand one state at a time without letting one global score dominate every geography.`,
    maxTourHistoryItems: 2,
    ...overrides,
  });
}

function createAccessRecipe(accessType, title, subtitle, description, overrides = {}) {
  return createListRecipe({
    id: `access-${slugify(accessType)}`,
    slug: slugify(title),
    title,
    subtitle,
    description,
    listType: "access_type",
    limit: 12,
    filter: (record) => record.accessType === accessType,
    score: getPrivateCourseListScore,
    criteriaSummary: [
      `Only includes ${accessType} courses from the stored catalog`,
      "Ranks within that access type using venue scale, metadata completeness, and confidence rather than a broad global 'best courses' score",
    ],
    rationale: `This recipe gives GolfeR a deterministic editorial view for ${accessType} course discovery without inventing user sentiment.`,
    maxTourHistoryItems: 2,
    ...overrides,
  });
}

const listRecipes = [
  createListRecipe({
    id: "tour-history-hosts",
    slug: "pga-lpga-host-venues",
    title: "PGA / LPGA host venues",
    subtitle: "Courses with explicit PGA or LPGA event history in the stored catalog",
    description: "A weekly generated list of venues where the source data explicitly says PGA or LPGA Tour history exists.",
    listType: "tour_history",
    limit: 18,
    filter: (record) => record.hasPgaOrLpgaTourHistory === true,
    score: getTourHistoryListScore,
    criteriaSummary: [
      "Requires an explicit PGA / LPGA host flag in the stored catalog",
      "Ranks by tour-history type first, then venue scale and metadata completeness",
    ],
    rationale: "This list exists because tour-history metadata is one of the strongest trustworthy editorial signals currently stored in the catalog.",
  }),
  createListRecipe({
    id: "holes-36-plus",
    slug: "top-36-hole-courses",
    title: "Top 36-hole courses",
    subtitle: "Large-format venues with at least 36 holes in the stored catalog",
    description: "A weekly list for multi-course destinations and large facilities, ranked conservatively using venue scale plus other trustworthy metadata.",
    listType: "holes_count",
    limit: 12,
    filter: (record) => (record.holes ?? 0) >= 36,
    score: getThirtySixHoleListScore,
    criteriaSummary: [
      "Requires 36 or more holes in the stored catalog",
      "Ranks by venue scale first, then metadata completeness and confidence; tour-host history does not drive this list and is capped in the final selection",
    ],
    rationale: "This recipe surfaces larger golf destinations without pretending the catalog has full reviewer or pricing data.",
    maxTourHistoryItems: 2,
  }),
  createAccessRecipe(
    "private",
    "Top private courses",
    "Weekly private-club ranking from the stored catalog",
    "A deterministic private-course list built from trusted structural metadata rather than fake consumer engagement signals.",
    {
      score: getPrivateCourseListScore,
      criteriaSummary: [
        "Only includes private courses from the stored catalog",
        "Ranks within private courses using venue scale, metadata completeness, and confidence; tour history is not a primary signal here and is capped in the final selection",
      ],
      maxTourHistoryItems: 2,
    },
  ),
  createAccessRecipe(
    "resort",
    "Best resort courses",
    "Weekly resort-course ranking from the stored catalog",
    "A weekly resort-course list using travel-ready metadata, venue scale, and confidence to keep the ranking explainable.",
    {
      score: getResortCourseListScore,
      criteriaSummary: [
        "Only includes resort courses from the stored catalog",
        "Ranks by travel-ready metadata, venue scale, and confidence, with only a light tour-history bonus and a cap on host-venue overrepresentation",
      ],
      maxTourHistoryItems: 2,
    },
  ),
  createAccessRecipe(
    "municipal",
    "Best municipal courses",
    "Weekly municipal-course ranking from the stored catalog",
    "A weekly list focused on municipal courses, ranked with the same conservative metadata-first approach.",
    {
      score: getMunicipalCourseListScore,
      criteriaSummary: [
        "Only includes municipal courses from the stored catalog",
        "Ranks by venue scale, public-discovery metadata, and confidence; tour history is not a primary signal and is capped in the final selection",
      ],
      maxTourHistoryItems: 2,
    },
  ),
  createStateRecipe("WA", "Washington"),
  createStateRecipe("NY", "New York"),
  createListRecipe({
    id: "state-access-az-public",
    slug: "best-public-courses-in-arizona",
    title: "Best public courses in Arizona",
    subtitle: "Weekly public-course spotlight for Arizona",
    description: "A weekly Arizona public-course list ranked using only signals the stored catalog can actually support.",
    listType: "state",
    limit: 12,
    filter: (record) => record.stateCode === "AZ" && record.accessType === "public",
    score: getPublicStateSpotlightScore,
    criteriaSummary: [
      "Only includes Arizona public courses",
      "Ranks by venue scale, public-discovery metadata, and confidence within Arizona's public-course set, with host venues capped as a secondary factor",
    ],
    rationale: "Arizona public golf is a high-interest discovery slice, and the stored catalog has enough coverage there to support a weekly editorial list.",
    maxTourHistoryItems: 2,
  }),
  createListRecipe({
    id: "city-scottsdale",
    slug: "best-courses-in-scottsdale",
    title: "Best courses in Scottsdale",
    subtitle: "Weekly city spotlight for Scottsdale, Arizona",
    description: "A weekly Scottsdale course list that treats the city as its own discovery surface inside the broader Arizona catalog.",
    listType: "city",
    limit: 12,
    filter: (record) => normalizeString(record.city)?.toLowerCase() === "scottsdale",
    score: getCitySpotlightScore,
    criteriaSummary: [
      "Only includes courses in Scottsdale",
      "Ranks by venue scale, city-level discovery metadata, and confidence rather than a global cross-list score, with host venues capped as a secondary factor",
    ],
    rationale: "This city recipe is a v1 proof point that the generator can expand beyond state-based lists when the catalog has enough local density.",
    maxTourHistoryItems: 2,
  }),
  createListRecipe({
    id: "editorial-bucket-list",
    slug: "bucket-list-courses",
    title: "Bucket-list courses",
    subtitle: "High-signal destinations assembled from the strongest metadata in the catalog",
    description: "A weekly editorial mix of tour hosts, large-format venues, and resort destinations, built from explicit catalog signals instead of subjective reviews.",
    listType: "editorial",
    limit: 18,
    filter: (record) =>
      record.hasPgaOrLpgaTourHistory === true ||
      (record.holes ?? 0) >= 36 ||
      record.accessType === "resort",
    score: getBucketListScore,
    criteriaSummary: [
      "Includes tour hosts, resort courses, and venues with at least 36 holes",
      "Ranks by tour history, venue scale, resort/private status, confidence level, and metadata completeness",
    ],
    rationale: "This is GolfeR's first broad editorial list: a deterministic bucket-list mix built only from the strongest trusted metadata signals currently available.",
  }),
];

function materializeList(recipe, records, generatedAt) {
  const matchingRecords = records.filter(recipe.filter);
  if (matchingRecords.length === 0) return null;

  const rankedRecords = selectRankedRecords(rankRecords(matchingRecords, recipe.score), recipe);
  const orderedRecords = rankedRecords.map(({ record }) => record);

  return {
    id: recipe.id,
    slug: recipe.slug,
    title: recipe.title,
    subtitle: recipe.subtitle,
    description: recipe.description,
    listType: recipe.listType,
    generatedAt,
    refreshCadence: REFRESH_CADENCE,
    criteriaSummary: recipe.criteriaSummary,
    itemCount: orderedRecords.length,
    courseIds: orderedRecords.map((record) => record.id),
    rationale: recipe.rationale ?? null,
    courses: orderedRecords.map(buildCoursePreview),
  };
}

async function main() {
  const generatedAt = new Date().toISOString();
  const [normalizedCatalogRaw, catalogManifestRaw] = await Promise.all([
    fs.readFile(normalizedCatalogPath, "utf8"),
    fs.readFile(catalogManifestPath, "utf8"),
  ]);

  const records = JSON.parse(normalizedCatalogRaw);
  const catalogManifest = JSON.parse(catalogManifestRaw);
  const lists = listRecipes
    .map((recipe) => materializeList(recipe, records, generatedAt))
    .filter(Boolean);

  const nextCatalog = {
    generatedAt,
    refreshCadence: REFRESH_CADENCE,
    sourceCatalogImportedAt: catalogManifest.importedAt ?? null,
    listCount: lists.length,
    lists,
  };

  await fs.mkdir(storedListsDir, { recursive: true });
  await fs.mkdir(publicListsDir, { recursive: true });

  const serialized = JSON.stringify(nextCatalog, null, 2);
  await Promise.all([
    fs.writeFile(storedListsPath, serialized),
    fs.writeFile(publicListsPath, serialized),
  ]);

  console.log(
    JSON.stringify(
      {
        storedListsPath: path.relative(repoRoot, storedListsPath),
        publicListsPath: path.relative(repoRoot, publicListsPath),
        generatedAt,
        listCount: lists.length,
        titles: lists.map((list) => list.title),
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
