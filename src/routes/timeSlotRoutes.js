const express = require("express");
const { getAvailableTimeSlots, createTimeSlots, deleteTimeSlot, deleteTimeSlots, updateTimeSlot} = require("../controllers/timeSlotController");
const router = express.Router();

router.get("/:shopId/dates/:date/timeslots", getAvailableTimeSlots);
router.post("/:shopId/dates/:date/timeslots", createTimeSlots);
router.put("/:shopId/dates/:date/timeslots", updateTimeSlot);
// router.delete("/:shopId/dates/:date/timeslots/:timeslotId", deleteTimeSlot);
// router.delete("/:shopId/dates/:date/timeslots", deleteTimeSlots);

module.exports = router;