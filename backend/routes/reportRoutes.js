const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const adminOrInternal = require('../middleware/adminOrInternalMiddleware');

// Protect report routes: only admins (JWT role 'admin') or internal services (x-internal-secret) can access
router.get("/per-courier", adminOrInternal, reportController.getReportPerCourier);
router.get("/per-region", adminOrInternal, reportController.getReportPerRegion);
router.get("/performance", adminOrInternal, reportController.getPerformanceAnalysis);

module.exports = router;
