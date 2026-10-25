const express = require('express');
const router = express.Router();
const modelController = require('../controllers/modelController');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');

router.get('/status', authenticate, requireRole(['admin']), modelController.getStatus);
router.get('/metrics', authenticate, requireRole(['admin']), modelController.getMetrics);

module.exports = router;
