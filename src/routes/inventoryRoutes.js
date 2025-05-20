const express = require('express');
const {
  getInventory,
  addInventory,
  updateInventory,
  deleteInventory,
  validateInventory,
} = require('../controllers/inventoryController');
const auth = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');
const router = express.Router();

// List inventory with pagination/filtering
router.get('/', getInventory);
// Add inventory (protected)
router.post('/', auth, rateLimiter, validateInventory, addInventory);
// Update inventory (protected)
router.put('/:id', auth, rateLimiter, updateInventory);
// Delete inventory (protected)
router.delete('/:id', auth, rateLimiter, deleteInventory);

module.exports = router;
