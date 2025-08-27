const mongoose = require('mongoose');

const anonUserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  anonId: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('AnonUser', anonUserSchema);
