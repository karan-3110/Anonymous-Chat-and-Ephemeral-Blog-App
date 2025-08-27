// src/pages/Profile.jsx
import React, { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { Navigate } from 'react-router-dom';

const Profile = () => {
  const anonId = localStorage.getItem('anonova_id');
  const token = localStorage.getItem('token');
  const [blogs, setBlogs] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!anonId) return;

    (async () => {
      try {
        const [bRes, fRes] = await Promise.all([
          fetch(`http://localhost:5000/api/profile/${anonId}/blogs`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`http://localhost:5000/api/profile/${anonId}/friends`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setBlogs(await bRes.json());
        setFriends(await fRes.json());
      } catch (e) {
        console.error('Profile load error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [anonId, token]);

  if (!anonId) return <Navigate to="/login" />;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-1">Your Profile</h2>
      <p className="text-sm text-gray-500 mb-6">
        Your ID: <span className="text-indigo-500 font-mono">{anonId}</span>
      </p>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Your Friends ({friends.length})</h3>
        {friends.length ? (
          friends.map((f, i) => <p key={i}>@{f}</p>)
        ) : (
          <p className="text-gray-500">You don’t have friends yet.</p>
        )}
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-2">Your Blogs ({blogs.length})</h3>
        {loading ? (
          <p>Loading...</p>
        ) : blogs.length ? (
          blogs.map((blog) => (
            <div key={blog._id} className="mb-4 bg-gray-100 dark:bg-gray-800 p-4 rounded shadow">
              <p className="text-md dark:text-white" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(blog.content) }} />
              <p className="text-xs text-gray-500">
                Posted on: {new Date(blog.createdAt).toLocaleString()}
              </p>
              <p className="text-xs text-orange-500">
                Expires in: {Math.max(0, Math.floor((new Date(blog.expiresAt) - Date.now()) / 60000))} mins
              </p>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                ❤️ {blog.likes} 👎 {blog.dislikes} 💬 {blog.comments.length}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">You haven’t posted any blogs.</p>
        )}
      </div>
    </div>
  );
};

export default Profile;
