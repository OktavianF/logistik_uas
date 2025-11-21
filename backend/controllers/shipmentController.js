const shipmentService = require("../services/shipmentService");

exports.getAllShipments = async (req, res) => {
  try {
    const userId = req.user && req.user.user_id;
    const shipments = await shipmentService.getAllShipments(userId);
    res.json({
      success: true,
      data: shipments
    });
  } catch (error) {
    console.error("Error fetching shipments:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getShipmentByTracking = async (req, res) => {
  try {
    const { tracking_number } = req.params;
    const userId = req.user && req.user.user_id;
    const shipment = await shipmentService.getShipmentByTracking(tracking_number, userId);
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: "Shipment not found"
      });
    }

    res.json({
      success: true,
      data: shipment
    });
  } catch (error) {
    console.error("Error fetching shipment:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.createShipment = async (req, res) => {
  try {
    const { customer_id, origin, destination, distance_km, service_type } = req.body;
    const owner_user_id = req.user && req.user.user_id;
    if (!customer_id || !origin || !destination || !distance_km || !service_type) {
      return res.status(400).json({
        success: false,
        error: "All fields (customer_id, origin, destination, distance_km, service_type) are required"
      });
    }

    if (!["Reguler", "Express"].includes(service_type)) {
      return res.status(400).json({
        success: false,
        error: "service_type must be 'Reguler' or 'Express'"
      });
    }

    const result = await shipmentService.createShipment({
      customer_id,
      origin,
      destination,
      distance_km,
      service_type,
      owner_user_id
    });

    res.status(201).json({
      success: true,
      data: result,
      message: "Shipment created successfully"
    });
  } catch (error) {
    console.error("Error creating shipment:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.assignCourier = async (req, res) => {
  try {
    const { id } = req.params;
    const { courier_id } = req.body;

    if (!courier_id) {
      return res.status(400).json({
        success: false,
        error: "courier_id is required"
      });
    }
    const userId = req.user && req.user.user_id;
    const result = await shipmentService.assignCourier(id, courier_id, userId);
    res.json({
      success: true,
      data: result,
      message: "Courier assigned successfully. Status updated to 'Dikirim' by trigger."
    });
  } catch (error) {
    console.error("Error assigning courier:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getDashboardStatus = async (req, res) => {
  try {
    const userId = req.user && req.user.user_id;
    const status = await shipmentService.getDashboardStatus(userId);
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error("Error fetching dashboard status:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getDashboardMetrics = async (req, res) => {
  try {
    const userId = req.user && req.user.user_id;
    const metrics = await shipmentService.getDashboardMetrics(userId);
    res.json({ success: true, data: metrics });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
