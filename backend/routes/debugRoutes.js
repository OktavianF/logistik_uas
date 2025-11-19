const express = require('express');
const router = express.Router();
const debugController = require('../controllers/debugController');

router.get('/ping', debugController.ping);
router.get('/shipments-count', debugController.getShipmentsCount);

module.exports = router;
