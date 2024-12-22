import { io } from "socket.io-client";
import { env } from '../config/env';

export const socket = io(env.BASE_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
});


export function connectSocket() {
    const handleConnect = () => {
        console.log('Connected to socket server');
      };
  
      const handleDisconnect = (reason: string) => {
        console.log('Disconnected:', reason);
      };
  
      const handleError = (err: Error) => {
        console.error('Socket error:', err);
      };
  
      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('error', handleError);
}