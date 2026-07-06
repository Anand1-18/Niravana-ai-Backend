const express = require('express');
const { getChats, saveChat, deleteChat } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/').get(protect, getChats).post(protect, saveChat);
router.route('/:id').delete(protect, deleteChat);

module.exports = router;
