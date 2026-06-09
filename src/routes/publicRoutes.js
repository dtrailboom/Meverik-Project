// src/routes/publicRoutes.js
const express = require('express');
const path = require('path');
const router = express.Router();
const { attachUser } = require('../middleware/auth');

router.use(attachUser);

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/pages/landing.html'));
});

module.exports = router;
