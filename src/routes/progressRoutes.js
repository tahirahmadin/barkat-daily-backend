const express = require('express');
const router = express.Router();
const {
    getProgress,
    getLearned,
    updateProgress,
    markCardFinished,
    getStatsByCategory,
} = require('../controllers/progressController');
const { authMiddleware } = require('../middleware/auth');

// Authenticated user: progress is per JWT userId
router.use(authMiddleware);

// Full progress snapshot
router.get('/', getProgress);
router.patch('/', updateProgress);
router.put('/', updateProgress);

// Learned cards (completed)
router.get('/learned', getLearned);
router.post('/learned', markCardFinished); // alias for marking a card as learned

// Stats per category
router.get('/user-progress-stats', getStatsByCategory);

// Legacy alias
router.post('/card-finished', markCardFinished);

module.exports = router;
