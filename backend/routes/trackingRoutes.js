const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/TrackingController');
const authMiddleware = require('../middleware/authMiddleware');

// protect tracking endpoints
router.use(authMiddleware);

// GET /api/shipments/track/:trackingNumber
router.get('/:trackingNumber', trackingController.getShipmentTracking);

module.exports = router;
