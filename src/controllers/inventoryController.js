const prisma = require('../utils/prisma');
const { body, validationResult } = require('express-validator');

// Helper: select only needed fields for inventory
const inventorySelect = {
  id: true,
  name: true,
  quantity: true,
  price: true,
  shopId: true,
  userId: true,
  createdAt: true,
  updatedAt: true
};

// Retrieve the list of inventory items
exports.getInventory = async (req, res) => {
  const { shopId, userId, name, page = 1, pageSize = 10 } = req.query;
  let where = {};
  if (shopId) where.shopId = parseInt(shopId, 10);
  if (userId) where.userId = parseInt(userId, 10);
  if (name) where.name = { contains: name, mode: 'insensitive' };
  const skip = (parseInt(page, 10) - 1) * parseInt(pageSize, 10);
  try {
    const [inventory, total] = await Promise.all([
      prisma.inventory.findMany({ where, skip, take: parseInt(pageSize, 10), select: inventorySelect }),
      prisma.inventory.count({ where })
    ]);
    res.status(200).json({ inventory, total, page: parseInt(page, 10), pageSize: parseInt(pageSize, 10) });
  } catch (error) {
    console.error('Error retrieving inventory:', error);
    res.status(500).json({ message: 'Failed to retrieve inventory.' });
  }
};

// Validation middleware for adding inventory (supports both shop and farm inventory)
exports.validateInventory = [
  body('name').isString().withMessage('Name must be a string').notEmpty().withMessage('Name is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('price').isFloat({ min: 0.01 }).withMessage('Price must be a positive number'),
  body().custom(body => {
    if (!body.shopId && !body.userId) {
      throw new Error('Either shopId or userId is required');
    }
    if (body.shopId && body.userId) {
      throw new Error('Only one of shopId or userId should be provided');
    }
    return true;
  })
];

// Add inventory for shop or farm
exports.addInventory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { name, quantity, price, shopId, userId } = req.body;
  try {
    if (shopId) {
      const shopExists = await prisma.shop.findUnique({ where: { id: shopId } });
      if (!shopExists) {
        return res.status(404).json({ message: 'Shop not found.' });
      }
    }
    if (userId) {
      const userExists = await prisma.user.findUnique({ where: { id: userId } });
      if (!userExists) {
        return res.status(404).json({ message: 'User (farmer) not found.' });
      }
    }
    const newItem = await prisma.inventory.create({
      data: { name, quantity, price, shopId, userId },
      select: inventorySelect
    });
    res.status(201).json(newItem);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Inventory item with this name already exists' });
    }
    console.error('Error adding inventory:', error);
    res.status(500).json({ message: 'Failed to add inventory.' });
  }
};

// Update stock details or quantities
exports.updateInventory = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid inventory ID' });
  const { name, quantity, price } = req.body;
  try {
    const updatedItem = await prisma.inventory.update({
      where: { id },
      data: { name, quantity, price },
      select: inventorySelect
    });
    res.status(200).json(updatedItem);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Inventory item with this name already exists' });
    }
    console.error('Error updating inventory:', error);
    res.status(500).json({ message: 'Failed to update inventory.' });
  }
};

// Remove an item from inventory
exports.deleteInventory = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid inventory ID' });
  try {
    const item = await prisma.inventory.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    await prisma.inventory.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting inventory:', error);
    res.status(500).json({ message: 'Failed to delete inventory.' });
  }
};
