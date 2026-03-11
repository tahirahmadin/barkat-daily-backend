const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/cardsController');
const { authMiddleware } = require('../middleware/auth');

// Public: fetch all cards (no auth required)
router.get('/', getAllCards);

// Feed and category now personalised by user bookmarks
router.get('/feed', authMiddleware, getFeedacards);
router.get('/category/:category', authMiddleware, getCardsByCategory);
router.get('/category/:category/completed', authMiddleware, getCompletedCardsByCategory);
// Slug-based route for completed cards (use slug from library API: e.g. /quran-surah/completed)
router.get('/:slug/completed', authMiddleware, getCompletedCardsByCategory);

// Protected: saved cards and save/unsave (legacy aliases for bookmarks)
router.get('/saved', authMiddleware, getSavedCards);
router.post('/saved', authMiddleware, saveCard);
router.delete('/saved', authMiddleware, unsaveCard);

// Protected: bookmark APIs
router.get('/bookmarks', authMiddleware, getBookmarkedCards);
router.post('/bookmarks', authMiddleware, addBookmark);
router.delete('/bookmarks', authMiddleware, removeBookmark);

module.exports = router;
