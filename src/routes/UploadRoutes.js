const express = require("express");
const router = express.Router();

const { upload, uploadFile, publicUpload, uploadPublicFile, uploadTypedFile } = require("../controllers/UploadController");
const auth = require("../middleware/auth");

// Public upload: saves to uploads/public, no auth required
router.post('/public', publicUpload.single('file'), uploadPublicFile);

// Private upload: saves to uploads/files, requires auth and supports secure parameters
router.post('/', auth, upload.single('file'), uploadTypedFile);

module.exports = router;