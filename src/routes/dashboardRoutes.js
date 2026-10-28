const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authenticate = require('../middleware/authenticate');
const requireSessionTrust = require('../middleware/requireSessionTrust');

router.get('/summary', authenticate, requireSessionTrust, dashboardController.getSummary);

module.exports = router;
