const prisma = require('../utils/prisma');

const getPaymentStatus = (req, res) => {
    const { id } = req.params;

    // Simulate fetching payment status
    if (!id) {
        return res.status(400).json({ error: 'Payment ID is required' });
    }

    // Mock payment status
    const paymentStatus = {
        id,
        status: 'completed',
        amount: 100,
        currency: 'USD',
    };

    res.status(200).json(paymentStatus);
};

module.exports = {
    createPayment: (req, res) => {
        // Simulate payment creation logic
        res.status(201).json({ message: 'Payment created successfully' });
    },
    getAllPayments: (req, res) => {
        // Simulate fetching all payments
        res.status(200).json([]);
    },
    getPaymentById: (req, res) => {
        const { id } = req.params;
        res.status(200).json({ id, status: 'completed' });
    },
    initiatePayment: async (req, res) => {
        const { userId, amount, currency } = req.body;

        // Validate the request body
        if (!userId || !amount || !currency) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        try {
            // Create a new payment record in the database
            const payment = await prisma.payment.create({
                data: {
                    userId,
                    amount,
                    currency,
                    status: 'initiated',
                    createdAt: new Date()
                }
            });

            res.status(201).json({ message: 'Payment initiated successfully', payment });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    handleWebhook: async (req, res) => {
        const { event, data } = req.body;

        // Validate the request body
        if (!event || !data) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        try {
            // Process the webhook event
            if (event === 'payment_success') {
                await prisma.payment.update({
                    where: { id: data.paymentId },
                    data: { status: 'success' }
                });
            } else if (event === 'payment_failed') {
                await prisma.payment.update({
                    where: { id: data.paymentId },
                    data: { status: 'failed' }
                });
            }

            res.status(200).json({ message: 'Webhook processed successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    updatePaymentStatus: async (req, res) => {
        const { id } = req.params;
        const { status } = req.body;

        // Validate the request body
        if (!status) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        try {
            // Update the payment status in the database
            const updatedPayment = await prisma.payment.update({
                where: { id: parseInt(id, 10) },
                data: { status }
            });

            res.status(200).json({ message: 'Payment status updated successfully', payment: updatedPayment });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    getPaymentStatus,
};