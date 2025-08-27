// server/models/chatSession.js
const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  participants: [String],  // anonId or socket IDs
  messages: [
    {
      sender: String,
      message: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 180  // Session expires after 3 minutes
  }
},{timestamps: true});

module.exports = mongoose.model('ChatSession', chatSessionSchema);
