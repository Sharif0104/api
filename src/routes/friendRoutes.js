const express = require("express");
const { sendFriendRequest, acceptFriendRequest, removeFriend, getPendingRequests, checkFriendRequest } = require("../controllers/friendController");
const auth = require("../middleware/auth");
const router = express.Router();

router.post("/request", auth, sendFriendRequest);
router.post("/accept", auth, acceptFriendRequest);
router.post("/remove", auth, removeFriend);
router.get("/pending", auth, getPendingRequests);
router.get("/check", auth, checkFriendRequest);

module.exports = router;
