const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");
const authMiddleware = require("../middleware/authMiddleware");

// Protect all customer routes — user must be authenticated
router.use(authMiddleware);

router.get("/", customerController.getAllCustomers);
router.get("/:id", customerController.getCustomerById);
router.post("/", customerController.createCustomer);
router.put("/:id", customerController.updateCustomer);
router.delete("/:id", customerController.deleteCustomer);

module.exports = router;
