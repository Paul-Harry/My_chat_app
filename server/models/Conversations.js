const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
    members: {
        type: Array,
        required: true
    },
});

const Conversation = mongoose.model('Conversation', ConversationSchema);

module.exports = Conversation;