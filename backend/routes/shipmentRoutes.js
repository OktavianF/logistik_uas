const express = require("express");
const router = express.Router();
const shipmentController = require("../controllers/shipmentController");
const authMiddleware = require("../middleware/authMiddleware");

// protect shipment routes
router.use(authMiddleware);

router.get("/", shipmentController.getAllShipments);
router.get("/dashboard", shipmentController.getDashboardStatus);
router.get("/metrics", shipmentController.getDashboardMetrics);
router.get("/courier/:courier_id", shipmentController.getShipmentsByCourier);
router.get("/:id", shipmentController.getShipmentById);
router.post("/", shipmentController.createShipment);
router.put("/:id/assign-courier", shipmentController.assignCourier);
router.patch("/:id/status", shipmentController.updateShipmentStatus);

module.exports = router;
