/**
 * Library category display config.
 * Change image URLs here to update category tiles in the library.
 * Keys must match category names in lowercase (e.g. "hadis", "dua", "prophet stories").
 * When you add a new category (e.g. a new JSON in loadCards.js), add its image here too.
 */
const DEFAULT_LIBRARY_IMAGE =
  'https://cdn3d.iconscout.com/3d/premium/thumb/muslim-man-pray-in-ramadan-3d-icon-png-download-4210570.png';

const CATEGORY_IMAGES = {
  hadis: 'https://cdn3d.iconscout.com/3d/premium/thumb/quran-book-open-3d-icon-png-download-8769934.png',
  dua: DEFAULT_LIBRARY_IMAGE,
  'prophet stories': 'https://cdn3d.iconscout.com/3d/premium/thumb/muhammad-calligraphy-3d-icon-png-download-8966966.png',
  'quran surah': 'https://cdn3d.iconscout.com/3d/premium/thumb/al-quran-3d-icon-png-download-6430981.png?f=webp',
  'islamic facts': 'https://cdn3d.iconscout.com/3d/premium/thumb/islamic-mosque-3d-icon-png-download-6578698.png',
  quotes: 'https://cdn3d.iconscout.com/3d/premium/thumb/halal-3d-icon-png-download-6479244.png',
  uncategorised: DEFAULT_LIBRARY_IMAGE,
};

/** Display names for library categories. Keys = slug (lowercase). Add new categories here when you add JSON in loadCards.js */
const CATEGORY_DISPLAY_NAMES = {
  hadis: 'Hadis',
  dua: 'Dua',
  'prophet stories': 'Prophet Stories',
  'quran surah': 'Quran Surah',
  'islamic facts': 'Islamic Facts',
  quotes: 'Quotes',
  uncategorised: 'Uncategorised',
};

/** Background colors for library category cards. Keys lowercase. */
const CATEGORY_BACKGROUND_COLORS = {
  hadis: '#0d9488',
  dua: '#8B6F47',
  'prophet stories': '#7C3AED',
  'quran surah': '#2C5F7A',
  'islamic facts': '#D97706',
  quotes: '#5B7C99',
  uncategorised: '#64748b',
};

/**
 * Get image URL for a category key (lowercase). Falls back to DEFAULT_LIBRARY_IMAGE if not set.
 */
function getCategoryImage(categoryKey) {
  const key = (categoryKey || 'uncategorised').toLowerCase().trim();
  return CATEGORY_IMAGES[key] || DEFAULT_LIBRARY_IMAGE;
}

/**
 * Get background color for a category key (lowercase). Falls back to grey if not set.
 */
function getCategoryBackgroundColor(categoryKey) {
  const key = (categoryKey || 'uncategorised').toLowerCase().trim();
  return CATEGORY_BACKGROUND_COLORS[key] || '#64748b';
}

/**
 * Get display name for a category slug (lowercase). Falls back to title-cased slug if not in config.
 */
function getCategoryDisplayName(categoryKey) {
  const key = (categoryKey || 'uncategorised').toLowerCase().trim();
  if (CATEGORY_DISPLAY_NAMES[key]) return CATEGORY_DISPLAY_NAMES[key];
  return key.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Get URL-safe slug from category key (e.g. "quran surah" -> "quran-surah"). Use in paths like /quran-surah/completed.
 */
function getSlugFromCategoryKey(categoryKey) {
  const key = (categoryKey || 'uncategorised').toLowerCase().trim();
  return key.replace(/\s+/g, '-');
}

/**
 * Get category key from URL slug (e.g. "quran-surah" -> "quran surah") for matching card.category.
 */
function categoryKeyFromSlug(slug) {
  if (slug == null || typeof slug !== 'string') return 'uncategorised';
  return slug.toLowerCase().replace(/-/g, ' ').trim();
}

/** Icons for overview stats (streak, consumed/learnt, topic). Use in library/dashboard UI. */
const OVERVIEW_ICONS = {
  streak: 'https://cdn3d.iconscout.com/3d/premium/thumb/fire-flame-3d-icon-png-download-8769935.png',
  consumed: 'https://cdn3d.iconscout.com/3d/premium/thumb/knowledge-3d-icon-png-download-6308128.png',
  topic: 'https://cdn3d.iconscout.com/3d/premium/thumb/folder-3d-icon-png-download-8769936.png',
};

module.exports = {
  DEFAULT_LIBRARY_IMAGE,
  CATEGORY_IMAGES,
  CATEGORY_BACKGROUND_COLORS,
  CATEGORY_DISPLAY_NAMES,
  OVERVIEW_ICONS,
  getCategoryImage,
  getCategoryBackgroundColor,
  getCategoryDisplayName,
  getSlugFromCategoryKey,
  categoryKeyFromSlug,
};
