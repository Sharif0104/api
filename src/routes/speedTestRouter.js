const express = require('express');
const router = express.Router();
const { runSpeedTest } = require('../controllers/speedTestController');

router.post('/test', runSpeedTest);

module.exports = router;