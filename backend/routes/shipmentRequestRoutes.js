const express = require('express');
const router = express.Router();
const shipmentRequestController = require('../controllers/shipmentRequestController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Customers: create request, list own
router.post('/', shipmentRequestController.createRequest);
router.get('/', shipmentRequestController.listRequests);
router.get('/:id', shipmentRequestController.getRequest);

// Admin-only: accept/reject
router.patch('/:id/accept', requireRole('admin'), shipmentRequestController.acceptRequest);
router.patch('/:id/reject', requireRole('admin'), shipmentRequestController.rejectRequest);

module.exports = router;
