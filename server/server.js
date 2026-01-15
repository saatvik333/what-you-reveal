const express = require('express');
const requestIp = require('request-ip');
const path = require('path');

// Import routes
const apiRoutes = require('./routes/api');

const compression = require('compression');

// ... (imports)

const app = express();
const port = process.env.PORT || 3000;

// Enable Gzip/Brotli compression
app.use(compression());

// Middleware to get IP address
app.use(requestIp.mw());

// Serve static files from 'dist' (Vite build output)
app.use(express.static(path.join(__dirname, '../dist')));

// Mount API routes
app.use('/api', apiRoutes);

// Export the app for Vercel (serverless)
module.exports = app;

const packageJson = require('../package.json');

// Only start the server if this file is run directly
if (require.main === module) {
  app.listen(port, () => {
    console.log(`What You Reveal v${packageJson.version} - Running on http://localhost:${port}`); // eslint-disable-line no-console
  });
}
