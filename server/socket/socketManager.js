const ChatSession = require('../models/chatSession');
const Friend = require('../models/friendModel');

const onlineUsers = new Map();
const waitingQueue = [];
const chatRooms = new Map(); // token -> participants
const socketToToken = new Map(); // socket.id -> token

const addFriendship = async (user1Id, user2Id) => {
  try {
    if (!user1Id || !user2Id) {
      console.error("❌ Missing user IDs for friendship:", user1Id, user2Id);
      return;
    }

    const user1 = await Friend.findOneAndUpdate(
      { anonId: user1Id },
      { $addToSet: { friends: user2Id } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const user2 = await Friend.findOneAndUpdate(
      { anonId: user2Id },
      { $addToSet: { friends: user1Id } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log("✅ Friendship added between", user1Id, "and", user2Id);
  } catch (err) {
    console.error("🔥 Error adding friendship:", err);
  }
};

function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log('💬 User connected:', socket.id);

    socket.on('identify', (anonId) => {
      socket.anonId = anonId;
      onlineUsers.set(anonId, socket);
      console.log(`✅ User ${anonId} identified with socket ${socket.id}`);
      io.emit('online-count', onlineUsers.size);
    });

    socket.on('get-online-count', () => {
      socket.emit('online-count', onlineUsers.size);
    });

    socket.on('rejoin-room', async ({ room, token, anonId }) => {
      if (!room || !token || !anonId) {
        socket.emit('rejoin-failed');
        return;
      }

      socket.join(room);
      socketToToken.set(socket.id, token);

      const session = await ChatSession.findOne({ token });
      if (session && session.participants.includes(anonId)) {
        chatRooms.set(token, session.participants);
        console.log(`🔁 ${anonId} rejoined room ${room}`);
        socket.emit('chat-history', session.messages);
      } else {
        console.log(`❌ Rejoin failed for ${anonId}`);
        socket.emit('rejoin-failed');
      }
    });

    socket.on('find-partner', async ({ anonId }) => {
      if (!anonId) return;
      socket.anonId = anonId;

      if (waitingQueue.length > 0) {
        const partner = waitingQueue.shift();

        const participants = [anonId, partner.anonId].sort(); // sorting to avoid mismatch
        const room = `chat_${participants[0]}_${participants[1]}`;
        const token = room;

        if (!room) {
          console.error('❌ Failed to create room, room is undefined');
          return;
        }

        socket.join(room);
        io.to(partner.socketId).socketsJoin(room);
        socketToToken.set(socket.id, token);
        socketToToken.set(partner.socketId, token);
        chatRooms.set(token, participants);

        await ChatSession.findOneAndUpdate(
          { token },
          { token, participants, messages: [] },
          { upsert: true, new: true }
        );

        io.to(room).emit('chat-start', {
          room,
          partnerA: anonId,
          partnerB: partner.anonId,
          token,
          note: '⚠️ This chat is temporarily stored for safety. Please avoid sharing personal info.',
        });
      } else {
        waitingQueue.push({ socketId: socket.id, anonId });
        console.log(`🔍 ${anonId} is waiting for a partner`);
      }
    });

    socket.on('send-friend-request', ({ to, from }) => {
      const targetSocket = Array.from(onlineUsers.values()).find(sock => sock.anonId === to);
      if (targetSocket) {
        targetSocket.emit('receive-friend-request', { from });
      }
    });

    socket.on('request-friend-chat', ({ from, to, timeout }) => {
      const targetSocket = Array.from(onlineUsers.values()).find(sock => sock.anonId === to);
      if (targetSocket) {
        targetSocket.emit('incoming-chat-request', { from, timeout });
        console.log(`📩 Chat request from ${from} to ${to}`);
      } else {
        console.log(`❌ Cannot send chat request. ${to} is offline or not registered`);
      }
    });


    socket.on('accept-friend-request', async ({ from, to }) => {
      // Add both users as friends in DB (see below)
      await addFriendship(from, to);

      const fromSocket = [...onlineUsers.entries()].find(([_, s]) => s.anonId === from)?.[0];
      if (fromSocket && onlineUsers.has(fromSocket)) {
        onlineUsers.get(fromSocket).emit('friend-request-accepted', { by: to });
      }
    });

    socket.on('deny-friend-request', ({ from, to }) => {
      const fromSocket = [...onlineUsers.entries()].find(([_, s]) => s.anonId === from)?.[0];
      if (fromSocket && onlineUsers.has(fromSocket)) {
        onlineUsers.get(fromSocket).emit('friend-request-denied', { by: to });
      }
    });

    socket.on('chat-message', async ({ room, message, token, anonId }) => {
      if (!token || !anonId || !room) return;

      const msg = { sender: anonId, message, timestamp: new Date() };
      socket.to(room).emit('chat-message', msg);

      await ChatSession.findOneAndUpdate(
        { token },
        { $push: { messages: msg } },
        { new: true }
      );
    });

    socket.on('load-chat-history', async (token) => {
      if (!token) return;
      const session = await ChatSession.findOne({ token });
      if (session) {
        socket.emit('chat-history', session.messages);
      }
    });

    socket.on('end-chat', async (token, senderAnonId) => {
      if (!token || !chatRooms.has(token)) return;

      const participants = chatRooms.get(token);
      const otherUser = participants.find(id => id !== senderAnonId);

      for (const [sockId, sock] of onlineUsers.entries()) {
        const currentToken = socketToToken.get(sockId);
        if (currentToken === token && sock.anonId !== senderAnonId) {
          sock.emit('chat-ended');
        }
      }

      chatRooms.delete(token);
      for (const [sid, tok] of socketToToken.entries()) {
        if (tok === token) socketToToken.delete(sid);
      }
    });

    socket.on('disconnect', () => {
      console.log('🚪 User disconnected:', socket.id);

      if (socket.anonId && onlineUsers.has(socket.anonId)) {
        onlineUsers.delete(socket.anonId);
        console.log(`👋 ${socket.anonId} went offline`);
      }

      const index = waitingQueue.findIndex(u => u.socketId === socket.id);
      if (index !== -1) waitingQueue.splice(index, 1);

      const token = socketToToken.get(socket.id);
      if (token) {
        io.to(token).emit('partner-left');
        chatRooms.delete(token);
        socketToToken.delete(socket.id);
      }

      io.emit('online-count', onlineUsers.size);
    });
  });
}

module.exports = { setupSocket };
