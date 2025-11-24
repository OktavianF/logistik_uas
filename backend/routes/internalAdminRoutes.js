const express = require('express');
const router = express.Router();
const internalAdminController = require('../controllers/internalAdminController');

// POST /internal/create-admin
router.post('/create-admin', internalAdminController.createAdmin);

module.exports = router;
