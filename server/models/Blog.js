const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  authorId: String,
  content: String,
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] },
  dislikedBy: { type: [String], default: [] },
  comments: [
    {
      commenterId: String,
      text: String,
      timestamp: { type: Date, default: Date.now }
    }
  ],
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 36 * 60 * 60 * 1000), // 36 hours from now
    index: { expires: 0 } // TTL index to auto-delete
  }
}, { timestamps: true });

module.exports = mongoose.model('Blog', blogSchema);
