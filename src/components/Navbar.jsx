import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ toggleTheme }) => {
  const token = localStorage.getItem('token');
  const anonId = localStorage.getItem('anonova_id'); // ✅ FIXED: Declare this
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('anonova_id');
    navigate('/login');
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center">
      <div className="text-xl font-bold text-indigo-600 dark:text-indigo-300">Anonova</div>
      <div className="space-x-4 text-sm flex items-center">
        <Link to="/" className="hover:underline">Home</Link>
        <Link to="/chat" className="hover:underline">Chat</Link>
        <Link to="/blog" className="hover:underline">Blog</Link>
        <Link to="/friends" className="hover:underline">Friends</Link>
        <Link to="/about" className="hover:underline">About</Link>

        {anonId && (
          <Link to="/profile" className="hover:text-indigo-400">Profile</Link>
        )}

        {token ? (
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            Logout
          </button>
        ) : (
          <Link
            to="/login"
            className="bg-indigo-500 text-white px-3 py-1 rounded"
          >
            Login
          </Link>
        )}

        <button onClick={toggleTheme} className="ml-2 px-2 py-1 bg-indigo-500 text-white rounded">
          Toggle Theme
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
