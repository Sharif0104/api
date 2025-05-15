const prisma = require('../utils/prisma');
const { body, validationResult } = require('express-validator');

// Retrieve the list of inventory items
exports.getInventory = async (req, res) => {
  try {
    const inventory = await prisma.inventory.findMany();
    res.status(200).json(inventory);
  } catch (error) {
    console.error('Error retrieving inventory:', error);
    res.status(500).json({ message: 'Failed to retrieve inventory.' });
  }
};

// Validation middleware for adding inventory
exports.validateInventory = [
  body('name').isString().withMessage('Name must be a string').notEmpty().withMessage('Name is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('price').isFloat({ min: 0.01 }).withMessage('Price must be a positive number'),
  body('shopId').isInt().withMessage('Shop ID must be an integer').notEmpty().withMessage('Shop ID is required'),
];

// Updated addInventory function with validation
exports.addInventory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, quantity, price, shopId } = req.body;

  try {
    const shopExists = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shopExists) {
      return res.status(404).json({ message: 'Shop not found.' });
    }

    const newItem = await prisma.inventory.create({
      data: { name, quantity, price, shopId },
    });
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error adding inventory:', error);
    res.status(500).json({ message: 'Failed to add inventory.' });
  }
};

// Update stock details or quantities
exports.updateInventory = async (req, res) => {
  const { id } = req.params;
  const { name, quantity, price } = req.body;

  try {
    const updatedItem = await prisma.inventory.update({
      where: { id: parseInt(id, 10) },
      data: { name, quantity, price },
    });
    res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ message: 'Failed to update inventory.' });
  }
};

// Remove an item from inventory
exports.deleteInventory = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.inventory.delete({
      where: { id: parseInt(id, 10) },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting inventory:', error);
    res.status(500).json({ message: 'Failed to delete inventory.' });
  }
};
