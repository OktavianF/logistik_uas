const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");

router.get("/per-courier", reportController.getReportPerCourier);
router.get("/per-region", reportController.getReportPerRegion);
router.get("/performance", reportController.getPerformanceAnalysis);

module.exports = router;
