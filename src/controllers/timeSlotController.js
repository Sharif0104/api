const prisma = require('../utils/prisma');

// Function to create time slots for a shop
exports.createTimeSlots = async (req, res) => {
  const { shopId, date } = req.params;
  const { startHour, startMinute, endHour, endMinute, interval } = req.body;

  if ([startHour, startMinute, endHour, endMinute, interval].some(v => v === undefined)) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const shop = await prisma.shop.findUnique({ where: { id: parseInt(shopId) } });
    if (!shop) return res.status(404).json({ message: "Shop not found" });

    const start = new Date(date);
    start.setHours(startHour, startMinute, 0, 0);
    const end = new Date(date);
    end.setHours(endHour, endMinute, 0, 0);

    if (start >= end) {
      return res.status(400).json({ message: "Start time must be before end time" });
    }

    const newSlots = [];
    for (let time = new Date(start); time < end; time = new Date(time.getTime() + interval * 60000)) {
      const hour = time.getHours();
      const minute = time.getMinutes();
      newSlots.push({ hour, minute, date: new Date(date), shopId: shop.id });
    }

    // Create new time slots without deleting existing ones
    await prisma.timeSlot.createMany({ data: newSlots, skipDuplicates: true });

    res.status(201).json({ message: "Time slots created successfully" });
  } catch (error) {
    console.error("Error creating time slots:", error); // Log the error
    res.status(500).json({ message: "Failed to create time slots" });
  }
};

// Function to get available time slots for a shop on a specific date
exports.getAvailableTimeSlots = async (req, res) => {
  const { shopId, date } = req.params;

  try {
    const timeSlots = await prisma.timeSlot.findMany({
      where: {
        shopId: parseInt(shopId),
        date: new Date(date),
      },
    });

    if (timeSlots.length === 0) {
      return res.status(404).json({ message: "No time slots found for this shop and date" });
    }

    res.status(200).json(timeSlots);
  } catch (error) {
    console.error("Error fetching time slots:", error);
    res.status(500).json({ message: "Failed to retrieve time slots" });
  }
};

// Function to update time slots for a shop
exports.updateTimeSlot = async (req, res) => {
  const { shopId, date } = req.params;
  const { startHour, startMinute, endHour, endMinute, interval } = req.body;

  if ([startHour, startMinute, endHour, endMinute, interval].some(v => v === undefined)) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const shop = await prisma.shop.findUnique({ where: { id: parseInt(shopId) } });
    if (!shop) return res.status(404).json({ message: "Shop not found" });

    const start = new Date(date);
    start.setHours(startHour, startMinute, 0, 0);
    const end = new Date(date);
    end.setHours(endHour, endMinute, 0, 0);

    if (start >= end) {
      return res.status(400).json({ message: "Start time must be before end time" });
    }

    const validKeys = new Set();
    for (let time = new Date(start); time < end; time = new Date(time.getTime() + interval * 60000)) {
      const hour = time.getHours();
      const minute = time.getMinutes();
      validKeys.add(`${hour}:${minute}`);
    }

    const existingSlots = await prisma.timeSlot.findMany({
      where: {
        shopId: shop.id,
        date: new Date(date)
      }
    });

    const toDeleteIds = existingSlots
      .filter(s => !validKeys.has(`${s.hour}:${s.minute}`))
      .map(s => s.id);

    if (toDeleteIds.length > 0) {
      // Delete associated bookings first
      await prisma.booking.deleteMany({
        where: {
          availability: {
            timeSlotId: { in: toDeleteIds }
          }
        }
      });

      // Delete shop availability entries
      await prisma.shopAvailability.deleteMany({
        where: { timeSlotId: { in: toDeleteIds } }
      });

      // Delete time slots
      await prisma.timeSlot.deleteMany({
        where: { id: { in: toDeleteIds } }
      });
    }

    const newSlots = [];
    for (let time = new Date(start); time < end; time = new Date(time.getTime() + interval * 60000)) {
      const hour = time.getHours();
      const minute = time.getMinutes();
      newSlots.push({ hour, minute, date: new Date(date), shopId: shop.id });
    }

    await prisma.timeSlot.createMany({ data: newSlots, skipDuplicates: true });

    res.status(200).json({ message: "Time slots updated successfully" });
  } catch (error) {
    console.error("Error updating time slots:", error);
    res.status(500).json({ message: "Failed to update time slots" });
  }
};