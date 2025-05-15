const prisma = require('../utils/prisma');
const bcrypt = require('bcrypt');

// Function to retrieve all users along with their bookings
exports.getAllUsers = async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        include: {
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
        },
      });
      res.json(users);
    } catch (e) {
      console.error("Error fetching users with bookings:", e);
      res.status(500).json({ error: "Failed to fetch users" });
    }
};
  
// Function to retrieve a specific user by ID
exports.getUserById = async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
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
        },
      });
  
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (e) {
      console.error("Error fetching user with bookings:", e);
      res.status(500).json({ error: "Failed to fetch user" });
    }
};

// Function to delete a user by ID
exports.deleteUser = async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.user.delete({
        where: { id: parseInt(id) }
      });
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(400).json({ message: "Failed to delete user" });
    }
};

// Function to update user details
exports.updateUser = async (req, res) => {
    try {
      const { id } = req.params;
      const { email, name, password } = req.body;
  
      const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data: {
          ...(email && { email }),
          ...(name && { name }),
          ...(password && { password })
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          emailVerified: true
        }
      });
  
      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(400).json({ message: "Update failed" });
    }
};

// Function to create a new user
exports.createUser = async (req, res) => {
    try {
      const { email, name, password } = req.body;
      if (!email || !name || !password) {
        return res.status(400).json({ message: 'Email, name, and password are required' });
      }
  
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ message: 'Email already in use' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 12);
  
      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          emailVerified: false
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          emailVerified: true
        }
      });
  
      res.status(201).json(user);
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
};