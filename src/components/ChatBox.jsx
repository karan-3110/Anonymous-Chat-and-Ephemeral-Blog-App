// ✅ FILE: src/components/ChatBox.jsx
import React, { useEffect, useRef, useState } from 'react';
import { socket } from '../socket';
import axios from 'axios';

const ChatBox = ({ room, token, messages, setMessages, anonId, connectedUserId, friendId }) => {

  const [input, setInput] = useState('');
  const [chatEnded, setChatEnded] = useState(false);
  const messagesEndRef = useRef(null);

  const sendMessage = () => {
    if (input.trim() === '' || !token) return;
    const msg = { sender: anonId, message: input };
    socket.emit('chat-message', { room, message: input, token, anonId });
    setMessages((prev) => [...prev, msg]); // locally add your own message
    setInput('');
  };

  useEffect(() => {
    socket.on('receive-friend-request', async ({ from }) => {
  const accept = window.confirm(`User ${from} wants to add you as a friend. Accept?`);
  
  if (accept) {
    socket.emit('accept-friend-request', { from, to: anonId });
    
    try {
      await axios.post('http://localhost:5000/api/friends/add', {
        anonId: anonId,
        friendId: from,
      });
      await axios.post('http://localhost:5000/api/friends/add', {
        anonId: from,
        friendId: anonId,
      });
      console.log('✅ Friendship saved to backend for both users.');
    } catch (err) {
      console.error('❌ Failed to save friend to backend:', err);
    }

  } else {
    socket.emit('deny-friend-request', { from, to: anonId });
  }
});


    socket.on('friend-request-accepted', ({ by }) => {
      alert(`🎉 Friend request accepted by ${by}`);
    });

    socket.on('friend-request-denied', ({ by }) => {
      alert(`❌ Friend request denied by ${by}`);
    });

    return () => {
      socket.off('receive-friend-request');
      socket.off('friend-request-accepted');
      socket.off('friend-request-denied');
    };
  }, []);


  useEffect(() => {
    const handleChatEnded = () => {
      console.log("📴 Chat was ended by the other user.");
      setMessages((prev) => [
        ...prev,
        { sender: "system", message: "The other user has ended the chat." },
      ]);
      setChatEnded(true); // Block further input
    };

    socket.on('chat-ended', handleChatEnded);

    return () => {
      socket.off('chat-ended', handleChatEnded);
    };
  }, [setMessages]);

  useEffect(() => {
    const handleMsg = ({ message, sender }) => {
      // Avoid echoing own message back again (optional safety)
      if (sender === anonId) return;

      setMessages((prev) => [
        ...prev,
        {
          sender,
          message,
        },
      ]);
    };

    socket.on('chat-message', handleMsg);
    return () => {
      socket.off('chat-message', handleMsg);
    };
  }, [anonId, setMessages]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col max-h-[60vh] h-full overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex-1 p-4 overflow-y-auto space-y-2">
        {connectedUserId && (
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 ml-2"
            onClick={() => socket.emit('send-friend-request', {
              to: connectedUserId,
              from: anonId
            })}
          >
            Add Friend
          </button>
        )}
        {messages.map((msg, idx) =>
          msg.sender === "system" ? (
            <div key={idx} className="text-center text-gray-500 italic text-sm">
              {msg.message}
            </div>
          ) : (
            <div
              key={idx}
              className={`flex ${msg.sender === anonId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`px-4 py-2 rounded-lg max-w-[70%] ${msg.sender === anonId
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white'
                  }`}
              >
                {msg.message}
              </div>
            </div>
          )
        )}




        <div ref={messagesEndRef} />
      </div>

      <div className="flex p-2 border-t bg-white dark:bg-gray-900">
        {chatEnded ? (
          <div className="w-full text-center text-red-400 py-3">
            The chat has ended. You cannot send messages.
          </div>
        ) : (
          <>
            <input
              type="text"
              className="flex-grow px-4 py-2 rounded-l-md border focus:outline-none text-black dark:text-white bg-white dark:bg-gray-800"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
          </>
        )}

        <button
          onClick={sendMessage}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-md"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
