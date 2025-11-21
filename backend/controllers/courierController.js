const courierService = require("../services/courierService");

exports.getAllCouriers = async (req, res) => {
  try {
    const userId = req.user && req.user.user_id;
    const couriers = await courierService.getAllCouriers(userId);
    res.json({
      success: true,
      data: couriers
    });
  } catch (error) {
    console.error("Error fetching couriers:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getCourierById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user && req.user.user_id;
    const courier = await courierService.getCourierById(id, userId);
    
    if (!courier) {
      return res.status(404).json({
        success: false,
        error: "Courier not found"
      });
    }

    res.json({
      success: true,
      data: courier
    });
  } catch (error) {
    console.error("Error fetching courier:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.createCourier = async (req, res) => {
  try {
    const { name, phone, region } = req.body;
    const owner_user_id = req.user && req.user.user_id;
    
    if (!name || !phone || !region) {
      return res.status(400).json({
        success: false,
        error: "All fields (name, phone, region) are required"
      });
    }

    const result = await courierService.createCourier({ name, phone, region, owner_user_id });
    res.status(201).json({
      success: true,
      data: result,
      message: "Courier created successfully"
    });
  } catch (error) {
    console.error("Error creating courier:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.updateCourier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, region } = req.body;
    const userId = req.user && req.user.user_id;

    if (!name || !phone || !region) {
      return res.status(400).json({
        success: false,
        error: "All fields (name, phone, region) are required"
      });
    }

    const result = await courierService.updateCourier(id, { name, phone, region }, userId);
    res.json({
      success: true,
      data: result,
      message: "Courier updated successfully"
    });
  } catch (error) {
    console.error("Error updating courier:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.deleteCourier = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user && req.user.user_id;
    await courierService.deleteCourier(id, userId);
    res.json({
      success: true,
      message: "Courier deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting courier:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
