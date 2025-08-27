import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { socket } from '../socket'; // ✅ shared socket

const Friend = () => {
  const [anonId, setAnonId] = useState('');
  const [friends, setFriends] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [incomingRequests, setIncomingRequests] = useState([]);

  // ✅ Get anonId and identify with server
  useEffect(() => {
    const storedId = localStorage.getItem('anonova_id');
    if (storedId) {
      setAnonId(storedId);
      socket.emit('identify', storedId);
      console.log('✅ Emitted identify:', storedId);
    }
  }, []);

  // ✅ Incoming friend chat request
  useEffect(() => {
    const handler = ({ from, timeout }) => {
      alert(`📩 ${from} wants to chat with you. Accept within ${timeout} seconds.`);
    };
    socket.on('incoming-chat-request', handler);
    return () => socket.off('incoming-chat-request', handler);
  }, []);

  // ✅ Fetch friends from DB
  const fetchFriends = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/friends/${anonId}`);
      const raw = res.data.friends || [];
      const formatted = raw.map(id => ({ anonId: id }));
      setFriends(formatted);
    } catch (err) {
      console.error('Failed to fetch friends', err);
    }
  };

  useEffect(() => {
    if (anonId) fetchFriends();
  }, [anonId]);

  // ✅ Handle incoming friend requests & accept responses
  useEffect(() => {
    const onReceiveRequest = ({ from }) => setIncomingRequests(prev => [...prev, from]);
    const onAccepted = ({ by }) => {
      fetchFriends();
    };

    socket.on('receive-friend-request', onReceiveRequest);
    socket.on('friend-request-accepted', onAccepted);

    return () => {
      socket.off('receive-friend-request', onReceiveRequest);
      socket.off('friend-request-accepted', onAccepted);
    };
  }, [anonId]);

  const handleSearch = async () => {
    if (!search.trim()) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/users/${search}`);
      setSearchResult(res.data?.anonId ? res.data : null);
    } catch {
      setSearchResult(null);
    }
  };

  const sendFriendRequest = (targetId) => {
    socket.emit('send-friend-request', { to: targetId, from: anonId });
  };

  const startChatWithFriend = (friendAnonId) => {
    socket.emit('request-friend-chat', {
      from: anonId,
      to: friendAnonId,
      timeout: 45
    });
  };

  const removeFriend = async (friendAnonId) => {
    try {
      await axios.post(`http://localhost:5000/api/friends/remove`, {
        anonId,
        friendId: friendAnonId
      });
      fetchFriends();
    } catch (err) {
      console.error('Error removing friend', err);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto text-gray-900 dark:text-white">
      <h2 className="text-2xl font-bold mb-4">Your Friends</h2>

      <div className="mb-4 flex gap-2">
        <input
          className="border px-2 py-1 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          type="text"
          placeholder="Search user ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          onClick={handleSearch}
        >
          Search
        </button>
      </div>

      {incomingRequests.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-300 dark:text-black rounded">
          <h3 className="font-semibold mb-2">Incoming Friend Requests</h3>
          {incomingRequests.map(fromId => (
            <div key={fromId} className="flex justify-between items-center mb-2">
              <span>{fromId}</span>
              <div>
                <button
                  className="bg-green-500 text-white px-2 py-1 rounded mr-2 hover:bg-green-600"
                  onClick={() => {
                    socket.emit('accept-friend-request', { from: fromId, to: anonId });
                    setIncomingRequests(prev => prev.filter(id => id !== fromId));
                  }}
                >
                  Accept
                </button>
                <button
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  onClick={() => {
                    socket.emit('deny-friend-request', { from: fromId, to: anonId });
                    setIncomingRequests(prev => prev.filter(id => id !== fromId));
                  }}
                >
                  Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {searchResult && (
        <div className="bg-gray-200 dark:bg-gray-700 dark:text-white p-3 mb-4 rounded shadow">
          <div>{searchResult.anonId}</div>
          <button
            className="mt-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
            onClick={() => sendFriendRequest(searchResult.anonId)}
          >
            Send Friend Request
          </button>
        </div>
      )}

      <ul className="space-y-2">
        {friends.map(friend => (
          <li key={friend.anonId} className="bg-gray-100 dark:bg-gray-800 dark:text-white p-3 rounded flex justify-between items-center">
            <span>{friend.anonId}</span>
            <div className="space-x-2">
              <button
                onClick={() => startChatWithFriend(friend.anonId)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
              >
                Chat
              </button>
              <button
                onClick={() => removeFriend(friend.anonId)}
                className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Friend;
