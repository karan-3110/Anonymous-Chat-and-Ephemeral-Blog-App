import React, { useState } from 'react';

const FriendCard = ({ friend, onRefresh }) => {
  const [requestSent, setRequestSent] = useState(false);
  const token = localStorage.getItem('token');

  const handleStartChat = async () => {
    setRequestSent(true);

    try {
      const res = await fetch('/api/friends/start-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ friendId: friend._id }),
      });

      const data = await res.json();

      if (data.accepted) {
        window.location.href = `/chat?with=${friend._id}`;
      } else {
        alert('Friend did not accept within 45 seconds.');
      }
    } catch (err) {
      alert('Failed to start chat.');
    } finally {
      setRequestSent(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!window.confirm('Remove this friend?')) return;

    try {
      await fetch('/api/friends/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ friendId: friend._id }),
      });

      onRefresh();
    } catch (err) {
      alert('Failed to remove friend.');
    }
  };

  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg shadow-md flex justify-between items-center">
      <div>
        <p className="text-lg font-semibold">{friend.anonId}</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleStartChat}
          disabled={requestSent}
          className={`px-4 py-1 rounded transition-colors duration-200 ${
            requestSent
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {requestSent ? 'Waiting...' : 'Chat'}
        </button>
        <button
          onClick={handleRemoveFriend}
          className="px-4 py-1 bg-red-600 hover:bg-red-700 rounded transition-colors duration-200"
        >
          Remove
        </button>
      </div>
    </div>
  );
};

export default FriendCard;
