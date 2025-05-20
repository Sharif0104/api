const express = require("express");
const { createShop, getAllShops, getShopById, updateShop, deleteShop } = require("../controllers/shopController");
const rbac = require('../middleware/rbac');
const auth = require("../middleware/auth");
const rateLimiter = require('../middleware/rateLimiter');
const router = express.Router();

router.post("/", auth, rateLimiter, rbac(['admin']), createShop);
router.get("/", rateLimiter, getAllShops);
router.get("/:id", rateLimiter, getShopById);
router.put("/:id", auth, rateLimiter, rbac(['admin']), updateShop);
router.delete("/:id", auth, rateLimiter, rbac(['admin']), deleteShop);

module.exports = router;