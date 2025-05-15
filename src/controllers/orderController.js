// Controller for handling orders

require('dotenv').config(); // Load environment variables

const processPayment = (paymentDetails) => {
    // Simulate payment processing logic
    if (!paymentDetails || !paymentDetails.cardNumber || !paymentDetails.amount) {
        throw new Error('Invalid payment details');
    }
    return { status: 'success', transactionId: Date.now() };
};

exports.createOrder = (req, res) => {
    const { items, totalAmount, userId, paymentDetails } = req.body;

    // Validate the request body
    if (!items || !totalAmount || !userId || !paymentDetails) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Process payment
        const paymentResult = processPayment(paymentDetails);

        // Simulate order creation logic
        const newOrder = {
            id: Date.now(),
            items,
            totalAmount,
            userId,
            paymentStatus: paymentResult.status,
            transactionId: paymentResult.transactionId,
            createdAt: new Date()
        };

        // Respond with the created order
        res.status(201).json({ message: 'Order and payment processed successfully', order: newOrder });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const prisma = require('../utils/prisma');

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await prisma.booking.findMany({
            include: {
                user: true,
                shop: true,
                availability: {
                    include: {
                        timeSlot: true
                    }
                }
            }
        });

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getOrderById = async (req, res) => {
    const { id } = req.params;

    try {
        const order = await prisma.booking.findUnique({
            where: { id: parseInt(id, 10) },
            include: {
                user: true,
                shop: true,
                availability: {
                    include: {
                        timeSlot: true
                    }
                }
            }
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
