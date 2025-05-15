const express = require('express');
const { getMinecraftStatus } = require('../controllers/minecraftController');

const router = express.Router();

router.get('/', getMinecraftStatus);

module.exports = router;