import React, { useEffect, useState } from 'react';
import { socket } from '../socket';
import ChatBox from '../components/ChatBox';
import Friend from './Friend';

const Chat = () => {
  const [onlineCount, setOnlineCount] = useState(0);
  const [inChat, setInChat] = useState(false);
  const [room, setRoom] = useState('');
  const [token, setToken] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [messages, setMessages] = useState([]);
  const [noteVisible, setNoteVisible] = useState(true);
  const [searching, setSearching] = useState(false);

  const anonId = localStorage.getItem('anonova_id'); // Persistent anon ID

  useEffect(() => {
    // Request online count right away if socket is already connected
    if (socket.connected) {
      socket.emit('get-online-count');
    }

    // Handle stored chat session
    const storedRoom = localStorage.getItem('chatRoom');
    const storedToken = localStorage.getItem('chatToken');
    const storedPartner = localStorage.getItem('chatPartner');

    if (storedRoom && storedToken && storedPartner) {
      setRoom(storedRoom);
      setToken(storedToken);
      setPartnerId(storedPartner);
      setInChat(true);
      socket.emit('rejoin-room', {
        room: storedRoom,
        token: storedToken,
        anonId: anonId,
      });
    }

    
    
socket.on("chat-ended", () => {
      console.log("📥 Received 'chat-ended' from server");
      const systemMsg = {
        sender: "system",
        message: "❌ The other user has ended the chat.",
        fromSelf: false,
        system:true,
      };

      setMessages((prev) => [...prev, systemMsg]);

      setTimeout(() => {
        setMessages((prev) =>
          prev.filter((msg) => msg.message !== systemMsg.message)
        );
      }, 2000);

      // Clear state
      setRoom("");
      setToken("");
      setPartnerId("");
      setInChat(false);
      localStorage.removeItem("chatRoom");
      localStorage.removeItem("chatToken");
      localStorage.removeItem("chatPartner");
    });


    socket.on('rejoin-failed', () => {
      console.log("🔁 Rejoin failed, clearing local session");
      setInChat(false);
      setRoom('');
      setToken('');
      setPartnerId('');
      setMessages([]);
      localStorage.removeItem('chatRoom');
      localStorage.removeItem('chatToken');
      localStorage.removeItem('chatPartner');
    });


    // On socket connect
    socket.on('connect', () => {
      console.log('🧠 Socket connected');
      socket.emit('get-online-count');

      const storedRoom = localStorage.getItem('chatRoom');
      const storedToken = localStorage.getItem('chatToken');
      const storedAnon = localStorage.getItem('anonova_id');

      if (storedRoom && storedToken && storedAnon) {
        socket.emit('rejoin-room', {
          room: storedRoom,
          token: storedToken,
          anonId: storedAnon,
        });
      }
    });


    socket.on('online-count', setOnlineCount);

    socket.on('chat-start', ({ room, partnerA, partnerB, token }) => {
      const myId = anonId;
      const otherId = myId === partnerA ? partnerB : partnerA;

      setRoom(room);
      setToken(token);
      setPartnerId(otherId);
      setInChat(true);
      setSearching(false);
      setMessages([]);
      setNoteVisible(true);

      localStorage.setItem('chatRoom', room);
      localStorage.setItem('chatToken', token);
      localStorage.setItem('chatPartner', otherId);

      setTimeout(() => setNoteVisible(false), 8000);
    });

    socket.on("chat-history", (chatHistory) => {
      const currentUserId = localStorage.getItem("anonova_id");


      if (!chatHistory || !Array.isArray(chatHistory)) {
        console.warn("Invalid chat history received:", chatHistory);
        return;
      }

      const formattedMessages = chatHistory.map((msg) => {
        if (!msg.sender) {
          // fallback: assume unknown sender
          return { ...msg, fromSelf: false };
        }

        return {
          ...msg,
          fromSelf: msg.sender === currentUserId
        };
      });

      setMessages(formattedMessages);
    });




    return () => {
      socket.off('online-count');
      socket.off('chat-start');
      socket.off('chat-history');
      socket.off('connect');
      socket.off('chat-ended');
    };
  }, []);

  const handleStartChat = () => {
    if (!inChat && !room) {
      socket.emit('find-partner', { anonId });
      setSearching(true);
    }
  };

  const handleEndChat = () => {
    console.log('📴 User intentionally ended chat');
    const tok = localStorage.getItem('chatToken');
    if (tok) socket.emit('end-chat', tok, anonId);

    setRoom('');
    setToken('');
    setPartnerId('');
    setMessages([]);
    setInChat(false);
    localStorage.removeItem('chatRoom');
    localStorage.removeItem('chatToken');
    localStorage.removeItem('chatPartner');
  };

  return (
    <div className="p-6 max-w-xl mx-auto text-center text-white">
      <h1 className="text-2xl font-bold mb-4">🟢 Online Users: {onlineCount}</h1>

      {!inChat && !searching && (
        <button
          onClick={handleStartChat}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
        >
          Chat with Random User
        </button>
      )}

      {searching && (
        <p className="mt-4 animate-pulse">
          🔍 Searching for a partner...
        </p>
      )}

      {inChat && (
        <>
          {noteVisible && (
            <p className="bg-yellow-200 text-black p-4 rounded-lg mb-4">
              ⚠️ This chat is temporarily stored. Please avoid sharing personal details.
            </p>
          )}
          <p className="mb-2">
            💬 Connected with: <strong>{partnerId}</strong>
          </p>
          <button
            onClick={handleEndChat}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 mb-4 rounded"
          >
            End Chat
          </button>

          <ChatBox
            socket={socket}
            room={room}
            token={token}
            messages={messages}
            setMessages={setMessages}
            anonId={anonId}
            connectedUserId={partnerId}
            friendId={partnerId}
          />
          {/* <Friend storedId={anonId}/> */}
        </>
      )}
    </div>
  );
};

export default Chat;
