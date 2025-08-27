const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // You are hashing passwords
const AnonUser = require('../models/AnonUser');

// Utility function to generate anonId
function generateAnonId() {
  return 'anon_' + Math.random().toString(36).substring(2, 10);
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await AnonUser.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate unique anonId
    let anonId;
    let isUnique = false;
    while (!isUnique) {
      anonId = generateAnonId();
      const existing = await AnonUser.findOne({ anonId });
      if (!existing) isUnique = true;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new AnonUser({
      email,
      password: hashedPassword,
      anonId,
    });

    await newUser.save();

    res.status(201).json({ anonId });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error during signup' });
  }
});
// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await AnonUser.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      token,
      anonId: user.anonId
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
});


module.exports = router;
