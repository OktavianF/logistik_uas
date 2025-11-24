const shipmentService = require("../services/shipmentService");

exports.getAllShipments = async (req, res) => {
  try {
    // Only apply a customer filter when the authenticated role is a customer.
    const role = req.user && req.user.role;
    const customerFilter = role === 'customer' ? req.user.user_id : null;
    const shipments = await shipmentService.getAllShipments(customerFilter);
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
    // Only restrict by customer when caller is a customer
    const role = req.user && req.user.role;
    const customerFilter = role === 'customer' ? req.user.user_id : null;
    const shipment = await shipmentService.getShipmentByTracking(tracking_number, customerFilter);
    
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
    const { customer_id, origin, destination, distance_km, service_type, courier_id } = req.body;
    // For admin-created shipments, the admin's id is expected in the JWT as user_id
    const created_by_admin_id = req.user && req.user.user_id;
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
      courier_id: courier_id ?? null,
      origin,
      destination,
      distance_km,
      service_type,
      created_by_admin_id
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
    const result = await shipmentService.assignCourier(id, courier_id);
    res.json({
      success: true,
      data: result,
      message: "Courier assigned successfully. Status updated to 'Dalam Pengiriman' by trigger."
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
    const role = req.user && req.user.role;
    const customerFilter = role === 'customer' ? req.user.user_id : null;
    const status = await shipmentService.getDashboardStatus(customerFilter);
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
    const role = req.user && req.user.role;
    const customerFilter = role === 'customer' ? req.user.user_id : null;
    const metrics = await shipmentService.getDashboardMetrics(customerFilter);
    res.json({ success: true, data: metrics });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getShipmentsByCourier = async (req, res) => {
  try {
    // Accept courier_id from URL param, query string, or use authenticated courier's id
    const paramCourierId = req.params && (req.params.courier_id || req.params.courierId);
    const queryCourierId = req.query && (req.query.courier_id || req.query.courierId);
    const role = req.user && req.user.role;
    const authCourierId = role === 'courier' ? (req.user.user_id || req.user.courier_id) : null;

    const courier_id = paramCourierId || queryCourierId || authCourierId;

    if (!courier_id) {
      return res.status(400).json({
        success: false,
        error: "courier_id is required"
      });
    }

    const shipments = await shipmentService.getShipmentsByCourier(courier_id);
    res.json({
      success: true,
      data: shipments
    });
  } catch (error) {
    console.error("Error fetching courier shipments:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.updateShipmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: "status is required"
      });
    }

    const validStatuses = ['Diproses', 'Dalam Pengiriman', 'Terkirim'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const result = await shipmentService.updateShipmentStatus(id, status, notes);
    res.json({
      success: true,
      data: result,
      message: "Status updated successfully"
    });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getShipmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const shipment = await shipmentService.getShipmentById(id);
    
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