const prisma = require('../utils/prisma'); // Assuming this is where your Prisma client is configured
const { validationResult } = require('express-validator');
const nodemailer = require('nodemailer');

// Enhanced error handling and validation for getMessages
exports.getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;

        if (!conversationId || isNaN(conversationId)) {
            return res.status(400).json({ error: 'Invalid conversation ID' });
        }

        const messages = await prisma.message.findMany({
            where: { conversationId: parseInt(conversationId, 10) },
            include: {
                user: { select: { name: true, email: true } }
            }
        });

        if (!messages.length) {
            return res.status(404).json({ error: 'No messages found' });
        }

        res.json({ messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Enhanced error handling for sendMessage
exports.sendMessage = async (req, res) => {
    const { conversationId } = req.params;
    const { userId, content } = req.body;

    if (!conversationId || isNaN(conversationId)) {
        return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    if (!userId || !content) {
        return res.status(400).json({ error: 'User ID and content are required' });
    }

    try {
        const message = await prisma.message.create({
            data: {
                conversationId: parseInt(conversationId, 10),
                userId: parseInt(userId, 10),
                content
            }
        });

        res.status(201).json({ message });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Enhanced error handling for getConversations
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.id;

        // Debugging log to check the user ID
        console.log('User ID:', userId);

        const conversations = await prisma.conversation.findMany({
            where: {
                OR: [
                    { user1Id: userId },
                    { user2Id: userId }
                ]
            },
            include: {
                user1: { select: { name: true, email: true } },
                user2: { select: { name: true, email: true } }
            }
        });

        // Debugging log to check the query result
        console.log('Conversations query result:', conversations);

        if (!conversations.length) {
            return res.status(404).json({ error: 'No conversations found' });
        }

        res.json({ conversations });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Enhanced error handling for createConversation
exports.createConversation = async (req, res) => {
    const { userId1, userId2 } = req.body;

    // Debugging log to check the request body
    console.log('Request body:', req.body);

    if (!userId1 || !userId2 || userId1 === userId2) {
        return res.status(400).json({ error: 'Invalid user IDs' });
    }

    try {
        const existingConversation = await prisma.conversation.findFirst({
            where: {
                OR: [
                    { user1Id: parseInt(userId1, 10), user2Id: parseInt(userId2, 10) },
                    { user1Id: parseInt(userId2, 10), user2Id: parseInt(userId1, 10) }
                ]
            }
        });

        if (existingConversation) {
            return res.status(400).json({ error: 'Conversation already exists' });
        }

        const conversation = await prisma.conversation.create({
            data: {
                user1Id: parseInt(userId1, 10),
                user2Id: parseInt(userId2, 10)
            }
        });

        res.status(201).json({ conversation });
    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getConversationId = async (req, res) => {
  const { user1Id, user2Id } = req.query;  // Query parameters

  try {
    // Ensure that user1Id and user2Id are numbers
    const conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: parseInt(user1Id, 10), user2Id: parseInt(user2Id, 10) },
          { user1Id: parseInt(user2Id, 10), user2Id: parseInt(user1Id, 10) }
        ]
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Fetch messages for the conversation
    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      include: {
        user: { select: { name: true, email: true } }
      }
    });

    res.json({ conversationId: conversation.id, messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error retrieving conversation or messages' });
  }
};

// New endpoint to allow users to contact the owner
exports.contactOwner = async (req, res) => {
    const { name, email, message } = req.body;

    // Validate input
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    try {
        // Configure nodemailer with Gmail SMTP
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS,
            },
        });

        // Email options with Reply-To set to the user's email
        const mailOptions = {
            from: process.env.GMAIL_USER, // Sender's email (your Gmail)
            to: process.env.GMAIL_USER, // Recipient's email (your Gmail)
            replyTo: email, // User's email for replies
            subject: 'New Contact Form Submission',
            text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
        };

        // Send the email
        await transporter.sendMail(mailOptions);

        // Respond with success
        res.status(200).json({ message: 'Your message has been successfully delivered.' });
    } catch (error) {
        console.error('Error sending message to owner:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

