const express = require('express');
const router = express.Router();

// Controller for handling orders
const orderController = require('../controllers/orderController');

// POST /orders
router.post('/orders', orderController.createOrder);

// Add GET /orders route
router.get('/orders', orderController.getAllOrders);

// Add GET /orders/:id route
router.get('/orders/:id', orderController.getOrderById);

module.exports = router;
