const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const User = require('../models/User');

exports.getUserByAnonId = async (req, res) => {
  try {
    const user = await User.findOne({ anonId: req.params.anonId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ anonId: user.anonId });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.signup = async (req, res) => {
  const { email, password, anonId } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, anonId });
    const token = jwt.sign({ userId: user._id, anonId }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, anonId });
  } catch (err) {
    res.status(500).json({ error: 'Signup failed' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id, anonId: user.anonId }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, anonId: user.anonId });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};
