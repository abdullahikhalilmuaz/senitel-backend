const express = require('express');
const router = express.Router();
const behaviourController = require('../controllers/behaviourController');
const authenticate = require('../middleware/authenticate');
const requireSessionTrust = require('../middleware/requireSessionTrust');
const { behaviourLimiter } = require('../middleware/rateLimits');

// If this session has triggered step-up or restriction, further telemetry
// cannot silently continue as if the session were trusted.
router.post('/batches', authenticate, behaviourLimiter, requireSessionTrust, behaviourController.submitBatch);

module.exports = router;
