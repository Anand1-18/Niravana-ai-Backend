const express = require('express');
const { generateWebsite } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware'); // Optional: if you want it protected

const router = express.Router();

// This route is public to allow guest website generations.
// History saving logic is handled on the frontend if a user is logged in.

router.post('/generate', generateWebsite);

module.exports = router;
