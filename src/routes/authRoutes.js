const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const { authLimiter } = require('../middleware/rateLimits');

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/logout', authenticate, authController.logout);
// These recovery endpoints deliberately remain available to a restricted session.
router.post('/verify-step-up', authLimiter, authenticate, authController.verifyStepUp);
router.post('/request-verification-code', authLimiter, authenticate, authController.requestVerificationCode);
router.post('/verify-otp', authLimiter, authenticate, authController.verifyRestrictedCode);
router.get('/me', authenticate, authController.me);

module.exports = router;
