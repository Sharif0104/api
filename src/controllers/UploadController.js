const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = require('../utils/prisma');
const crypto = require('crypto');

const createDirectoryIfNotExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads', 'files');
    createDirectoryIfNotExists(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const newFilename = unique + path.extname(file.originalname);
    cb(null, newFilename);
  }
});

const upload = multer({ storage });

// Middleware to handle file uploads
exports.upload = upload;

// Function to upload a file
exports.uploadFile = (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send({ message: 'No file uploaded' });
  }
  // Construct public URL for private file access
  const publicUrl = `${req.protocol}://${req.get('host')}/uploads/files/${file.filename}`;
  res.status(200).send({
    message: 'File uploaded successfully',
    filePath: file.path, // keep for internal reference
    url: publicUrl,
    originalName: file.originalname
  });
};

// Function to retrieve a file by its name
exports.getFile = (req, res) => {
  const fileName = req.params.filename;
  const filePath = path.join(__dirname, '../../uploads', 'files', fileName);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send({ message: 'File not found' });
  }
};

// Private upload with type (e.g., avatar, document, facebook, google)
exports.uploadTypedFile = async (req, res) => {
  const file = req.file;
  const { type } = req.body; // Accept type from form-data
  if (!file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  if (!type) {
    return res.status(400).json({ message: 'Type is required (e.g., avatar, document, facebook, google)' });
  }
  // Generate a secure random access token
  const accessToken = crypto.randomBytes(32).toString('hex');
  const dbEntry = await prisma.upload.create({
    data: {
      type,
      path: file.path,
      originalName: file.originalname,
      accessToken,
    },
  });
  // Construct public URL for private file access
  const publicUrl = `${req.protocol}://${req.get('host')}/uploads/files/${file.filename}`;
  res.status(201).json({
    message: `${type} uploaded successfully`,
    fileId: dbEntry.id,
    path: dbEntry.path,
    originalName: dbEntry.originalName,
    accessToken: dbEntry.accessToken,
    secureUrl: `/api/v1/upload/secure/${dbEntry.id}?token=${dbEntry.accessToken}`,
    url: publicUrl
  });
};

exports.deleteFile = async (req, res) => {
  const { fileId } = req.params;

  try {
    const file = await prisma.upload.findUnique({ where: { id: fileId } });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Delete file from filesystem
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Delete from DB
    await prisma.upload.delete({ where: { id: fileId } });

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Multer storage for public uploads
const publicStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/public');
    createDirectoryIfNotExists(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const newFilename = unique + path.extname(file.originalname);
    cb(null, newFilename);
  }
});

const publicUpload = multer({ storage: publicStorage });
exports.publicUpload = publicUpload;

// Public upload handler
exports.uploadPublicFile = (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send({ message: 'No file uploaded' });
  }
  // Construct public URL for public file access
  const publicUrl = `${req.protocol}://${req.get('host')}/uploads/public/${file.filename}`;
  res.status(200).send({
    message: 'Public file uploaded successfully',
    filePath: path.join('uploads/public', file.filename),
    url: publicUrl,
    originalName: file.originalname
  });
};

// Secure file download
exports.getSecureFile = async (req, res) => {
  const { id } = req.params;
  const { token } = req.query;
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }
  const file = await prisma.upload.findUnique({ where: { id } });
  if (!file || file.accessToken !== token) {
    return res.status(403).json({ message: 'Invalid or expired access token' });
  }
  if (!fs.existsSync(file.path)) {
    return res.status(404).json({ message: 'File not found' });
  }
  res.sendFile(path.resolve(file.path));
};