const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChatSchema = new Schema({
  name: { type: String, required: true },
  message: { type: String, required: true }
});

const Chat = mongoose.model('Chat', ChatSchema);
module.exports = Chat;
