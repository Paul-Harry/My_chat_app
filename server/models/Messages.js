const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: String,
    },
    senderId: {
        type: String
    },
    message: {
        type: String
    },
});

const Messages = mongoose.model('Message',messageSchema);

module.exports = Messages;