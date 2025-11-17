const reportService = require("../services/reportService");

exports.getReportPerCourier = async (req, res) => {
  try {
    const report = await reportService.getReportPerCourier();
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
