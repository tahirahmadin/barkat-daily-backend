// Vercel serverless entry: ensure MongoDB connects when the function loads, then export the app.
require('dotenv').config();
const mongoose = require('mongoose');
const { mongoUri } = require('../src/config');

if (mongoose.connection.readyState === 0) {
  mongoose.connect(mongoUri).catch((err) => {
    console.error('[MongoDB] Connection error', err);
  });
}

module.exports = require('../src/app');
