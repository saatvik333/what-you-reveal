const express = require('express');
const requestIp = require('request-ip');
const path = require('path');

// Import routes
const apiRoutes = require('./routes/api');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to get IP address
app.use(requestIp.mw());

// Serve static files
app.use(express.static('public'));

// Mount API routes
app.use('/api', apiRoutes);

// Export the app for Vercel (serverless)
module.exports = app;

// Only start the server if this file is run directly
if (require.main === module) {
    app.listen(port, () => {
        console.log(`What You Reveal - Running on http://localhost:${port}`);
    });
}
