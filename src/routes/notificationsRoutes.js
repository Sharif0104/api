const express = require('express');
const router = express.Router();
const { sendNotification } = require('../controllers/notificationController.js');

router.post('/send', sendNotification);

module.exports = router;