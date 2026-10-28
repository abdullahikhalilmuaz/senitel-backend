const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const authenticate = require('../middleware/authenticate');
const requireSessionTrust = require('../middleware/requireSessionTrust');

router.get('/', authenticate, requireSessionTrust, alertController.listAlerts);

module.exports = router;
