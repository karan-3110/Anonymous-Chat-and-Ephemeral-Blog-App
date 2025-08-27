const rateLimit = require('express-rate-limit');

const blogLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // limit each IP to 3 blog posts per minute
  message: 'Too many blog posts from this IP, please try again later.',
});

const likeLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 5, // limit each IP to 5 like/dislike requests per 10 seconds
  message: 'Too many interactions. Please wait a bit.',
});

const commentLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 5,
  message: 'Too many comments. Slow down.',
});

module.exports = {
  blogLimiter,
  likeLimiter,
  commentLimiter,
};
