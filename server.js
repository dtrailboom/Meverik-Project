require('dotenv').config();
const express = require('express');
const path = require('path');
const connectDB = require('./src/config/db');
const sessionConfig = require('./src/config/session');

const app = express();

// Connect to MongoDB
connectDB();

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Sessions
app.use(sessionConfig);

// View engine — serving plain HTML files
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/', require('./src/routes/publicRoutes'));
app.use('/auth', require('./src/routes/authRoutes'));
app.use('/portal', require('./src/routes/portalRoutes'));
app.use('/admin', require('./src/routes/adminRoutes'));
app.use('/webhooks', require('./src/routes/webhookRoutes'));

// 404 handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'views/pages/404.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Meverik running on http://localhost:${PORT}`);
});

module.exports = app;
