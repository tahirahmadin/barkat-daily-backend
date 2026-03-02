const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const progressRoutes = require('./routes/progressRoutes');
const cardsRoutes = require('./routes/cardsRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/cards', cardsRoutes);

app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbOk = dbState === 1; // 1 = connected
  res.json({
    status: 'ok',
    service: 'barkat-learn-api',
    mongodb: {
      status: dbOk ? 'connected' : 'disconnected',
      readyState: dbState, // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    },
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    ok: true,
    message: 'Backend is working',
    service: 'barkat-learn-api',
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
