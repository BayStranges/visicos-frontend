import { io } from "socket.io-client";

const socket = io("http://localhost:3001"); // backend WS server

export default socket;
