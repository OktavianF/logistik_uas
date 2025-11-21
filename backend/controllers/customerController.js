const customerService = require("../services/customerService");

exports.getAllCustomers = async (req, res) => {
  try {
    const userId = req.user ? (req.user.user_id || req.user.userId || req.user.userId) : null;
    const customers = await customerService.getAllCustomers(userId);
    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? (req.user.user_id || req.user.userId) : null;
    const customer = await customerService.getCustomerById(id, userId);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found"
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const { name, address, phone } = req.body;
    
    // Validasi input
    if (!name || !address || !phone) {
      return res.status(400).json({
        success: false,
        error: "All fields (name, address, phone) are required"
      });
    }
    const ownerUserId = req.user ? (req.user.user_id || req.user.userId) : null;
    const result = await customerService.createCustomer({ name, address, phone, owner_user_id: ownerUserId });
    res.status(201).json({
      success: true,
      data: result,
      message: "Customer created successfully"
    });
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone } = req.body;

    if (!name || !address || !phone) {
      return res.status(400).json({
        success: false,
        error: "All fields (name, address, phone) are required"
      });
    }
    const ownerUserId = req.user ? (req.user.user_id || req.user.userId) : null;
    const result = await customerService.updateCustomer(id, { name, address, phone }, ownerUserId);
    res.json({
      success: true,
      data: result,
      message: "Customer updated successfully"
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerUserId = req.user ? (req.user.user_id || req.user.userId) : null;
    await customerService.deleteCustomer(id, ownerUserId);
    res.json({
      success: true,
      message: "Customer deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
