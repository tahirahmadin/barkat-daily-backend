/**
 * Load and merge category-wise card JSON files into a single flat array.
 * Each file is an array of card objects: id, category, cardType, title, preview, content, reference?, image?
 */
const path = require('path');
const fs = require('fs');

const CATEGORY_FILES = [
  'hadis.json',
  'dua.json',
  'prophet-stories.json',
  'quran-surah.json',
  'islamic-facts.json',
];

function loadCards() {
  const dataDir = __dirname;
  const allCards = [];
  for (const file of CATEGORY_FILES) {
    const filePath = path.join(dataDir, file);
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          allCards.push(...arr);
        }
      }
    } catch (err) {
      console.error(`Failed to load ${file}:`, err.message);
    }
  }
  return allCards;
}

module.exports = { loadCards };
