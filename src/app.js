const express = require('express');
const cors = require('cors');
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
  res.json({ status: 'ok', service: 'barkat-learn-api' });
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
