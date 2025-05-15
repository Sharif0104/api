const express = require('express');
const { searchResources } = require('../controllers/searchController');

const router = express.Router();

// Search endpoint
router.get('/search', searchResources);

module.exports = router;
