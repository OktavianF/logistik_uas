const courierService = require("../services/courierService");

exports.getAllCouriers = async (req, res) => {
  try {
    const couriers = await courierService.getAllCouriers();
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
    const courier = await courierService.getCourierById(id);
    
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
    const { name, phone, region, password, email, username } = req.body;
    // creation is admin-only (route guarded).

    if (!name || !phone || !region) {
      return res.status(400).json({
        success: false,
        error: "All fields (name, phone, region) are required"
      });
    }

    // If password provided, hash it; otherwise create courier without login credentials
    const bcrypt = require('bcrypt');
    let password_hash = null;
    if (password) {
      password_hash = await bcrypt.hash(password, 10);
    }

    const result = await courierService.createCourier({ name, phone, region, password_hash, email, username });
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
    // admin-only route; no owner scoping

    if (!name || !phone || !region) {
      return res.status(400).json({
        success: false,
        error: "All fields (name, phone, region) are required"
      });
    }

    const result = await courierService.updateCourier(id, { name, phone, region });
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
    await courierService.deleteCourier(id);
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
