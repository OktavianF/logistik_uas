const express = require("express");
const router = express.Router();
const courierController = require("../controllers/courierController");
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

// protect courier routes
router.use(authMiddleware);

router.get("/", courierController.getAllCouriers);
router.get("/:id", courierController.getCourierById);
// only admins can create/update/delete couriers
router.post("/", requireRole('admin'), courierController.createCourier);
router.put("/:id", requireRole('admin'), courierController.updateCourier);
router.delete("/:id", requireRole('admin'), courierController.deleteCourier);

module.exports = router;
