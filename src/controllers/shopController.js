const prisma = require("../utils/prisma");

// Helper: select only needed fields for shop
const shopSelect = {
  id: true,
  name: true,
  location: true,
  inventories: {
    select: {
      id: true,
      name: true,
      quantity: true,
      price: true,
      createdAt: true,
      updatedAt: true,
    },
  },
};

// Function to create a new shop
exports.createShop = async (req, res) => {
  const { name, location } = req.body;

  if (!name || !location) {
    return res.status(400).json({ message: "Name and location are required" });
  }

  try {
    const newShop = await prisma.shop.create({
      data: { name, location },
      select: shopSelect
    });

    res.status(201).json({ message: "Shop created successfully", shop: newShop });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Shop with this name already exists' });
    }
    console.error("Error creating shop:", error);
    res.status(500).json({ message: "Failed to create shop" });
  }
};

// Function to retrieve all shops
exports.getAllShops = async (req, res) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const pageSize = parseInt(req.query.pageSize, 10) || 10;
      const skip = (page - 1) * pageSize;
      const filter = {};
      if (req.query.name) filter.name = { contains: req.query.name, mode: 'insensitive' };
      if (req.query.location) filter.location = { contains: req.query.location, mode: 'insensitive' };
      const [shops, total] = await Promise.all([
        prisma.shop.findMany({
          skip,
          take: pageSize,
          where: filter,
          select: shopSelect
        }),
        prisma.shop.count({ where: filter })
      ]);
      res.status(200).json({ shops, total, page, pageSize });
    } catch (error) {
      console.error('Error retrieving shops:', error);
      res.status(500).json({ message: 'Failed to retrieve shops.' });
    }
};

// Function to retrieve a specific shop by ID
exports.getShopById = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid shop ID' });
    try {
      const shop = await prisma.shop.findUnique({
        where: { id },
        select: shopSelect
      });
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      res.status(200).json({ shop });
    } catch (error) {
      console.error("Error fetching shop:", error);
      res.status(500).json({ message: "Failed to retrieve shop" });
    }
};

// Function to update an existing shop
exports.updateShop = async (req, res) => {
    const { id } = req.params;
    const { name, location } = req.body;
  
    if (!name && !location) {
      return res.status(400).json({ message: "At least one field (name or location) must be provided for update" });
    }
  
    try {
      const updatedShop = await prisma.shop.update({
        where: { id: parseInt(id) },
        data: {
          ...(name && { name }),
          ...(location && { location }),
        },
        select: shopSelect
      });
  
      res.status(200).json({ message: "Shop updated successfully", shop: updatedShop });
    } catch (error) {
      console.error("Error updating shop:", error);
      if (error.code === 'P2025') {
        return res.status(404).json({ message: "Shop not found" });
      }
      res.status(500).json({ message: "Failed to update shop" });
    }
};

// Function to delete a shop
exports.deleteShop = async (req, res) => {
    const { id } = req.params;
  
    try {
      await prisma.shop.delete({
        where: { id: parseInt(id) },
      });
  
      res.status(200).json({ message: "Shop deleted successfully" });
    } catch (error) {
      console.error("Error deleting shop:", error);
      if (error.code === 'P2025') {
        return res.status(404).json({ message: "Shop not found" });
      }
      res.status(500).json({ message: "Failed to delete shop" });
    }
};