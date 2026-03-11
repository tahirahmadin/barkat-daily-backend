const express = require('express');
const router = express.Router();
const multer = require('multer');
const { signup, login, appleLogin, getMe, updateMe, uploadAvatar, deleteMe } = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /^image\/(jpeg|jpg|png|gif|webp)$/i;
    if (allowed.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only images (JPEG, PNG, GIF, WebP) are allowed'), false);
  },
});

router.post('/signup', signup);
router.post('/login', login);
router.post('/apple-login', appleLogin);

router.get('/me', authMiddleware, getMe);
router.patch('/me', authMiddleware, updateMe);
router.post('/me/avatar', authMiddleware, upload.single('avatar'), (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large (max 5MB)' });
    return res.status(400).json({ error: err.message });
  }
  if (err) return res.status(400).json({ error: err.message || 'Invalid file' });
  next();
}, uploadAvatar);
router.delete('/me', authMiddleware, deleteMe);

module.exports = router;
