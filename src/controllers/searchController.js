const prisma = require('../utils/prisma');

/**
 * Search across resources (e.g., users, products, orders).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.searchResources = async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ message: 'Query parameter is required.' });
  }

  try {
    // Example: Search users, products, and orders
    const [users, products, orders] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
      prisma.order.findMany({
        where: {
          OR: [
            { id: { contains: query, mode: 'insensitive' } },
            { status: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    res.status(200).json({
      users,
      products,
      orders,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'An error occurred while searching.' });
  }
};
