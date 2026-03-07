const store = require('../store');
const Progress = require('../models/Progress');
const { ensureProgress } = require('./progressController');

function categoryMatches(cardCategory, paramCategory) {
  return (cardCategory || '').toLowerCase() === (paramCategory || '').toLowerCase();
}

function getAllCards(req, res) {
  try {
    const cards = store.getAllCards();
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
}

async function getFeedacards(req, res) {
  try {
    const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 10, 100));
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

    const progress = await ensureProgress(req.user.userId);
    const learnedIds = Array.isArray(progress.learnedByCategory)
      ? progress.learnedByCategory.flatMap((c) => c.cardIds || [])
      : [];
    const savedIds = Array.isArray(progress.savedCardIds) ? progress.savedCardIds : [];

    const learnedSet = new Set(learnedIds);
    const savedSet = new Set(savedIds);

    // Only cards that are NOT yet learned
    const allUnlearned = store.getAllCards().filter((card) => !learnedSet.has(card.id));
    const items = allUnlearned.slice(offset, offset + limit);

    const itemsWithFlags = items.map((card) => ({
      ...card,
      isBookmarked: savedSet.has(card.id),
    }));

    res.json({
      items: itemsWithFlags,
      total: allUnlearned.length,
      limit,
      offset,
      hasMore: offset + limit < allUnlearned.length,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch feed cards' });
  }
}

async function getCardsByCategory(req, res) {
  try {
    const category = req.params.category || req.query.category;
    if (!category) {
      return res.status(400).json({ error: 'category is required' });
    }

    const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 10, 100));
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

    const progress = await ensureProgress(req.user.userId);
    const learnedIds = Array.isArray(progress.learnedByCategory)
      ? progress.learnedByCategory.flatMap((c) => c.cardIds || [])
      : [];
    const savedIds = Array.isArray(progress.savedCardIds) ? progress.savedCardIds : [];

    const learnedSet = new Set(learnedIds);
    const savedSet = new Set(savedIds);

    // All cards in this category, ordered: unread first, then read
    const allInCategory = store.getAllCards().filter((card) => categoryMatches(card.category, category));
    const sorted = [...allInCategory].sort((a, b) => {
      const aRead = learnedSet.has(a.id) ? 1 : 0;
      const bRead = learnedSet.has(b.id) ? 1 : 0;
      return aRead - bRead; // 0 (unread) before 1 (read)
    });

    const items = sorted.slice(offset, offset + limit);
    const itemsWithFlags = items.map((card) => ({
      ...card,
      isBookmarked: savedSet.has(card.id),
      isLearned: learnedSet.has(card.id),
    }));

    res.json({
      items: itemsWithFlags,
      total: sorted.length,
      limit,
      offset,
      category,
      hasMore: offset + limit < sorted.length,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cards by category' });
  }
}

function getSavedCards(req, res) {
  return getBookmarkedCards(req, res);
}

function saveCard(req, res) {
  return addBookmark(req, res);
}

function unsaveCard(req, res) {
  return removeBookmark(req, res);
}

async function getBookmarkedCards(req, res) {
  try {
    const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 10, 100));
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

    const doc = await ensureProgress(req.user.userId);
    const savedIds = Array.isArray(doc.savedCardIds) ? doc.savedCardIds : [];
    const allCards = savedIds.map((id) => store.getCardById(id)).filter(Boolean);
    const items = allCards.slice(offset, offset + limit);

    res.json({
      items,
      total: allCards.length,
      limit,
      offset,
      hasMore: offset + limit < allCards.length,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookmarked cards' });
  }
}

async function addBookmark(req, res) {
  try {
    const { cardId } = req.body;
    if (!cardId) {
      return res.status(400).json({ error: 'cardId is required' });
    }
    const found = store.getCardById(cardId);
    if (!found) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const doc = await ensureProgress(req.user.userId);
    if (!Array.isArray(doc.savedCardIds)) doc.savedCardIds = [];

    const savedIds = doc.savedCardIds;

    if (savedIds.includes(cardId)) {
      return res.json({
        message: 'Already bookmarked',
        savedCardIds: savedIds,
      });
    }

    doc.savedCardIds.push(cardId);
    await doc.save();

    res.json({
      message: 'Card bookmarked',
      savedCardIds: doc.savedCardIds,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to bookmark card' });
  }
}

async function removeBookmark(req, res) {
  try {
    const { cardId } = req.body;
    if (!cardId) {
      return res.status(400).json({ error: 'cardId is required' });
    }

    const doc = await ensureProgress(req.user.userId);
    const savedIds = Array.isArray(doc.savedCardIds) ? doc.savedCardIds : [];
    const updatedIds = savedIds.filter((id) => id !== cardId);
    doc.savedCardIds = updatedIds;
    await doc.save();

    res.json({
      message: 'Card removed from bookmarks',
      savedCardIds: doc.savedCardIds,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove bookmark' });
  }
}

async function getCompletedCardsByCategory(req, res) {
  try {
    const category = req.params.category || req.query.category;
    if (!category) {
      return res.status(400).json({ error: 'category is required' });
    }

    const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 10, 100));
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

    const progress = await ensureProgress(req.user.userId);
    const learnedIds = Array.isArray(progress.learnedByCategory)
      ? progress.learnedByCategory.flatMap((c) => c.cardIds || [])
      : [];
    const learnedSet = new Set(learnedIds);

    const allInCategory = store.getAllCards().filter((card) => categoryMatches(card.category, category));
    const completedInCategory = allInCategory.filter((card) => learnedSet.has(card.id));
    const items = completedInCategory.slice(offset, offset + limit);

    res.json({
      items,
      total: completedInCategory.length,
      limit,
      offset,
      category,
      hasMore: offset + limit < completedInCategory.length,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch completed cards by category' });
  }
}

module.exports = {
  getAllCards,
  getFeedacards,
  getCardsByCategory,
  getSavedCards,
  saveCard,
  unsaveCard,
  getBookmarkedCards,
  addBookmark,
  removeBookmark,
  getCompletedCardsByCategory,
};
