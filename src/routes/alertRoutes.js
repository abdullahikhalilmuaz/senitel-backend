const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const authenticate = require('../middleware/authenticate');

router.get('/', authenticate, alertController.listAlerts);

module.exports = router;
