const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = require('../utils/prisma');

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
  const filePath = path.join(__dirname, '../../uploads', 'files', file.filename);
  res.status(200).send({
    message: 'File uploaded successfully',
    filePath: filePath,
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

exports.uploadTypedFile = async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const fileType = req.url.includes('/avatar') ? 'avatar' : 'document';
  const dbEntry = await prisma.upload.create({
    data: {
      type: fileType,
      path: file.path,
      originalName: file.originalname,
    },
  });

  res.status(201).json({
    message: `${fileType} uploaded successfully`,
    fileId: dbEntry.id,
    path: dbEntry.path,
    originalName: dbEntry.originalName,
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