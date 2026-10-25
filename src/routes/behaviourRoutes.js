const express = require('express');
const router = express.Router();
const behaviourController = require('../controllers/behaviourController');
const authenticate = require('../middleware/authenticate');

router.post('/batches', authenticate, behaviourController.submitBatch);

module.exports = router;
