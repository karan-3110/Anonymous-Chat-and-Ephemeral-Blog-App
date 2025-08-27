const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  passwordHash: String, // bcrypt hashed
  googleId: String,     // for Google OAuth
  anonId: {type:String,unique:true,required:true},       // links to anonymous ID
  friends: [{ type: String }], // storing anonIds of friends

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
