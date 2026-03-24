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
  'quotes.json',
];

// Fallback for serverless bundles where fs paths like /var/task/src/data/*.json may not exist.
// Static imports help bundlers include JSON content in the deployed artifact.
const EMBEDDED_CATEGORY_DATA = {
  'hadis.json': require('./hadis.json'),
  'dua.json': require('./dua.json'),
  'prophet-stories.json': require('./prophet-stories.json'),
  'quran-surah.json': require('./quran-surah.json'),
  'islamic-facts.json': require('./islamic-facts.json'),
  'quotes.json': require('./quotes.json'),
};

function getCardsDiagnostics() {
  const dataDir = __dirname;
  const files = CATEGORY_FILES.map((file) => {
    const filePath = path.join(dataDir, file);
    const fileInfo = {
      file,
      filePath,
      exists: false,
      cardsCount: 0,
      error: null,
    };

    try {
      if (!fs.existsSync(filePath)) {
        const embedded = EMBEDDED_CATEGORY_DATA[file];
        if (Array.isArray(embedded)) {
          fileInfo.error = 'File not found on fs; using embedded fallback';
          fileInfo.cardsCount = embedded.length;
          return fileInfo;
        }
        fileInfo.error = 'File not found';
        return fileInfo;
      }

      fileInfo.exists = true;
      const raw = fs.readFileSync(filePath, 'utf8');
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) {
        fileInfo.error = 'JSON is not an array';
        return fileInfo;
      }

      fileInfo.cardsCount = arr.length;
      return fileInfo;
    } catch (err) {
      fileInfo.error = err.message;
      return fileInfo;
    }
  });

  return {
    dataDir,
    files,
    totalCards: files.reduce((sum, f) => sum + (f.cardsCount || 0), 0),
  };
}

function loadCards() {
  const allCards = [];
  for (const file of CATEGORY_FILES) {
    const filePath = path.join(__dirname, file);
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          allCards.push(...arr);
          continue;
        }
      }
      const embedded = EMBEDDED_CATEGORY_DATA[file];
      if (Array.isArray(embedded)) {
        allCards.push(...embedded);
      }
    } catch (err) {
      const embedded = EMBEDDED_CATEGORY_DATA[file];
      if (Array.isArray(embedded)) {
        allCards.push(...embedded);
      } else {
        console.error(`Failed to load ${file}:`, err.message);
      }
    }
  }
  return allCards;
}

module.exports = {
  CATEGORY_FILES,
  loadCards,
  getCardsDiagnostics,
};
