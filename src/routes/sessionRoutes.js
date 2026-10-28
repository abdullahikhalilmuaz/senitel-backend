const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const authenticate = require('../middleware/authenticate');
const requireSessionTrust = require('../middleware/requireSessionTrust');

router.get('/', authenticate, requireSessionTrust, sessionController.listSessions);
router.get('/:id', authenticate, requireSessionTrust, sessionController.getSession);
// Revocation remains available during restriction as a defensive action.
router.post('/:id/revoke', authenticate, sessionController.revokeSession);

module.exports = router;
