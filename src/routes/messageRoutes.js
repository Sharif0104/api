const express = require("express");
const { getMessages, sendMessage, getConversations, createConversation, getConversationId, contactOwner, markMessageRead } = require("../controllers/messageController");
const auth = require("../middleware/auth");  // Assuming you have an authentication middleware
const router = express.Router();

// Routes for handling messages and conversations with auth middleware

// Route to get messages from a specific conversation
router.get('/messages/:conversationId', auth, getMessages);

// Route to send a new message to a specific conversation
router.post('/messages/:conversationId', auth, sendMessage);

// Route to get a list of conversations
router.get('/conversations', auth, getConversations);

// Route to create a new conversation
router.post('/conversations', auth, createConversation);

router.get('/conversation-id', auth, getConversationId);  // Get conversation ID between two users

// Route to contact the owner
router.post('/contact-owner', contactOwner);

// Route to mark a message as read
router.post('/messages/:messageId/read', auth, markMessageRead);

module.exports = router;