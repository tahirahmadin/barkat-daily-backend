/**
 * In-memory store. Replace with a real DB (e.g. SQLite, PostgreSQL) for production.
 * Cards: merged from category-wise JSON files. Progress: keyed by fixed user (tahir@sayy.ai).
 */
const users = new Map();       // userId -> { id, email, ... }
const progress = new Map();    // userId -> { learnedCardIds, savedCardIds, stats, lastLearningDate }
const { loadCards } = require('../data/loadCards');
const { fixedUserEmail } = require('../config');

let cachedCards = null;

function getNextId(prefix) {
  const existing = [...users.keys(), ...progress.keys()];
  let n = 1;
  while (existing.includes(`${prefix}_${n}`)) n++;
  return `${prefix}_${n}`;
}

function getUserByEmail(email) {
  return [...users.values()].find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

function getUserById(userId) {
  return users.get(userId) || null;
}

/** Returns the fixed user id for tahir@sayy.ai (creates user and progress if needed). */
function getFixedUserId() {
  let user = getUserByEmail(fixedUserEmail);
  if (!user) {
    const id = getNextId('user');
    user = {
      id,
      email: fixedUserEmail.toLowerCase(),
      name: fixedUserEmail.split('@')[0],
      createdAt: new Date().toISOString(),
    };
    users.set(id, user);
    progress.set(id, {
      learnedCardIds: [],
      savedCardIds: [],
      stats: { cardsLearned: 0, streakDays: 0, lastLearningDate: null, topicsFollowed: 0 },
      lastLearningDate: null,
    });
  }
  return user.id;
}

function createUser({ email, passwordHash, name, preferences = [] }) {
  const id = getNextId('user');
  const user = {
    id,
    email: email.toLowerCase(),
    passwordHash,
    name: name || email.split('@')[0],
    createdAt: new Date().toISOString(),
    preferences: preferences || [],
  };
  users.set(id, user);
  progress.set(id, {
    learnedCardIds: [],
    savedCardIds: [],
    stats: { cardsLearned: 0, streakDays: 0, topicsFollowed: preferences?.length || 0 },
    lastLearningDate: null,
  });
  return user;
}

function getProgress(userId) {
  return progress.get(userId) || null;
}

function updateProgress(userId, updates) {
  let p = progress.get(userId);
  if (!p) {
    p = {
      learnedCardIds: [],
      savedCardIds: [],
      stats: { cardsLearned: 0, streakDays: 0, topicsFollowed: 0 },
      lastLearningDate: null,
    };
    progress.set(userId, p);
  }
  if (updates.learnedCardIds !== undefined) p.learnedCardIds = [...new Set(updates.learnedCardIds)];
  if (updates.savedCardIds !== undefined) p.savedCardIds = [...new Set(updates.savedCardIds)];
  if (updates.stats !== undefined) p.stats = { ...p.stats, ...updates.stats };
  if (updates.lastLearningDate !== undefined) p.lastLearningDate = updates.lastLearningDate;
  return p;
}

function getAllCards() {
  if (!cachedCards) cachedCards = loadCards();
  return cachedCards;
}

function getCardById(cardId) {
  const cards = getAllCards();
  return cards.find((c) => c.id === cardId) || null;
}

module.exports = {
  users,
  progress,
  getNextId,
  getUserByEmail,
  getUserById,
  getFixedUserId,
  createUser,
  getProgress,
  updateProgress,
  getAllCards,
  getCardById,
};
