const express = require('express');
const router = express.Router();

// Controller for handling payments and orders
const paymentController = require('../controllers/paymentController');

// POST /payments
router.post('/', paymentController.createPayment);

// GET /payments
router.get('/', paymentController.getAllPayments);

// GET /payments/:id
router.get('/:id', paymentController.getPaymentById);

// POST /payments/initiate
router.post('/initiate', paymentController.initiatePayment);

// POST /payments/webhook
router.post('/webhook', paymentController.handleWebhook);

// GET /payments/status/:id
router.get('/status/:id', paymentController.getPaymentStatus);

// Add POST /payments/status/:id route
router.post('/status/:id', paymentController.updatePaymentStatus);

module.exports = router;
