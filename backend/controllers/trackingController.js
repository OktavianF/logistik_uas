const trackingService = require("../services/trackingService");

// Get shipment tracking data with location coordinates
exports.getShipmentTracking = async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    if (!trackingNumber) {
      return res.status(400).json({
        success: false,
        error: "Tracking number is required"
      });
    }

    const trackingData = await trackingService.getShipmentTracking(trackingNumber);

    if (!trackingData) {
      return res.status(404).json({
        success: false,
        error: "Shipment not found"
      });
    }

    res.json({
      success: true,
      data: trackingData
    });
  } catch (error) {
    console.error("Error fetching tracking data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch tracking data",
      message: error.message
    });
  }
};