const express = require('express');
const router = express.Router();
const { signup, login, appleLogin, getMe, updateMe, deleteMe } = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.post('/apple-login', appleLogin);

router.get('/me', authMiddleware, getMe);
router.patch('/me', authMiddleware, updateMe);
router.delete('/me', authMiddleware, deleteMe);

module.exports = router;
