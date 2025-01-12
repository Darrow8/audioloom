import { io, Socket } from "socket.io-client";
import { env } from '../config/env';

export let socket : Socket;

export function connectSocket() {
  let mode = env.ENV === "development" ? "dev" : "prod";

  socket = io(env.BASE_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    query: {
      env_mode: mode
    }
  });
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