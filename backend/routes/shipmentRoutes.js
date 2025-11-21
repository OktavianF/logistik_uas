const express = require("express");
const router = express.Router();
const shipmentController = require("../controllers/shipmentController");
const authMiddleware = require("../middleware/authMiddleware");

// protect shipment routes
router.use(authMiddleware);

router.get("/", shipmentController.getAllShipments);
router.get("/dashboard", shipmentController.getDashboardStatus);
router.get("/metrics", shipmentController.getDashboardMetrics);
router.get("/:tracking_number", shipmentController.getShipmentByTracking);
router.post("/", shipmentController.createShipment);
router.put("/:id/assign-courier", shipmentController.assignCourier);

module.exports = router;
