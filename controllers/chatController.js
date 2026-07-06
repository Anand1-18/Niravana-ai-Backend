const Chat = require('../models/Chat');

const getChats = async (req, res) => {
    try {
        const chats = await Chat.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const saveChat = async (req, res) => {
    const { prompt, code } = req.body;

    try {
        const chat = await Chat.create({
            user: req.user._id,
            prompt,
            code,
        });

        res.status(201).json(chat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteChat = async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.id);

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        if (chat.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await chat.deleteOne();
        res.json({ message: 'Chat removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getChats, saveChat, deleteChat };
