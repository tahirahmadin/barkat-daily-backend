const mongoose = require('mongoose');
const app = require('./app');
const { port, mongoUri } = require('./config');

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log('[MongoDB] Connected');
    app.listen(port, () => {
      console.log(`Barkat Reads API running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('[MongoDB] Connection error', err);
    process.exit(1);
  });
