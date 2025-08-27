const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
  anonId: { type: String, unique: true, required: true },
  friends: [{ type: String, default: [] }],
});

module.exports = mongoose.model('Friend', friendSchema);
