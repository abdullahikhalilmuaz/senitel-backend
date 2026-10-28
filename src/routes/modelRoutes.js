const express = require('express');
const router = express.Router();
const modelController = require('../controllers/modelController');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const requireSessionTrust = require('../middleware/requireSessionTrust');

router.get('/status', authenticate, requireSessionTrust, requireRole(['admin']), modelController.getStatus);
router.get('/metrics', authenticate, requireSessionTrust, requireRole(['admin']), modelController.getMetrics);

module.exports = router;
