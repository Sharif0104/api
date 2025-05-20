const express = require("express");
const { getAllUsers, getUserById, deleteUser, updateUser, createUser} = require("../controllers/userController");
const rbac = require('../middleware/rbac');
const auth = require("../middleware/auth");
const rateLimiter = require('../middleware/rateLimiter');
const { body } = require('express-validator');
const { validationMiddleware } = require('../middleware/validationMiddleware');
const router = express.Router();

router.get("/", auth, rateLimiter, rbac(['admin']), getAllUsers);
router.get("/:id", auth, rateLimiter, rbac(['admin', 'user']), getUserById);
router.delete("/:id", auth, rateLimiter, rbac(['admin']), deleteUser);
router.put(
  "/:id",
  auth,
  rateLimiter,
  rbac(['admin', 'user']),
  [
    body('email').optional().isEmail().withMessage('Invalid email'),
    body('name').optional().notEmpty().withMessage('Name is required'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validationMiddleware
  ],
  updateUser
);
router.post(
  '/',
  auth,
  rateLimiter,
  rbac(['admin']),
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('name').notEmpty().withMessage('Name is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validationMiddleware
  ],
  createUser
);

module.exports = router;