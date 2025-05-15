const prisma = require('../utils/prisma');
const bcrypt = require('bcrypt');

// Function to retrieve all admin users
exports.getAdminUsers = async (req, res) => {
    try {
        const adminUsers = await prisma.user.findMany({
            where: { role: 'admin' },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
            },
        });

        res.status(200).json(adminUsers);
    } catch (error) {
        console.error('Error fetching admin users:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Function to update an admin user by ID
exports.updateAdminUser = async (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;

    try {
        const updatedAdminUser = await prisma.user.update({
            where: { id: parseInt(id, 10), role: 'admin' },
            data: { name, email },
        });

        res.status(200).json(updatedAdminUser);
    } catch (error) {
        if (error.code === 'P2025') { // Prisma-specific error for record not found
            return res.status(404).json({ message: 'Admin user not found' });
        }
        console.error('Error updating admin user:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Delete an admin user by ID
exports.deleteAdminUser = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedAdmin = await prisma.user.delete({
            where: {
                id: parseInt(id, 10),
                role: 'admin',
            },
        });

        res.status(200).json({ message: 'Admin user deleted', user: deletedAdmin });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Admin user not found' });
        }
        console.error('Error deleting admin user:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.getAdminLogs = async (req, res) => {
    try {
        const logs = await prisma.log.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100, // limit for performance
        });

        res.status(200).json(logs);
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// POST /admin/config
exports.setAdminConfig = async (req, res) => {
    const { key, value } = req.body;
    if (!key || value === undefined) {
        return res.status(400).json({ message: 'Key and value are required' });
    }

    try {
        const config = await prisma.config.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });

        res.status(200).json({ message: 'Configuration updated', config });
    } catch (error) {
        console.error('Error updating config:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};