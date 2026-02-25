const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verifyAppleToken = require('verify-apple-id-token').default || require('verify-apple-id-token');
const { jwtSecret, appleClientId } = require('../config');
const User = require('../models/User');
const Progress = require('../models/Progress');
const DeletedUser = require('../models/DeletedUser');

const SALT_ROUNDS = 10;

function signToken(userId) {
  return jwt.sign({ userId }, jwtSecret, { expiresIn: '7d' });
}

async function ensureProgressForUser(userId) {
  let doc = await Progress.findOne({ user: userId });
  if (!doc) {
    doc = await Progress.create({ user: userId });
  }
  return doc;
}

async function signup(req, res) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      name: name || email.split('@')[0],
    });
    await ensureProgressForUser(user._id);

    const token = signToken(user._id.toString());
    const userObj = user.toObject();
    delete userObj.passwordHash;
    res.status(201).json({
      message: 'User created',
      token,
      user: userObj,
    });
  } catch (err) {
    console.error('[signup] error', err);
    res.status(500).json({ error: 'Signup failed' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    await ensureProgressForUser(user._id);
    const token = signToken(user._id.toString());
    const userObj = user.toObject();
    delete userObj.passwordHash;
    res.json({ token, user: userObj });
  } catch (err) {
    console.error('[login] error', err);
    res.status(500).json({ error: 'Login failed' });
  }
}

async function appleLogin(req, res) {
  try {
    const { identityToken, email: emailFromClient } = req.body || {};
    if (!identityToken) {
      return res.status(400).json({ error: 'identityToken is required' });
    }

    console.log('[appleLogin] incoming request body', {
      hasIdentityToken: !!identityToken,
      emailFromClient,
      appleClientId,
    });

    const payload = await verifyAppleToken({
      idToken: identityToken,
      clientId: appleClientId,
    });

    console.log('[appleLogin] verified Apple payload', {
      sub: payload.sub,
      email: payload.email,
      aud: payload.aud,
      iss: payload.iss,
    });

    const appleSub = payload.sub;
    const emailFromToken = payload.email;
    const email = (emailFromToken || emailFromClient || '').toLowerCase() || null;

    if (!appleSub) {
      return res.status(400).json({ error: 'Invalid Apple token: missing subject' });
    }

    let user = await User.findOne({ appleSub });
    console.log('[appleLogin] user by appleSub?', user ? user._id : null);
    if (!user && email) {
      user = await User.findOne({ email });
      console.log('[appleLogin] user by email?', user ? user._id : null);
    }

    if (!user) {
      console.log('[appleLogin] creating new user', { email, appleSub });
      user = await User.create({
        email: email || `${appleSub}@apple.local`,
        appleSub,
        name: email ? email.split('@')[0] : 'Apple User',
      });
    } else if (!user.appleSub) {
      console.log('[appleLogin] attaching appleSub to existing user', { userId: user._id });
      user.appleSub = appleSub;
      await user.save();
    }

    await ensureProgressForUser(user._id);
    console.log('[appleLogin] ensured progress for user', { userId: user._id });

    const token = signToken(user._id.toString());
    const userObj = user.toObject();
    delete userObj.passwordHash;

    console.log('[appleLogin] success, returning token for user', { userId: user._id, email: userObj.email });
    res.json({ token, user: userObj });
  } catch (err) {
    console.error('[appleLogin] error', err);
    res.status(500).json({ error: 'Apple login failed' });
  }
}

async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userObj = user.toObject();
    delete userObj.passwordHash;
    res.json(userObj);
  } catch (err) {
    console.error('[getMe] error', err);
    res.status(500).json({ error: 'Failed to get user' });
  }
}

async function updateMe(req, res) {
  try {
    const { name, age, preferences, language } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (age !== undefined) updates.age = age;
    if (Array.isArray(preferences)) updates.preferences = preferences;
    if (typeof language === 'string') updates.language = language.toLowerCase();

    const user = await User.findByIdAndUpdate(req.user.userId, updates, { new: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userObj = user.toObject();
    delete userObj.passwordHash;
    res.json(userObj);
  } catch (err) {
    console.error('[updateMe] error', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
}

async function deleteMe(req, res) {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const progress = await Progress.findOne({ user: userId });

    await DeletedUser.create({
      originalUserId: user._id,
      user: user.toObject(),
      progress: progress ? progress.toObject() : null,
      deletedAt: new Date(),
    });

    await Progress.deleteOne({ user: userId });
    await User.deleteOne({ _id: userId });

    return res.status(200).json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('[deleteMe] error', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
}

module.exports = {
  signup,
  login,
  appleLogin,
  getMe,
  updateMe,
  deleteMe,
};
