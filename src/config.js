require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'barkat-learn-dev-secret',
  nodeEnv: process.env.NODE_ENV || 'development',
  fixedUserEmail: process.env.FIXED_USER_EMAIL || 'tahir@sayy.ai',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/barkat-learn',
  appleClientId: process.env.APPLE_CLIENT_ID || 'com.barkat.reads', // iOS bundle ID by default
};
