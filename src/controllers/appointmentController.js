const prisma = require("../utils/prisma");
const { Queue } = require('bullmq');
const connection = { host: process.env.REDIS_HOST, port: Number(process.env.REDIS_PORT), password: process.env.REDIS_PASSWORD };
const appointmentQueue = new Queue('appointments', { connection });

// Function to create a new appointment
exports.createAppointment = async (req, res) => {
  const { userId, shopId, date, time } = req.body;

  if (!userId || !shopId || !date || !time) {
    return res.status(400).json({ message: "Missing required fields: userId, shopId, date, time" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });

    if (!user || !shop) {
      return res.status(404).json({ message: "User or shop not found" });
    }

    // Parse the time into hour and minute
    const [hour, minute] = time.split(":").map(Number);

    // Find the matching availability
    const availabilityData = await prisma.shopAvailability.findFirst({
      where: {
        shopId: shopId,
        timeSlot: {
          date: new Date(date),
          hour: hour,
          minute: minute,
        },
      },
      include: { timeSlot: true },
    });

    if (!availabilityData || !availabilityData.timeSlot) {
      return res.status(400).json({ message: "No availability found for the given date and time" });
    }

    const slot = availabilityData.timeSlot;

    // Add the appointment to the queue
    await appointmentQueue.add(
      "createAppointment",
      {
        userId,
        shopId,
        date: slot.date,
        hour: slot.hour,
        minute: slot.minute,
        availabilityId: availabilityData.id,
      },
      { removeOnComplete: true }
    );

    res.status(201).json({ message: "Appointment queued successfully" });
  } catch (error) {
    console.error("Error queuing appointment:", error);
    res.status(500).json({ message: "Failed to queue appointment" });
  }
};

// Function to retrieve all appointments
exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await prisma.booking.findMany({
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

    const formattedAppointments = appointments.map(appointment => {
      const { timeSlot } = appointment.availability;
      return {
        user: appointment.user,
        shop: appointment.shop,
        availability: {
          id: appointment.availability.id,
          timeSlot: {
            id: timeSlot.id,
            hour: timeSlot.hour,
            minute: timeSlot.minute,
            date: timeSlot.date,
          }
        }
      };
    });

    res.status(200).json({ appointments: formattedAppointments });
  } catch (error) {
    console.error("Error retrieving appointments:", error);
    res.status(500).json({ message: "Failed to retrieve appointments" });
  }
};

// Function to retrieve a specific appointment by ID
exports.getAppointmentById = async (req, res) => {
  const { id } = req.params;

  try {
    const appointment = await prisma.booking.findUnique({
      where: { id: parseInt(id) },
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

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const { timeSlot } = appointment.availability;
    const formattedAppointment = {
      user: appointment.user,
      shop: appointment.shop,
      availability: {
        id: appointment.availability.id,
        timeSlot: {
          id: timeSlot.id,
          hour: timeSlot.hour,
          minute: timeSlot.minute,
          date: timeSlot.date,
        }
      }
    };

    res.status(200).json({ appointment: formattedAppointment });
  } catch (error) {
    console.error("Error retrieving appointment:", error);
    res.status(500).json({ message: "Failed to retrieve appointment" });
  }
};

// Function to update an existing appointment
exports.updateAppointment = async (req, res) => {
    const { id } = req.params;
    const { date, hour, shopId } = req.body;
  
    if (!date || hour === undefined || !shopId) {
      return res.status(400).json({ message: "Missing required fields: date, hour, shopId" });
    }
  
    try {
      const appointment = await prisma.booking.findUnique({ where: { id: parseInt(id) } });
  
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
  
      const conflict = await prisma.booking.findFirst({
        where: {
          shopId,
          date: new Date(date),
          hour,
          NOT: { id: parseInt(id) }
        }
      });
  
      if (conflict) {
        return res.status(409).json({ message: "Time slot already booked" });
      }
  
      const updated = await prisma.booking.update({
        where: { id: parseInt(id) },
        data: {
          date: new Date(date),
          hour,
          shopId
        }
      });
  
      res.status(200).json({ message: "Appointment updated successfully", appointment: updated });
    } catch (error) {
      console.error("Error updating appointment:", error);
      res.status(500).json({ message: "Failed to update appointment" });
    }
};

// Function to delete an appointment
exports.deleteAppointment = async (req, res) => {
    const { id } = req.params;
  
    try {
      const appointment = await prisma.booking.findUnique({
        where: { id: parseInt(id) }
      });
  
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
  
      await prisma.booking.delete({
        where: { id: parseInt(id) }
      });
  
      res.status(200).json({ message: "Appointment cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      res.status(500).json({ message: "Failed to cancel appointment" });
    }
};