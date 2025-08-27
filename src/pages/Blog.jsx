import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import CommentBox from '../components/CommentBox'; // Adjust path if needed
import DOMPurify from 'dompurify';

const Blog = () => {
  const token = localStorage.getItem('token');
  const anonId = localStorage.getItem('anonova_id');
  const [blogs, setBlogs] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  const API_BASE = 'http://localhost:5000/api/blogs';

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const res = await fetch(API_BASE);
      const data = await res.json();
      setBlogs(data);
    } catch (err) {
      console.error('Failed to fetch blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  const postBlog = async () => {
    if (!content.trim()) return;
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ authorId: anonId, content }),
      });
      if (res.ok) {
        setContent('');
        fetchBlogs();
      }
    } catch (err) {
      console.error('Failed to post blog:', err);
    }
  };

  const likeBlog = async (id) => {
    try {
      await fetch(`${API_BASE}/${id}/like`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'anon-id': anonId,
          'Authorization': `Bearer ${token}`,
        },
      });
      fetchBlogs();
    } catch (err) {
      console.error('Failed to like blog:', err);
    }
  };

  const dislikeBlog = async (id) => {
    try {
      await fetch(`${API_BASE}/${id}/dislike`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'anon-id': anonId,
          'Authorization': `Bearer ${token}`,
        },
      });
      fetchBlogs();
    } catch (err) {
      console.error('Failed to dislike blog:', err);
    }
  };

  const commentOnBlog = async (id, text) => {
    if (!text.trim()) return;
    try {
      await fetch(`${API_BASE}/${id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ commenterId: anonId, text }),
      });
      fetchBlogs();
    } catch (err) {
      console.error('Failed to comment:', err);
    }
  };

  if (!token) return <Navigate to="/login" />;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Write a Blog</h2>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        className="w-full p-3 border rounded bg-white dark:bg-gray-800 text-black dark:text-white"
        rows={4}
      />
      <button
        onClick={postBlog}
        className="bg-indigo-600 text-white px-4 py-2 rounded"
      >
        Post Anonymously
      </button>

      <hr className="my-4" />

      <h3 className="text-xl font-semibold mb-2">Recent Blogs</h3>
      {loading ? (
        <p>Loading...</p>
      ) : blogs.length === 0 ? (
        <p>No blogs found.</p>
      ) : (
        blogs.map((blog) => (
          <div key={blog._id} className="bg-gray-100 dark:bg-gray-800 p-4 rounded shadow">
            <p className="text-sm text-indigo-500 mb-1">By: {blog.authorId}</p>
            <p
              className="text-lg mb-2"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(blog.content) }}
            />

            <p className="text-sm text-gray-400 mb-2">Posted: {new Date(blog.createdAt).toLocaleString()}</p>
            <p className="text-sm text-orange-600 mb-2">
              Expires in: {Math.max(0, Math.floor((new Date(blog.expiresAt) - Date.now()) / (1000 * 60)))} mins
            </p>

            <button onClick={() => likeBlog(blog._id)} className="mr-3 text-indigo-600 hover:underline">
              ❤️ {blog.likes} Like
            </button>
            <button onClick={() => dislikeBlog(blog._id)} className="text-red-500 hover:underline">
              👎 {blog.dislikes} Dislike
            </button>

            <div className="mt-3">
              <h4 className="font-semibold">Comments:</h4>
              {blog.comments.map((c, i) => (
                <p key={i} className="text-sm ml-2 text-gray-700 dark:text-gray-300">
                  <strong>{c.commenterId}:</strong>{' '}
                  <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(c.text) }} />
                </p>
              ))}
              <CommentBox onSubmit={(text) => commentOnBlog(blog._id, text)} />
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Blog;
