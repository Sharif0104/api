const prisma = require('../utils/prisma');
const bcrypt = require('bcrypt');
const auditLogger = require('../utils/auditLogger');
const hashPassword = require('../utils/hashPassword');

// Helper: select only needed fields for user
const userSelect = {
  id: true,
  email: true,
  name: true,
  roles: true, // <-- Fix: use roles instead of role
  createdAt: true,
  emailVerified: true,
  bookings: {
    select: {
      date: true,
      hour: true,
      shop: {
        select: {
          name: true,
          location: true,
        },
      },
    },
  },
  inventories: true
};

// Function to retrieve all users along with their bookings
exports.getAllUsers = async (req, res, next) => {
    try {
      // Pagination
      const page = parseInt(req.query.page, 10) || 1;
      const pageSize = parseInt(req.query.pageSize, 10) || 10;
      const skip = (page - 1) * pageSize;
      const filter = {};
      if (req.query.name) filter.name = { contains: req.query.name, mode: 'insensitive' };
      if (req.query.email) filter.email = { contains: req.query.email, mode: 'insensitive' };
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          skip,
          take: pageSize,
          where: filter,
          select: userSelect
        }),
        prisma.user.count({ where: filter })
      ]);
      res.json({ users, total, page, pageSize });
    } catch (e) {
      res.status(500).json({ message: 'Failed to retrieve users.' });
    }
};
  
// Function to retrieve a specific user by ID
exports.getUserById = async (req, res, next) => {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) return res.status(400).json({ message: 'Invalid user ID' });
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: userSelect
      });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json(user);
    } catch (e) {
      res.status(500).json({ message: 'Failed to retrieve user.' });
    }
};

// Function to delete a user by ID
exports.deleteUser = async (req, res, next) => {
    try {
      const { id } = req.params;
      await prisma.user.delete({
        where: { id: parseInt(id) }
      });
      auditLogger.info({
        action: 'deleteUser',
        performedBy: req.user ? req.user.id : 'system',
        targetUser: id,
        timestamp: new Date().toISOString(),
        ip: req.ip
      });
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      next(error);
    }
};

// Function to update user details
exports.updateUser = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { email, name, password } = req.body;
      let data = {};
      if (email) data.email = email;
      if (name) data.name = name;
      if (password) data.password = await hashPassword(password);
      const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data,
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          emailVerified: true
        }
      });
      auditLogger.info({
        action: 'updateUser',
        performedBy: req.user ? req.user.id : 'system',
        targetUser: id,
        timestamp: new Date().toISOString(),
        ip: req.ip,
        changes: { email, name, password: !!password }
      });
      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
};

// Function to create a new user
exports.createUser = async (req, res, next) => {
    try {
      const { email, name, password } = req.body;
      if (!email || !name || !password) {
        return res.status(400).json({ message: 'Email, name, and password are required' });
      }
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ message: 'Email already in use' });
      }
      const hashedPassword = await hashPassword(password);
      const newUser = await prisma.user.create({
        data: { email, name, password: hashedPassword },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          emailVerified: true
        }
      });
      auditLogger.info({
        action: 'createUser',
        performedBy: req.user ? req.user.id : 'system',
        targetUser: newUser.id,
        timestamp: new Date().toISOString(),
        ip: req.ip
      });
      res.status(201).json(newUser);
    } catch (error) {
      next(error);
    }
};