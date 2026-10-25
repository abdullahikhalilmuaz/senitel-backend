const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const authenticate = require('../middleware/authenticate');

router.get('/', authenticate, sessionController.listSessions);
router.get('/:id', authenticate, sessionController.getSession);
router.post('/:id/revoke', authenticate, sessionController.revokeSession);

module.exports = router;
