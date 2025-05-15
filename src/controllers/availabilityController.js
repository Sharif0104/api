const prisma = require("../utils/prisma");

// Function to set shop availability
exports.setShopAvailability = async (req, res) => {
  const { shopId } = req.params;
  const { availability } = req.body;

  if (!availability || !Array.isArray(availability) || availability.length === 0) {
    return res.status(400).json({ message: "Availability array is required" });
  }

  try {
    const shop = await prisma.shop.findUnique({
      where: { id: parseInt(shopId) }
    });

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    const newAvailability = [];

    for (const slot of availability) {
      for (const ts of slot.timeSlots) {
        if (!ts.id || typeof ts.id !== "number") {
          return res.status(400).json({ message: "Invalid or missing timeSlot id" });
        }

        const timeSlot = await prisma.timeSlot.findUnique({ where: { id: ts.id } });
        if (!timeSlot) {
          return res.status(400).json({ message: `TimeSlot with id ${ts.id} not found` });
        }

        const existingAvailability = await prisma.shopAvailability.findFirst({
          where: {
            shopId: parseInt(shopId),
            timeSlotId: ts.id
          }
        });

        if (existingAvailability) {
          return res.status(400).json({ message: `TimeSlot with id ${ts.id} is already set for this shop` });
        }

        newAvailability.push({
          shopId: parseInt(shopId),
          timeSlotId: ts.id
        });
      }
    }

    const created = await prisma.shopAvailability.createMany({
      data: newAvailability,
      skipDuplicates: true
    });

    res.status(200).json({
      message: "Shop availability updated successfully",
      count: created.count
    });
  } catch (error) {
    console.error("Error setting shop availability:", error);
    res.status(500).json({ message: "Failed to set shop availability" });
  }
};

// Function to get shop availability
exports.getShopAvailability = async (req, res) => {
  const { shopId } = req.params;

  try {
    const shop = await prisma.shop.findUnique({
      where: { id: parseInt(shopId) },
      include: { availability: { include: { timeSlot: true } } },
    });

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    const availability = shop.availability.map(avail => ({
      id: avail.id,  // Add the unique ID here
      timeSlotId: avail.timeSlotId,
      timeSlot: avail.timeSlot,
    }));

    res.status(200).json({
      shopId: shop.id,
      availability,
    });
  } catch (error) {
    console.error("Error retrieving availability:", error);
    res.status(500).json({ message: "Failed to retrieve availability" });
  }
};

// Function to update a specific availability slot
exports.updateAvailabilitySlot = async (req, res) => {
    const { shopId, availabilityId } = req.params;
    const { date, hour } = req.body;
  
    if (!date || hour === undefined) {
      return res.status(400).json({ message: "Date and hour are required" });
    }
  
    try {
      const slot = await prisma.timeSlot.findUnique({
        where: { id: parseInt(availabilityId) }
      });
  
      if (!slot || slot.shopId !== parseInt(shopId)) {
        return res.status(404).json({ message: "Availability slot not found for this shop" });
      }
  
      const updatedSlot = await prisma.timeSlot.update({
        where: { id: parseInt(availabilityId) },
        data: {
          date: new Date(date),
          hour: hour
        }
      });
  
      res.status(200).json({
        message: "Availability slot updated successfully",
        timeSlot: updatedSlot
      });
    } catch (error) {
      console.error("Error updating availability slot:", error);
      res.status(500).json({ message: "Failed to update availability slot" });
    }
};

// Function to delete a specific availability slot
exports.deleteAvailabilitySlot = async (req, res) => {
    const { shopId, availabilityId } = req.params;
  
    try {
      const slot = await prisma.timeSlot.findUnique({
        where: { id: parseInt(availabilityId) }
      });
  
      if (!slot || slot.shopId !== parseInt(shopId)) {
        return res.status(404).json({ message: "Availability slot not found for this shop" });
      }
  
      await prisma.timeSlot.delete({
        where: { id: parseInt(availabilityId) }
      });
  
      res.status(200).json({ message: "Availability slot deleted successfully" });
    } catch (error) {
      console.error("Error deleting availability slot:", error);
      res.status(500).json({ message: "Failed to delete availability slot" });
    }
};