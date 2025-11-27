const reportService = require("../services/reportService");

exports.getReportPerCourier = async (req, res) => {
  try {
    const courierId = Number(req.query.courier_id || req.params.courier_id);
    if (!courierId || Number.isNaN(courierId)) {
      return res.status(400).json({ success: false, error: 'Missing or invalid courier_id (query param or route param)' });
    }

    // Optional start/end date parameters (expected in ISO or YYYY-MM-DD)
    const startDateRaw = req.query.start_date;
    const endDateRaw = req.query.end_date;
    const startDate = startDateRaw ? new Date(String(startDateRaw)) : null;
    const endDate = endDateRaw ? new Date(String(endDateRaw)) : null;

    const report = await reportService.getReportPerCourier(courierId, startDate, endDate);
    res.json({
      success: true,
      data: report,
      message: "Report generated using stored procedure: sp_report_per_courier"
    });
  } catch (error) {
    console.error("Error generating report per courier:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getReportPerRegion = async (req, res) => {
  try {
    const report = await reportService.getReportPerRegion();
    res.json({
      success: true,
      data: report,
      message: "Report generated using stored procedure: sp_report_per_region"
    });
  } catch (error) {
    console.error("Error generating report per region:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getPerformanceAnalysis = async (req, res) => {
  try {
    const analysis = await reportService.getPerformanceAnalysis();
    res.json({
      success: true,
      data: analysis,
      message: "Performance analysis with execution plans"
    });
  } catch (error) {
    console.error("Error generating performance analysis:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
