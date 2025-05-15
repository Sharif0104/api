const express = require("express");
const { getAllUsers, getUserById, deleteUser, updateUser, createUser} = require("../controllers/userController");
const auth = require("../middleware/auth");
const router = express.Router();

router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.delete("/users/:id", deleteUser);
router.put("/users/:id", updateUser);
router.post('/users', createUser);
router.put("/users/:id", auth, updateUser);

module.exports = router;