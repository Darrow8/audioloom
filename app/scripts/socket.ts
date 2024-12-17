import { io } from "socket.io-client";
import { env } from '../config/env';

export const socket = io(env.BASE_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
});
