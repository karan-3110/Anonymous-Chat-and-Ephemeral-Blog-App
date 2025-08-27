import { io } from 'socket.io-client';

// ✅ Force websocket transport
export const socket = io('http://localhost:5000', {
  transports: ['websocket'],
  reconnection: true,
});
