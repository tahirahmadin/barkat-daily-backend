const Progress = require('../models/Progress');
const store = require('../store');

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function getYesterdayDateString() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

async function ensureProgress(userId) {
  let doc = await Progress.findOne({ user: userId });
  if (!doc) {
    console.log('[ensureProgress] creating progress for user', { userId });
    doc = await Progress.create({ user: userId });
  }
  console.log('[ensureProgress] loaded progress', { userId, id: doc._id });
  return doc;
}

async function getProgress(req, res) {
  try {
    console.log('[getProgress] for user', { userId: req.user.userId });
    const data = await ensureProgress(req.user.userId);

    const learnedCardIds =
      Array.isArray(data.learnedByCategory)
        ? Array.from(
            new Set(
              data.learnedByCategory.flatMap((entry) => entry.cardIds || [])
            )
          )
        : [];
    res.json({
      learnedCardIds,
      learnedByCategory: data.learnedByCategory || [],
      savedCardIds: data.savedCardIds || [],
      stats: data.stats || { cardsLearned: 0, streakDays: 0, lastLearningDate: null, topicsFollowed: 0 },
      lastLearningDate: data.lastLearningDate ?? null,
    });
  } catch (err) {
    console.error('[getProgress] error', err);
    res.status(500).json({ error: 'Failed to get progress' });
  }
}

async function getLearned(req, res) {
  try {
    console.log('[getLearned] for user', { userId: req.user.userId });
    const data = await ensureProgress(req.user.userId);

    const learnedCardIds =
      Array.isArray(data.learnedByCategory)
        ? Array.from(
            new Set(
              data.learnedByCategory.flatMap((entry) => entry.cardIds || [])
            )
          )
        : [];

    res.json({
      learnedCardIds,
      learnedByCategory: data.learnedByCategory || [],
    });
  } catch (err) {
    console.error('[getLearned] error', err);
    res.status(500).json({ error: 'Failed to get learned cards' });
  }
}

async function updateProgress(req, res) {
  try {
    const {
      learnedByCategory,
      savedCardIds,
      stats,
      lastLearningDate,
    } = req.body;
    console.log('[updateProgress] incoming body', {
      userId: req.user.userId,
      learnedCount: learnedByCategory?.reduce(
        (acc, entry) => acc + (entry.cardIds?.length || 0),
        0
      ),
      savedCount: savedCardIds?.length,
    });
    const doc = await ensureProgress(req.user.userId);

    if (Array.isArray(learnedByCategory)) doc.learnedByCategory = learnedByCategory;
    if (Array.isArray(savedCardIds)) doc.savedCardIds = savedCardIds;
    if (stats && typeof stats === 'object') doc.stats = { ...doc.stats.toObject?.() ?? doc.stats, ...stats };
    if (lastLearningDate !== undefined) doc.lastLearningDate = lastLearningDate;

    await doc.save();

    const learnedCardIds =
      Array.isArray(doc.learnedByCategory)
        ? Array.from(
            new Set(
              doc.learnedByCategory.flatMap((entry) => entry.cardIds || [])
            )
          )
        : [];

    res.json({
      learnedCardIds,
      learnedByCategory: doc.learnedByCategory || [],
      savedCardIds: doc.savedCardIds || [],
      stats: doc.stats,
      lastLearningDate: doc.lastLearningDate,
    });
  } catch (err) {
    console.error('[updateProgress] error', err);
    res.status(500).json({ error: 'Failed to update progress' });
  }
}

async function markCardFinished(req, res) {
  try {
    console.log('[markCardFinished] start', {
      userId: req.user?.userId,
      body: req.body,
    });

    const { cardId } = req.body || {};

    if (!cardId) {
      console.warn('[markCardFinished] missing cardId in body', { body: req.body });
      return res.status(400).json({ error: 'cardId is required' });
    }

    const card = store.getCardById(cardId);
    if (!card) {
      console.warn('[markCardFinished] card not found in store', { cardId });
      return res.status(404).json({ error: 'Card not found' });
    }

    const doc = await ensureProgress(req.user.userId);
    console.log('[markCardFinished] loaded progress before update', {
      userId: req.user.userId,
      progressId: doc._id,
      learnedByCategoryCount: Array.isArray(doc.learnedByCategory)
        ? doc.learnedByCategory.length
        : 0,
      cardsLearnedStat: doc.stats?.cardsLearned,
    });

    if (!doc.stats || typeof doc.stats !== 'object') {
      doc.stats = {
        cardsLearned: 0,
        streakDays: 0,
        lastLearningDate: null,
        topicsFollowed: 0,
      };
    }

    if (!Array.isArray(doc.learnedByCategory)) {
      doc.learnedByCategory = [];
    }

    const alreadyLearned = doc.learnedByCategory.some((entry) =>
      Array.isArray(entry.cardIds) ? entry.cardIds.includes(cardId) : false
    );

    if (!alreadyLearned) {
      doc.stats.cardsLearned = (doc.stats.cardsLearned || 0) + 1;
      console.log('[markCardFinished] added new learned card', {
        userId: req.user.userId,
        cardId,
        newLearnedCount: doc.stats.cardsLearned,
        newCardsLearnedStat: doc.stats.cardsLearned,
      });
    } else {
      console.log('[markCardFinished] card already learned, not incrementing', {
        userId: req.user.userId,
        cardId,
      });
    }

    const category = card.category || 'uncategorised';
    const existingCategory = doc.learnedByCategory.find((c) => c.category === category);
    if (existingCategory) {
      if (!existingCategory.cardIds.includes(cardId)) {
        existingCategory.cardIds.push(cardId);
      }
    } else {
      doc.learnedByCategory.push({
        category,
        cardIds: [cardId],
      });
    }

    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();
    const lastDate = (doc.stats.lastLearningDate || '').toString().slice(0, 10);

    // Streak: first learning day => 1; yesterday => increment; gap => reset to 1; same day => keep or set 1
    if (!lastDate) {
      doc.stats.streakDays = 1; // First time: at least 1 day done
    } else if (lastDate === yesterday) {
      doc.stats.streakDays = (doc.stats.streakDays || 0) + 1;
    } else if (lastDate !== today) {
      doc.stats.streakDays = 1; // Gap: reset to 1
    } else {
      // Same day: ensure at least 1 if they have activity today (fixes existing docs with streak 0)
      if (doc.stats.streakDays == null || doc.stats.streakDays === 0) {
        doc.stats.streakDays = 1;
      }
    }
    doc.lastLearningDate = today;
    doc.stats.lastLearningDate = today;

    console.log('[markCardFinished] about to save progress', {
      userId: req.user.userId,
      progressId: doc._id,
      learnedByCategoryCount: doc.learnedByCategory.length,
      stats: doc.stats,
    });

    const saved = await doc.save();

    console.log('[markCardFinished] saved progress', {
      userId: req.user.userId,
      progressId: saved._id,
      learnedByCategoryCount: saved.learnedByCategory?.length,
      stats: saved.stats,
      lastLearningDate: saved.lastLearningDate,
    });

    const learnedCardIds =
      Array.isArray(doc.learnedByCategory)
        ? Array.from(
            new Set(
              doc.learnedByCategory.flatMap((entry) => entry.cardIds || [])
            )
          )
        : [];

    return res.json({
      learnedCardIds,
      learnedByCategory: doc.learnedByCategory || [],
      savedCardIds: doc.savedCardIds || [],
      stats: doc.stats,
      lastLearningDate: doc.lastLearningDate,
    });
  } catch (err) {
    console.error('[markCardFinished] error', err);
    res.status(500).json({ error: 'Failed to mark card as finished' });
  }
}

async function getStatsByCategory(req, res) {
  try {
    console.log('[getStatsByCategory] for user', { userId: req.user.userId });
    const data = await ensureProgress(req.user.userId);

    const learnedMap = new Map();
    const allLearnedIds = new Set();
    if (Array.isArray(data.learnedByCategory)) {
      for (const entry of data.learnedByCategory) {
        const category = entry.category || 'uncategorised';
        const set = learnedMap.get(category) || new Set();
        for (const id of entry.cardIds || []) {
          set.add(id);
          allLearnedIds.add(id);
        }
        learnedMap.set(category, set);
      }
    }
    const consumed = allLearnedIds.size;
    const streak = (data.stats && data.stats.streakDays != null) ? data.stats.streakDays : 0;
    const topic = learnedMap.size; // Count of categories with at least one learned card

    const allCards = store.getAllCards();
    const categories = {};

    for (const card of allCards) {
      const key = (card.category || 'uncategorised').toLowerCase();
      if (!categories[key]) {
        categories[key] = { total: 0, completed: 0 };
      }
      categories[key].total += 1;
    }

    for (const [category, set] of learnedMap.entries()) {
      const key = (category || 'uncategorised').toLowerCase();
      if (!categories[key]) {
        categories[key] = { total: 0, completed: 0 };
      }
      categories[key].completed = set.size;
    }

    res.json({
      overview: { streak, consumed, topic },
      categories,
    });
  } catch (err) {
    console.error('[getStatsByCategory] error', err);
    res.status(500).json({ error: 'Failed to get stats by category' });
  }
}

module.exports = {
  ensureProgress,
  getProgress,
  getLearned,
  updateProgress,
  markCardFinished,
  getStatsByCategory,
};
