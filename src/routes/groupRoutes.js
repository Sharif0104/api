const express = require('express');
const { createGroup, addGroupMember, sendGroupMessage, getGroupMessages } = require('../controllers/groupController');
const auth = require('../middleware/auth');
const router = express.Router();

// Create a group (only with friends)
router.post('/groups', auth, createGroup);
// Add a friend to a group (owner only)
router.post('/groups/:groupId/members', auth, addGroupMember);
// Send a message to a group (must be a member)
router.post('/groups/:groupId/messages', auth, sendGroupMessage);
// Get group messages (must be a member)
router.get('/groups/:groupId/messages', auth, getGroupMessages);

module.exports = router;
