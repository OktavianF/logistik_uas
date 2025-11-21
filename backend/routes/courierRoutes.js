const express = require("express");
const router = express.Router();
const courierController = require("../controllers/courierController");
const authMiddleware = require("../middleware/authMiddleware");

// protect courier routes
router.use(authMiddleware);

router.get("/", courierController.getAllCouriers);
router.get("/:id", courierController.getCourierById);
router.post("/", courierController.createCourier);
router.put("/:id", courierController.updateCourier);
router.delete("/:id", courierController.deleteCourier);

module.exports = router;
