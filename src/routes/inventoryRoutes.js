const express = require('express');
const {
  getInventory,
  addInventory,
  updateInventory,
  deleteInventory,
  validateInventory,
} = require('../controllers/inventoryController');

const router = express.Router();

// Inventory routes
router.get('/inventory', getInventory);
router.post('/inventory', validateInventory, addInventory);
router.put('/inventory/:id', updateInventory);
router.delete('/inventory/:id', deleteInventory);

module.exports = router;
