const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authenticate = require('../middleware/authenticate');
const requireSessionTrust = require('../middleware/requireSessionTrust');

router.get('/', authenticate, requireSessionTrust, profileController.getProfile);
router.post('/enrolment/start', authenticate, requireSessionTrust, profileController.startEnrolment);

module.exports = router;
