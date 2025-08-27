const express = require('express');
const Blog = require('../models/Blog');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { blogLimiter, likeLimiter, commentLimiter } = require('../middleware/ratelimiter');

// Get all blogs
router.get('/', async (req, res) => {
  const blogs = await Blog.find().sort({ createdAt: -1 });
  res.json(blogs);
});

// GET blogs by specific user
router.get('/user/:anonId', async (req, res) => {
  try {
    const blogs = await Blog.find({ authorId: req.params.anonId }).sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    console.error('Error fetching user blogs:', err);
    res.status(500).json({ message: 'Failed to fetch user blogs' });
  }
});


// Post a blog
router.post('/', blogLimiter, blogController.createBlog);

// Like a blog
router.patch('/:id/like', likeLimiter, async (req, res) => {
  const anonId = req.headers['anon-id'];
  if (!anonId) return res.status(400).json({ message: 'Anon ID required' });

  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(404).json({ message: 'Blog not found' });

  const liked = blog.likedBy.includes(anonId);
  const disliked = blog.dislikedBy.includes(anonId);

  if (liked) {
    blog.likes -= 1;
    blog.likedBy.pull(anonId);
  } else {
    if (disliked) {
      blog.dislikes -= 1;
      blog.dislikedBy.pull(anonId);
    }
    blog.likes += 1;
    blog.likedBy.push(anonId);
  }

  await blog.save();
  res.json({ message: 'Like updated' });
});

// Dislike a blog
router.patch('/:id/dislike', likeLimiter, async (req, res) => {
  const anonId = req.headers['anon-id'];
  if (!anonId) return res.status(400).json({ message: 'Anon ID required' });

  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(404).json({ message: 'Blog not found' });

  const liked = blog.likedBy.includes(anonId);
  const disliked = blog.dislikedBy.includes(anonId);

  if (disliked) {
    blog.dislikes -= 1;
    blog.dislikedBy.pull(anonId);
  } else {
    if (liked) {
      blog.likes -= 1;
      blog.likedBy.pull(anonId);
    }
    blog.dislikes += 1;
    blog.dislikedBy.push(anonId);
  }

  await blog.save();
  res.json({ message: 'Dislike updated' });
});

// Comment on a blog
router.post('/:id/comment', commentLimiter, async (req, res) => {
  const { commenterId, text } = req.body;
  if (!commenterId || !text?.trim()) {
    return res.status(400).json({ message: 'Missing or empty comment' });
  }

  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(404).json({ message: 'Blog not found' });

  blog.comments.push({ commenterId, text });
  await blog.save();

  res.json(blog);
});



module.exports = router;
