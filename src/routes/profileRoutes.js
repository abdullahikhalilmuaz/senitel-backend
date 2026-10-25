const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authenticate = require('../middleware/authenticate');

router.get('/', authenticate, profileController.getProfile);
router.post('/enrolment/start', authenticate, profileController.startEnrolment);

module.exports = router;
