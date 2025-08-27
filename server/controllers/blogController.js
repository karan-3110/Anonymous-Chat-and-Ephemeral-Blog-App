const Blog = require('../models/Blog');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

exports.createBlog = async (req, res) => {
  try {
    const { authorId, content } = req.body;

    if (!authorId || !content?.trim()) {
      return res.status(400).json({ message: 'Missing author or content' });
    }

    const sanitizedContent = DOMPurify.sanitize(content);

    const blog = new Blog({
      authorId,
      content: sanitizedContent
    });

    await blog.save();

    res.status(201).json(blog);
  } catch (err) {
    console.error('Error creating blog:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
