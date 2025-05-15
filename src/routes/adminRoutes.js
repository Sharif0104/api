const express = require("express");
const { updateAdminUser, getAdminUsers, updateAdminUser, deleteAdminUser} = require("../controllers/adminController");
const auth = require("../middleware/auth");
const router = express.Router();

// GET /admin/users
router.get('/admin/users', getAdminUsers);
// PATCH /admin/users/:id
router.patch('/admin/users/:id', updateAdminUser);
// DELETE /admin/users/:id
router.delete('/admin/users/:id', deleteAdminUser);
// GET /admin/logs
router.get('/admin/logs', getAdminLogs);
// POST /admin/config
router.post('/admin/config', setAdminConfig);

module.exports = router;