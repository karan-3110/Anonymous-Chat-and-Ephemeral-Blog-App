// server/routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');

// Fetch user's blogs
router.get('/:anonId/blogs', async (req, res) => {
  try {
    const blogs = await Blog.find({ authorId: req.params.anonId }).sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    console.error('Error fetching user blogs:', err);
    res.status(500).json({ message: 'Failed to fetch user blogs' });
  }
});

// Fetch user's friends (placeholder)
router.get('/:anonId/friends', async (req, res) => {
  try {
    res.json([]); // TODO: implement actual friend data
  } catch (err) {
    console.error('Error fetching friends:', err);
    res.status(500).json({ message: 'Failed to fetch friends' });
  }
});

module.exports = router;
