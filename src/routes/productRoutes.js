const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// GET /products
router.get('/products', productController.getProducts);

// GET /products/:id
router.get('/products/:id', productController.getProductById);

// POST /products
router.post('/products', productController.createProduct);

// PUT /products/:id
router.put('/products/:id', productController.updateProduct);

// DELETE /products/:id
router.delete('/products/:id', productController.deleteProduct);

// GET /categories
router.get('/categories', productController.getCategories);

// POST /categories
router.post('/categories', productController.createCategory);

// PUT /categories/:id
router.put('/categories/:id', productController.updateCategory);

// DELETE /categories/:id
router.delete('/categories/:id', productController.deleteCategory);

module.exports = router;
