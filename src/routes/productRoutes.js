const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');
const { body, validationResult } = require('express-validator');

// Validation middleware for product
const validateProduct = [
  body('name').isString().notEmpty().withMessage('Name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('description').optional().isString(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Validation middleware for category
const validateCategory = [
  body('name').isString().notEmpty().withMessage('Category name is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// List products with pagination/filtering
router.get('/', productController.getProducts);
// Get product by ID
router.get('/:id', productController.getProductById);
// Create product (protected)
router.post('/', auth, rateLimiter, validateProduct, productController.createProduct);
// Update product (protected)
router.put('/:id', auth, rateLimiter, validateProduct, productController.updateProduct);
// Delete product (protected)
router.delete('/:id', auth, rateLimiter, productController.deleteProduct);
// Category routes
router.get('/categories', productController.getCategories);
router.post('/categories', auth, rateLimiter, validateCategory, productController.createCategory);
router.put('/categories/:id', auth, rateLimiter, validateCategory, productController.updateCategory);
router.delete('/categories/:id', auth, rateLimiter, productController.deleteCategory);

module.exports = router;
