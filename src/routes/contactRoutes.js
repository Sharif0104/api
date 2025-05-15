const express = require("express");
const router = express.Router();
const { sendContactEmail } = require("../controllers/contactController");

// Contact Me Route
router.post("/contact", sendContactEmail);

module.exports = router;
