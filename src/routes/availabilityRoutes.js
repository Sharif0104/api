const express = require("express");
const router = express.Router();
const { setShopAvailability, getShopAvailability, updateAvailabilitySlot, deleteAvailabilitySlot } = require("../controllers/availabilityController");

router.post("/:shopId/availability", setShopAvailability);
router.get("/:shopId/availability", getShopAvailability);
router.put("/:shopId/availability/:availabilityId", updateAvailabilitySlot);
router.delete("/:shopId/availability/:availabilityId", deleteAvailabilitySlot);

module.exports = router;
